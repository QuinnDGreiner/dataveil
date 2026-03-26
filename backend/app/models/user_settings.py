import secrets
from sqlalchemy import Column, String, Boolean, JSON, DateTime
from sqlalchemy.sql import func
from app.database import Base


def _gen_token() -> str:
    return secrets.token_urlsafe(32)


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id = Column(String, primary_key=True)
    enabled = Column(Boolean, default=True, nullable=False)
    enabled_categories = Column(
        JSON,
        default=lambda: [
            "ssn", "credit_card", "email", "phone",
            "dob", "passport", "ip_address", "street_address",
        ],
        nullable=False,
    )
    service_overrides = Column(JSON, default=dict, nullable=False)
    custom_rules = Column(JSON, default=list, nullable=False)
    keywords = Column(JSON, default=list, nullable=False)
    notification_style = Column(String, default="badge", nullable=False)
    theme_accent = Column(String, default="white", nullable=False)
    incognito = Column(Boolean, default=False, nullable=False)
    api_token = Column(String, default=_gen_token, nullable=False)
    stripe_customer_id = Column(String, nullable=True)
    plan = Column(String, default="free", nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
