"""
Integration tests for the audit log API.
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.auth import get_current_user


# Override auth for all tests
FREE_USER = {"user_id": "test-user-1", "email": "test@example.com", "plan": "free"}
PRO_USER = {"user_id": "test-user-2", "email": "pro@example.com", "plan": "pro"}


@pytest.fixture
def free_user():
    app.dependency_overrides[get_current_user] = lambda: FREE_USER
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def pro_user():
    app.dependency_overrides[get_current_user] = lambda: PRO_USER
    yield
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_create_log(free_user):
    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.post("/logs", json={
            "timestamp": "2026-03-25T12:00:00Z",
            "service": "ChatGPT",
            "totalRedactions": 3,
            "categories": [
                {"id": "email", "count": 1},
                {"id": "ssn", "count": 2},
            ],
        })
    assert res.status_code == 201
    data = res.json()
    assert data["service"] == "ChatGPT"
    assert data["total_redactions"] == 3


@pytest.mark.asyncio
async def test_list_logs_returns_paginated(free_user):
    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.get("/logs")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    async with AsyncClient(app=app, base_url="http://test") as client:
        res = await client.get("/logs")
    assert res.status_code == 403  # no auth header
