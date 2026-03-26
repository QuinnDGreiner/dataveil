from pydantic import BaseModel
from datetime import datetime
from typing import List
import uuid


class CategoryCount(BaseModel):
    id: str
    count: int


class AuditLogCreate(BaseModel):
    timestamp: datetime
    service: str
    totalRedactions: int
    categories: List[CategoryCount]


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    timestamp: datetime
    service: str
    total_redactions: int
    categories: List[CategoryCount]
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogPage(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
