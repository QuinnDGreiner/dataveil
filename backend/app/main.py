from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import logs, settings, billing, security, stats
from app.database import engine, Base
from app.config import settings as cfg

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Dataveil API",
    version="1.0.0",
    description="Backend for Dataveil — stores anonymized audit logs and user settings.",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_allowed_origins = [o.strip() for o in cfg.frontend_url.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.include_router(logs.router, prefix="/logs", tags=["Audit Logs"])
app.include_router(settings.router, prefix="/settings", tags=["Settings"])
app.include_router(billing.router, prefix="/billing", tags=["Billing"])
app.include_router(security.router, prefix="/security", tags=["Security"])
app.include_router(stats.router, prefix="/stats", tags=["Stats"])


@app.get("/health")
async def health():
    return {"status": "ok"}
