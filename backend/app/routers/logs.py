from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db
from app.auth import get_current_user, get_user_from_api_token
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate, AuditLogResponse, AuditLogPage
from datetime import datetime, timezone

router = APIRouter()


@router.post("", response_model=AuditLogResponse, status_code=201)
async def create_log(
    body: AuditLogCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Receive an anonymized metadata log entry from the browser extension."""
    log = AuditLog(
        user_id=user["user_id"],
        timestamp=body.timestamp,
        service=body.service,
        total_redactions=body.totalRedactions,
        categories=[c.model_dump() for c in body.categories],
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("", response_model=AuditLogPage)
async def list_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    limit: int = Query(None, ge=1, le=100),
    service: str = Query(None),
    user: dict = Depends(get_user_from_api_token),
    db: AsyncSession = Depends(get_db),
):
    """Return paginated audit log for the authenticated user."""
    query = select(AuditLog).where(AuditLog.user_id == user["user_id"])

    if service:
        query = query.where(AuditLog.service == service)

    # Free tier: last 7 days only
    if user.get("plan") == "free":
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        query = query.where(AuditLog.timestamp >= cutoff)

    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar()

    query = query.order_by(desc(AuditLog.timestamp))
    effective_limit = limit if limit else page_size
    query = query.offset((page - 1) * page_size).limit(effective_limit)

    result = await db.execute(query)
    items = result.scalars().all()

    return AuditLogPage(items=items, total=total, page=page, page_size=page_size)
