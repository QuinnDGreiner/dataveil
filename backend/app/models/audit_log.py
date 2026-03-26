from sqlalchemy import Column, String, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    service = Column(String, nullable=False)           # e.g. "ChatGPT"
    total_redactions = Column(Integer, nullable=False, default=0)
    categories = Column(JSON, nullable=False, default=list)  # [{id, count}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
