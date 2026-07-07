"""Notification stubs. Real integrations gracefully fall back to pending."""
import os
import logging

logger = logging.getLogger(__name__)


async def send_whatsapp_message(phone: str, message: str) -> dict:
    token = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
    phone_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
    if not token or not phone_id:
        logger.info(f"[WhatsApp PENDING] to={phone}: {message[:80]}")
        return {"status": "pending", "reason": "missing_keys"}
    # Real integration would go here (Meta Graph API call).
    return {"status": "pending", "reason": "integration_not_wired"}


async def send_push_notification(user_id: str, title: str, body: str) -> dict:
    if not os.environ.get("VAPID_PUBLIC_KEY"):
        logger.info(f"[Push PENDING] user={user_id}: {title}")
        return {"status": "pending", "reason": "missing_keys"}
    return {"status": "pending", "reason": "integration_not_wired"}


async def send_email_notification(email: str, subject: str, body: str) -> dict:
    if not os.environ.get("EMAIL_SERVER"):
        logger.info(f"[Email PENDING] to={email}: {subject}")
        return {"status": "pending", "reason": "missing_keys"}
    return {"status": "pending", "reason": "integration_not_wired"}


async def create_internal_notification(db, *, user_id: str = "", customer_id: str = "",
                                       kind: str = "info", title: str = "", body: str = "",
                                       link: str = "", channel: str = "internal") -> dict:
    from models import Notification
    n = Notification(
        user_id=user_id, customer_id=customer_id, kind=kind,
        title=title, body=body, link=link, channel=channel, status="sent"
    )
    doc = n.model_dump()
    await db.notifications.insert_one(doc)
    return doc


def render_template(tpl: str, ctx: dict) -> str:
    out = tpl
    for k, v in ctx.items():
        out = out.replace("{" + k + "}", str(v) if v is not None else "")
    return out
