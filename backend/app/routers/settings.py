import secrets
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import get_current_user
from app.models.user_settings import UserSettings
from app.schemas.user_settings import UserSettingsRead, UserSettingsUpdate, ApiTokenResponse

router = APIRouter()


async def _get_or_create_settings(user_id: str, db: AsyncSession) -> UserSettings:
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    row = result.scalar_one_or_none()
    if not row:
        row = UserSettings(user_id=user_id)
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


@router.get("", response_model=UserSettingsRead)
async def get_settings(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _get_or_create_settings(user["user_id"], db)


@router.put("", response_model=UserSettingsRead)
async def update_settings(
    body: UserSettingsUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await _get_or_create_settings(user["user_id"], db)

    if body.enabled is not None:
        row.enabled = body.enabled
    if body.enabled_categories is not None:
        row.enabled_categories = body.enabled_categories
    if body.service_overrides is not None:
        row.service_overrides = body.service_overrides
    if body.custom_rules is not None:
        row.custom_rules = [r.model_dump() for r in body.custom_rules]
    if body.keywords is not None:
        row.keywords = [k[:40] for k in body.keywords[:50]]
    if body.notification_style is not None:
        row.notification_style = body.notification_style
    if body.theme_accent is not None:
        row.theme_accent = body.theme_accent
    if body.incognito is not None:
        row.incognito = body.incognito

    await db.commit()
    await db.refresh(row)
    return row


@router.get("/api-token", response_model=ApiTokenResponse)
async def get_api_token(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the user's API token (generates one if missing)."""
    row = await _get_or_create_settings(user["user_id"], db)
    if not row.api_token:
        row.api_token = secrets.token_urlsafe(32)
        await db.commit()
        await db.refresh(row)
    return ApiTokenResponse(api_token=row.api_token)


@router.post("/api-token/regenerate", response_model=ApiTokenResponse)
async def regenerate_api_token(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Issue a new API token, invalidating the previous one."""
    row = await _get_or_create_settings(user["user_id"], db)
    row.api_token = secrets.token_urlsafe(32)
    await db.commit()
    await db.refresh(row)
    return ApiTokenResponse(api_token=row.api_token)
