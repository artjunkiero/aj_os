"""Notification integrations with graceful fallback to pending."""

import logging
import os
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)


def normalize_whatsapp_phone(phone: str) -> str:
    """
    Transformă numere precum:
    0737334097
    +40 737 334 097
    0040 737 334 097

    în:
    40737334097
    """
    cleaned = re.sub(r"\D", "", phone or "")

    if cleaned.startswith("00"):
        cleaned = cleaned[2:]

    if cleaned.startswith("0"):
        cleaned = "40" + cleaned[1:]

    return cleaned


async def send_whatsapp_message(phone: str, message: str) -> dict[str, Any]:
    """
    Trimite un mesaj text simplu.

    Acest tip de mesaj poate fi trimis doar în fereastra de conversație
    de 24 de ore deschisă după ce clientul a scris către firmă.
    Pentru notificări inițiate de ART JUNKIE trebuie folosite template-uri.
    """
    token = os.environ.get("WHATSAPP_ACCESS_TOKEN", "").strip()
    phone_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    api_version = os.environ.get("WHATSAPP_API_VERSION", "v25.0").strip()

    if not token or not phone_id:
        logger.info("[WhatsApp PENDING] to=%s: %s", phone, message[:80])
        return {
            "status": "pending",
            "reason": "missing_keys",
        }

    recipient = normalize_whatsapp_phone(phone)

    if not recipient:
        return {
            "status": "failed",
            "reason": "invalid_phone",
        }

    url = (
        f"https://graph.facebook.com/"
        f"{api_version}/{phone_id}/messages"
    )

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message,
        },
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
            )

        data = response.json()

        if response.is_success:
            message_id = ""

            if data.get("messages"):
                message_id = data["messages"][0].get("id", "")

            logger.info(
                "[WhatsApp SENT] to=%s message_id=%s",
                recipient,
                message_id,
            )

            return {
                "status": "sent",
                "message_id": message_id,
                "recipient": recipient,
                "provider_response": data,
            }

        logger.error(
            "[WhatsApp FAILED] status=%s response=%s",
            response.status_code,
            data,
        )

        return {
            "status": "failed",
            "reason": "provider_error",
            "http_status": response.status_code,
            "provider_response": data,
        }

    except httpx.TimeoutException:
        logger.exception("[WhatsApp TIMEOUT] to=%s", recipient)

        return {
            "status": "failed",
            "reason": "timeout",
        }

    except httpx.HTTPError as exc:
        logger.exception("[WhatsApp HTTP ERROR] to=%s", recipient)

        return {
            "status": "failed",
            "reason": "http_error",
            "error": str(exc),
        }

    except Exception as exc:
        logger.exception("[WhatsApp ERROR] to=%s", recipient)

        return {
            "status": "failed",
            "reason": "unexpected_error",
            "error": str(exc),
        }


async def send_whatsapp_template(
    phone: str,
    template_name: str,
    language_code: str = "ro",
    parameters: list[str] | None = None,
    button_code: str | None = None,
) -> dict[str, Any]:
    token = os.environ.get("WHATSAPP_ACCESS_TOKEN", "").strip()
    phone_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    api_version = os.environ.get("WHATSAPP_API_VERSION", "v25.0").strip()

    if not token or not phone_id:
        logger.info(
            "[WhatsApp TEMPLATE PENDING] to=%s template=%s",
            phone,
            template_name,
        )
        return {
            "status": "pending",
            "reason": "missing_keys",
        }

    recipient = normalize_whatsapp_phone(phone)

    if not recipient:
        return {
            "status": "failed",
            "reason": "invalid_phone",
        }

    components = []

    if parameters:
        components.append(
            {
                "type": "body",
                "parameters": [
                    {
                        "type": "text",
                        "text": str(value),
                    }
                    for value in parameters
                ],
            }
        )

    if button_code:
        components.append(
            {
                "type": "button",
                "sub_type": "url",
                "index": "0",
                "parameters": [
                    {
                        "type": "text",
                        "text": str(button_code),
                    }
                ],
            }
        )

    payload = {
        "messaging_product": "whatsapp",
        "to": recipient,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": language_code,
            },
        },
    }

    if components:
        payload["template"]["components"] = components

    url = (
        f"https://graph.facebook.com/"
        f"{api_version}/{phone_id}/messages"
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
            )

        data = response.json()

        if response.is_success:
            message_id = ""

            if data.get("messages"):
                message_id = data["messages"][0].get("id", "")

            logger.info(
                "[WhatsApp TEMPLATE SENT] to=%s template=%s message_id=%s",
                recipient,
                template_name,
                message_id,
            )

            return {
                "status": "sent",
                "message_id": message_id,
                "recipient": recipient,
                "template": template_name,
                "provider_response": data,
            }

        logger.error(
            "[WhatsApp TEMPLATE FAILED] status=%s response=%s",
            response.status_code,
            data,
        )

        return {
            "status": "failed",
            "reason": "provider_error",
            "http_status": response.status_code,
            "provider_response": data,
        }

    except httpx.TimeoutException:
        logger.exception(
            "[WhatsApp TEMPLATE TIMEOUT] to=%s",
            recipient,
        )
        return {
            "status": "failed",
            "reason": "timeout",
        }

    except httpx.HTTPError as exc:
        logger.exception(
            "[WhatsApp TEMPLATE HTTP ERROR] to=%s",
            recipient,
        )
        return {
            "status": "failed",
            "reason": "http_error",
            "error": str(exc),
        }

    except Exception as exc:
        logger.exception(
            "[WhatsApp TEMPLATE ERROR] to=%s",
            recipient,
        )
        return {
            "status": "failed",
            "reason": "unexpected_error",
            "error": str(exc),
        }


async def send_push_notification(
    user_id: str,
    title: str,
    body: str,
) -> dict:
    if not os.environ.get("VAPID_PUBLIC_KEY"):
        logger.info("[Push PENDING] user=%s: %s", user_id, title)
        return {
            "status": "pending",
            "reason": "missing_keys",
        }

    return {
        "status": "pending",
        "reason": "integration_not_wired",
    }


async def send_email_notification(
    email: str,
    subject: str,
    body: str,
) -> dict:
    if not os.environ.get("EMAIL_SERVER"):
        logger.info("[Email PENDING] to=%s: %s", email, subject)
        return {
            "status": "pending",
            "reason": "missing_keys",
        }

    return {
        "status": "pending",
        "reason": "integration_not_wired",
    }


async def create_internal_notification(
    db,
    *,
    user_id: str = "",
    customer_id: str = "",
    kind: str = "info",
    title: str = "",
    body: str = "",
    link: str = "",
    channel: str = "internal",
) -> dict:
    from models import Notification

    notification = Notification(
        user_id=user_id,
        customer_id=customer_id,
        kind=kind,
        title=title,
        body=body,
        link=link,
        channel=channel,
        status="sent",
    )

    doc = notification.model_dump()
    await db.notifications.insert_one(doc)

    return doc


def render_template(tpl: str, ctx: dict) -> str:
    out = tpl

    for key, value in ctx.items():
        out = out.replace(
            "{" + key + "}",
            str(value) if value is not None else "",
        )

    return out
