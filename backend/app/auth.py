"""
JWT auth middleware — validates Supabase-issued JWTs or Dataveil API tokens.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.database import get_db

bearer_scheme = HTTPBearer()
bearer_scheme_optional = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        return {"user_id": user_id, "email": payload.get("email"), "plan": payload.get("plan", "free")}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def require_pro(user: dict = Depends(get_current_user)) -> dict:
    if user.get("plan") not in ("pro", "team"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required",
        )
    return user


async def get_user_from_api_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme_optional),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Accepts either a Supabase JWT or a Dataveil API token."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = credentials.credentials

    # Try Supabase JWT first
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub")
        if user_id:
            return {"user_id": user_id, "email": payload.get("email"), "plan": payload.get("plan", "free")}
    except JWTError:
        pass

    # Fall back to API token lookup
    from app.models.user_settings import UserSettings
    result = await db.execute(
        select(UserSettings).where(UserSettings.api_token == token)
    )
    row = result.scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return {"user_id": row.user_id, "plan": row.plan}
