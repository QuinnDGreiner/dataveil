from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.auth import get_user_from_api_token
from app.models.audit_log import AuditLog

router = APIRouter()


@router.get("")
async def get_stats(
    user: dict = Depends(get_user_from_api_token),
    db: AsyncSession = Depends(get_db),
):
    """Return blocked_today and prompts_scanned. Accepts JWT or API token."""
    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Blocked today = sum of redactions since midnight
    blocked_result = await db.execute(
        select(func.coalesce(func.sum(AuditLog.total_redactions), 0)).where(
            AuditLog.user_id == user["user_id"],
            AuditLog.timestamp >= day_start,
        )
    )
    blocked_today = blocked_result.scalar() or 0

    # Prompts scanned today = count of log entries since midnight
    prompts_result = await db.execute(
        select(func.count()).where(
            AuditLog.user_id == user["user_id"],
            AuditLog.timestamp >= day_start,
        )
    )
    prompts_scanned = prompts_result.scalar() or 0

    return {"blocked_today": blocked_today, "prompts_scanned": prompts_scanned}
