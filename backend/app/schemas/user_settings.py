from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class CustomRule(BaseModel):
    id: str
    label: str
    pattern: str = Field(max_length=200)
    placeholder: str


class UserSettingsRead(BaseModel):
    user_id: str
    enabled: bool
    enabled_categories: List[str]
    service_overrides: Dict[str, Any]
    custom_rules: List[CustomRule]
    keywords: List[str]
    notification_style: str
    theme_accent: str
    incognito: bool
    plan: str
    api_token: Optional[str] = None

    class Config:
        from_attributes = True


class ApiTokenResponse(BaseModel):
    api_token: str


class UserSettingsUpdate(BaseModel):
    enabled: Optional[bool] = None
    enabled_categories: Optional[List[str]] = None
    service_overrides: Optional[Dict[str, Any]] = None
    custom_rules: Optional[List[CustomRule]] = None
    keywords: Optional[List[str]] = Field(default=None, max_length=50)
    notification_style: Optional[str] = None
    theme_accent: Optional[str] = None
    incognito: Optional[bool] = None
