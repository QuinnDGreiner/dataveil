import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.auth import get_current_user
from app.models.user_settings import UserSettings
from app.config import settings as cfg

stripe.api_key = cfg.stripe_secret_key

router = APIRouter()

PRICE_IDS = {
    "pro": "price_pro_monthly",    # Replace with real Stripe price IDs
    "team": "price_team_monthly",
}


@router.post("/checkout")
async def create_checkout(
    plan: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if plan not in PRICE_IDS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user["user_id"])
    )
    row = result.scalar_one_or_none()

    session = stripe.checkout.Session.create(
        customer=row.stripe_customer_id if row else None,
        customer_email=user.get("email") if not (row and row.stripe_customer_id) else None,
        line_items=[{"price": PRICE_IDS[plan], "quantity": 1}],
        mode="subscription",
        success_url=f"{cfg.frontend_url}/billing?success=true",
        cancel_url=f"{cfg.frontend_url}/billing?canceled=true",
        metadata={"user_id": user["user_id"], "plan": plan},
    )

    return {"url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig, cfg.stripe_webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        plan = session["metadata"]["plan"]
        customer_id = session["customer"]

        result = await db.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
        row = result.scalar_one_or_none()
        if row:
            row.plan = plan
            row.stripe_customer_id = customer_id
            await db.commit()

    elif event["type"] == "customer.subscription.deleted":
        customer_id = event["data"]["object"]["customer"]
        result = await db.execute(
            select(UserSettings).where(UserSettings.stripe_customer_id == customer_id)
        )
        row = result.scalar_one_or_none()
        if row:
            row.plan = "free"
            await db.commit()

    return {"received": True}
