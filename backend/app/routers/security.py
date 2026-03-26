import httpx
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user

router = APIRouter()

HIBP_API = "https://haveibeenpwned.com/api/v3/breachedaccount/{email}?truncateResponse=false"
HIBP_HEADERS = {
    "User-Agent": "Dataveil-BreachChecker/1.0",
    "hibp-api-key": "",  # Free endpoint doesn't require key for basic use
}


@router.get("/breach-check")
async def breach_check(user: dict = Depends(get_current_user)):
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email on account")

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(
                HIBP_API.format(email=email),
                headers=HIBP_HEADERS,
            )
            if res.status_code == 404:
                return {"breaches": []}
            if res.status_code == 429:
                # Rate limited by HIBP — return gracefully
                return {"breaches": None, "error": "rate_limited"}
            if res.status_code != 200:
                return {"breaches": None, "error": "unavailable"}

            data = res.json()
            breaches = [
                {
                    "Name": b.get("Name"),
                    "BreachDate": b.get("BreachDate"),
                    "DataClasses": b.get("DataClasses", []),
                }
                for b in data
            ]
            return {"breaches": breaches}

    except httpx.TimeoutException:
        return {"breaches": None, "error": "timeout"}
    except Exception:
        return {"breaches": None, "error": "unavailable"}
