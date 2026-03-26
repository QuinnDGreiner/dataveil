import socket
from urllib.parse import urlparse, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings


def _resolve_ipv4(url: str) -> str:
    """Replace the hostname in a DB URL with its IPv4 address.
    Prevents asyncpg from trying IPv6 first in containers that lack IPv6 routing."""
    parsed = urlparse(url)
    host = parsed.hostname
    if not host:
        return url
    try:
        # AF_INET forces IPv4 only
        infos = socket.getaddrinfo(host, parsed.port or 5432, socket.AF_INET, socket.SOCK_STREAM)
        ipv4 = infos[0][4][0]
        # Rebuild the URL with the IPv4 address
        netloc = parsed.netloc.replace(host, ipv4)
        return urlunparse(parsed._replace(netloc=netloc))
    except Exception:
        return url  # Fall back to original URL if resolution fails


_db_url = _resolve_ipv4(settings.database_url)

engine = create_async_engine(_db_url, echo=False)

AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
