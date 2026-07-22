"""ART JUNKIE OS - FastAPI backend."""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import random
import string
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from models import (
    UserCreate, UserUpdate, User,
    CustomerBase, Customer,
    LeadBase, Lead,
    MeasurementBase, Measurement,
    InstallationBase, Installation,
    WorkOrderBase, WorkOrder,
    ProductionItemBase, ProductionItem,
    WarrantyBase, Warranty,
    ServiceTicketBase, ServiceTicket,
    NotificationBase, Notification,
    Settings, OtpCode, MessageBase, Message,
    ReferralBase, Referral,
    now_iso, new_id, ROLES,
)
from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, create_client_token,
    set_auth_cookies, clear_auth_cookies, set_client_cookie,
    get_current_user, require_roles, get_current_client,
)
from notifications import (
    send_whatsapp_message,
    send_whatsapp_template,
    send_push_notification,
    send_email_notification,
    create_internal_notification,
    render_template,
)
from seed import seed_all

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ============ DB ============
mongo_url = os.environ["MONGO_URL"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ["DB_NAME"]]

app = FastAPI(title="ART JUNKIE OS API")
api = APIRouter(prefix="/api")

# CORS - allow the frontend url and localhost
allow_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins if allow_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def strip_id(doc):
    if doc is None:
        return None
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


def strip_list(docs):
    return [strip_id(d) for d in docs]


def _gen_referral_code() -> str:
    # 8 chars, uppercase alphanumeric (no ambiguous chars)
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choices(alphabet, k=8))


async def _ensure_referral_code(customer_id: str) -> str:
    doc = await db.customers.find_one({"id": customer_id}, {"_id": 0, "referral_code": 1})
    if doc and doc.get("referral_code"):
        return doc["referral_code"]
    # generate unique code
    for _ in range(10):
        code = _gen_referral_code()
        existing = await db.customers.find_one({"referral_code": code}, {"_id": 0, "id": 1})
        if not existing:
            await db.customers.update_one({"id": customer_id}, {"$set": {"referral_code": code}})
            return code
    # fallback (extremely unlikely collisions x10)
    code = _gen_referral_code() + str(random.randint(0, 999))
    await db.customers.update_one({"id": customer_id}, {"$set": {"referral_code": code}})
    return code


async def _backfill_referral_codes():
    cursor = db.customers.find({"$or": [{"referral_code": {"$exists": False}}, {"referral_code": ""}]}, {"_id": 0, "id": 1})
    async for c in cursor:
        await _ensure_referral_code(c["id"])


# ============ AUTH ============
class LoginBody(BaseModel):
    email: str
    password: str
    
class WhatsAppTestRequest(BaseModel):
    phone: str

@api.post("/auth/login")
async def login(body: LoginBody, response: Response):
    email = body.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    if not user.get("active", True):
        raise HTTPException(status_code=403, detail="Cont dezactivat")
    if not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return strip_id(user)


@api.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.post("/test/whatsapp")
async def test_whatsapp(body: WhatsAppTestRequest):
    result = await send_whatsapp_template(
        phone=body.phone,
        template_name="hello_world",
        language_code="en_US",
    )

    return result

# ============ USERS / EMPLOYEES ============
@api.get("/users")
async def list_users(user: dict = Depends(get_current_user)):
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/users")
async def create_user(body: UserCreate, user: dict = Depends(require_roles("admin"))):
    email = body.email.strip().lower()
    if body.role not in ROLES:
        raise HTTPException(status_code=400, detail="Rol invalid")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Emailul există deja")
    new_user = User(email=email, name=body.name, phone=body.phone or "", role=body.role, active=body.active)
    doc = new_user.model_dump()
    doc["password_hash"] = hash_password(body.password)
    await db.users.insert_one(doc)
    return strip_id(doc)


@api.patch("/users/{user_id}")
async def update_user(user_id: str, body: UserUpdate, user: dict = Depends(require_roles("admin"))):
    updates = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if "password" in updates:
        updates["password_hash"] = hash_password(updates.pop("password"))
    if "email" in updates:
        updates["email"] = updates["email"].strip().lower()
    if updates:
        await db.users.update_one({"id": user_id}, {"$set": updates})
    doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Utilizator inexistent")
    return doc


@api.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: str,
    user: dict = Depends(require_roles("admin")),
):
    customer = await db.customers.find_one({"id": customer_id})

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Client inexistent"
        )

    measurements = await db.measurements.count_documents(
        {"customer_id": customer_id}
    )

    installations = await db.installations.count_documents(
        {"customer_id": customer_id}
    )

    work_orders = await db.work_orders.count_documents(
        {"customer_id": customer_id}
    )

    warranties = await db.warranties.count_documents(
        {"customer_id": customer_id}
    )

    tickets = await db.service_tickets.count_documents(
        {"customer_id": customer_id}
    )

    referrals = await db.referrals.count_documents(
        {"referrer_customer_id": customer_id}
    )

    total = (
        measurements
        + installations
        + work_orders
        + warranties
        + tickets
        + referrals
    )

    if total > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Clientul are istoric și nu poate fi șters. "
                "Folosește Arhivare."
            ),
        )

    await db.customers.delete_one(
        {"id": customer_id}
    )

    return {
        "ok": True
    }


# ============ CUSTOMERS ============
@api.get("/customers")
async def list_customers(q: Optional[str] = None, status: Optional[str] = None,
                         user: dict = Depends(get_current_user)):
    query = {}
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
        ]
    if status:
        query["status"] = status
    docs = await db.customers.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api.get("/customers/{customer_id}")
async def get_customer(customer_id: str, user: dict = Depends(get_current_user)):
    doc = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Client inexistent")
    # Aggregate history
    leads = await db.leads.find({"customer_id": customer_id}, {"_id": 0}).to_list(100)
    measurements = await db.measurements.find({"customer_id": customer_id}, {"_id": 0}).to_list(100)
    installations = await db.installations.find({"customer_id": customer_id}, {"_id": 0}).to_list(100)
    work_orders = await db.work_orders.find({"customer_id": customer_id}, {"_id": 0}).to_list(100)
    warranties = await db.warranties.find({"customer_id": customer_id}, {"_id": 0}).to_list(100)
    tickets = await db.service_tickets.find({"customer_id": customer_id}, {"_id": 0}).to_list(100)
    referrals = await db.referrals.find({"referrer_customer_id": customer_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {
        "customer": doc, "leads": leads, "measurements": measurements,
        "installations": installations, "work_orders": work_orders,
        "warranties": warranties, "service_tickets": tickets,
        "referrals": referrals,
    }


@api.post("/customers")
async def create_customer(body: CustomerBase, user: dict = Depends(get_current_user)):
    c = Customer(**body.model_dump())
    doc = c.model_dump()
    await db.customers.insert_one(doc)
    await _ensure_referral_code(c.id)
    return await db.customers.find_one({"id": c.id}, {"_id": 0})


@api.patch("/customers/{customer_id}")
async def update_customer(customer_id: str, body: dict, user: dict = Depends(get_current_user)):
    body.pop("id", None)
    body["updated_at"] = now_iso()
    await db.customers.update_one({"id": customer_id}, {"$set": body})
    doc = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return doc

@api.patch("/customers/{customer_id}/archive")
async def archive_customer(
    customer_id: str,
    user: dict = Depends(get_current_user),
):
    result = await db.customers.update_one(
        {"id": customer_id},
        {
            "$set": {
                "status": "arhivat",
                "updated_at": now_iso(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Client inexistent",
        )

    return await db.customers.find_one(
        {"id": customer_id},
        {"_id": 0},
    )

@api.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(require_roles("admin"))):
    await db.customers.delete_one({"id": customer_id})
    return {"ok": True}


# ============ LEADS ============
@api.get("/leads")
async def list_leads(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    docs = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/leads")
async def create_lead(body: LeadBase, user: dict = Depends(get_current_user)):
    lead = Lead(**body.model_dump())
    await db.leads.insert_one(lead.model_dump())
    return lead.model_dump()


@api.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, body: dict, user: dict = Depends(get_current_user)):
    body.pop("id", None)
    body["updated_at"] = now_iso()
    await db.leads.update_one({"id": lead_id}, {"$set": body})
    return await db.leads.find_one({"id": lead_id}, {"_id": 0})


@api.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, user: dict = Depends(get_current_user)):
    await db.leads.delete_one({"id": lead_id})
    return {"ok": True}


# ============ MEASUREMENTS ============
@api.get("/measurements")
async def list_measurements(assigned_to: Optional[str] = None, status: Optional[str] = None,
                            mine: Optional[bool] = False, user: dict = Depends(get_current_user)):
    query = {}
    if mine:
        query["assigned_to"] = user["id"]
    elif assigned_to:
        query["assigned_to"] = assigned_to
    if status:
        query["status"] = status
    docs = await db.measurements.find(query, {"_id": 0}).sort("date", 1).to_list(500)
    return docs


@api.post("/measurements")
async def create_measurement(
    body: MeasurementBase,
    user: dict = Depends(get_current_user),
):
    m = Measurement(**body.model_dump())
    measurement_data = m.model_dump()

    # Folosim o copie, ca MongoDB să nu adauge _id în obiectul returnat
    await db.measurements.insert_one(
        measurement_data.copy()
    )

    customer = await db.customers.find_one(
        {"id": m.customer_id},
        {"_id": 0},
    )

    whatsapp_result = None

    if customer:
        customer_name = (
            customer.get("name", "").strip()
            or "client ART JUNKIE"
        )

        customer_phone = (
            customer.get("phone", "").strip()
        )

        measurement_address = (
            getattr(m, "address", None)
            or customer.get("address", "")
            or "Adresa stabilită cu echipa ART JUNKIE"
        )

        if customer_phone:
            whatsapp_result = await send_whatsapp_template(
                phone=customer_phone,
                template_name="programare_masuratoare",
                language_code="ro",
                parameters=[
                    customer_name,
                    str(m.date),
                    str(m.time),
                    str(measurement_address),
                ],
            )

            await create_internal_notification(
                db,
                customer_id=m.customer_id,
                kind="info",
                title="Notificare WhatsApp",
                body=(
                    "Mesajul pentru programarea măsurătorii a fost trimis "
                    f"către {customer_name}. "
                    f"Status: "
                    f"{whatsapp_result.get('status', 'necunoscut')}"
                ),
            )

    if m.assigned_to:
        assigned_customer_name = (
            customer.get("name", "")
            if customer
            else ""
        )

        await create_internal_notification(
            db,
            user_id=m.assigned_to,
            customer_id=m.customer_id,
            kind="allocation",
            title="Măsurătoare alocată",
            body=(
                f"Client: {assigned_customer_name}, "
                f"{m.date} {m.time}"
            ),
        )

    return {
        **measurement_data,
        "whatsapp": whatsapp_result,
    }


@api.patch("/measurements/{mid}")
async def update_measurement(
    mid: str,
    body: dict,
    user: dict = Depends(get_current_user),
):
    body.pop("id", None)
    body["updated_at"] = now_iso()

    prev = await db.measurements.find_one(
        {"id": mid},
        {"_id": 0},
    )

    await db.measurements.update_one(
        {"id": mid},
        {"$set": body},
    )

    doc = await db.measurements.find_one(
        {"id": mid},
        {"_id": 0},
    )

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Măsurătoare inexistentă",
        )

    # Notificare dacă s-a schimbat montatorul alocat
    if (
        prev
        and body.get("assigned_to")
        and prev.get("assigned_to") != body["assigned_to"]
    ):
        await create_internal_notification(
            db,
            user_id=body["assigned_to"],
            customer_id=doc["customer_id"],
            kind="allocation",
            title="Măsurătoare alocată",
            body=(
                f"{doc.get('date', '')} "
                f"{doc.get('time', '')}"
            ),
        )

    return doc


@api.delete("/measurements/{mid}")
async def delete_measurement(
    mid: str,
    user: dict = Depends(get_current_user),
):
    await db.measurements.delete_one(
        {"id": mid}
    )

    return {
        "ok": True,
    }

# ============ INSTALLATIONS ============
@api.get("/installations")
async def list_installations(assigned_to: Optional[str] = None, status: Optional[str] = None,
                             mine: Optional[bool] = False, user: dict = Depends(get_current_user)):
    query = {}
    if mine:
        query["assigned_to"] = user["id"]
    elif assigned_to:
        query["assigned_to"] = assigned_to
    if status:
        query["status"] = status
    docs = await db.installations.find(query, {"_id": 0}).sort("date", 1).to_list(500)
    return docs


@api.post("/installations")
async def create_installation(
    body: InstallationBase,
    user: dict = Depends(get_current_user),
):
    inst = Installation(**body.model_dump())

    await db.installations.insert_one(
        inst.model_dump().copy()
    )

    customer = await db.customers.find_one(
        {"id": inst.customer_id},
        {"_id": 0},
    )

    # Notificare internă pentru montator
    if inst.assigned_to:
        await create_internal_notification(
            db,
            user_id=inst.assigned_to,
            customer_id=inst.customer_id,
            kind="allocation",
            title="Montaj alocat",
            body=(
                f"Client: "
                f"{customer.get('name', '') if customer else ''}, "
                f"{inst.date} {inst.time}"
            ),
        )

    # Notificare WhatsApp către client
    if customer and customer.get("phone"):
        installation_address = (
            getattr(inst, "address", None)
            or customer.get("address")
            or "Adresa comunicată la programare"
        )

        whatsapp_result = await send_whatsapp_template(
            phone=customer["phone"],
            template_name="programare_montaj",
            language_code="ro",
            parameters=[
                customer.get("name", "Client"),
                str(inst.date),
                str(inst.time),
                str(installation_address),
            ],
        )

        if whatsapp_result.get("status") != "sent":
            logger.error(
                "WhatsApp montaj failed customer_id=%s result=%s",
                inst.customer_id,
                whatsapp_result,
            )

    return inst.model_dump()


@api.patch("/installations/{iid}")
async def update_installation(
    iid: str,
    body: dict,
    user: dict = Depends(get_current_user),
):
    body.pop("id", None)
    body["updated_at"] = now_iso()

    await db.installations.update_one(
        {"id": iid},
        {"$set": body},
    )

    doc = await db.installations.find_one(
        {"id": iid},
        {"_id": 0},
    )

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Montaj inexistent",
        )

    # Trimite WhatsApp dacă s-au modificat data, ora sau adresa
    if (
        "date" in body
        or "time" in body
        or "address" in body
    ):
        customer = await db.customers.find_one(
            {"id": doc["customer_id"]},
            {"_id": 0},
        )

        if customer and customer.get("phone"):
            installation_address = (
                doc.get("address")
                or customer.get("address")
                or "Adresa comunicată la programare"
            )

            whatsapp_result = await send_whatsapp_template(
                phone=customer["phone"],
                template_name="programare_montaj",
                language_code="ro",
                parameters=[
                    customer.get("name", "Client"),
                    str(doc.get("date", "")),
                    str(doc.get("time", "")),
                    str(installation_address),
                ],
            )

            if whatsapp_result.get("status") != "sent":
                logger.error(
                    "WhatsApp montaj failed customer_id=%s result=%s",
                    doc["customer_id"],
                    whatsapp_result,
                )

    # Activează automat garanția la finalizare
    if (
        body.get("status") == "finalizat"
        and body.get("warranty_activated")
    ):
        existing_w = await db.warranties.find_one(
            {"installation_id": iid}
        )

        if not existing_w:
            settings = await db.settings.find_one(
                {"id": "singleton"}
            ) or {}

            months = settings.get(
                "default_warranty_months",
                24,
            )

            today = datetime.now(timezone.utc).date()

            w = Warranty(
                customer_id=doc["customer_id"],
                work_order_id=doc.get("work_order_id", ""),
                installation_id=iid,
                product=", ".join(doc.get("products", [])),
                installation_date=today.isoformat(),
                duration_months=months,
                expiry_date=(
                    today + timedelta(days=30 * months)
                ).isoformat(),
                status="activa",
            )

            await db.warranties.insert_one(
                w.model_dump().copy()
            )

    return doc

@api.delete("/installations/{iid}")
async def delete_installation(iid: str, user: dict = Depends(get_current_user)):
    await db.installations.delete_one({"id": iid})
    return {"ok": True}


# ============ WORK ORDERS ============
@api.get("/work-orders")
async def list_work_orders(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    docs = await db.work_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/work-orders")
async def create_wo(body: WorkOrderBase, user: dict = Depends(get_current_user)):
    wo = WorkOrder(**body.model_dump())
    await db.work_orders.insert_one(wo.model_dump())
    return wo.model_dump()


@api.patch("/work-orders/{wid}")
async def update_wo(wid: str, body: dict, user: dict = Depends(get_current_user)):
    body.pop("id", None)
    body["updated_at"] = now_iso()
    await db.work_orders.update_one({"id": wid}, {"$set": body})
    return await db.work_orders.find_one({"id": wid}, {"_id": 0})


@api.delete("/work-orders/{wid}")
async def delete_wo(wid: str, user: dict = Depends(get_current_user)):
    await db.work_orders.delete_one({"id": wid})
    return {"ok": True}


# ============ PRODUCTION ============
@api.get("/production")
async def list_production(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    docs = await db.production.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/production")
async def create_production(body: ProductionItemBase, user: dict = Depends(get_current_user)):
    p = ProductionItem(**body.model_dump())
    await db.production.insert_one(p.model_dump())
    return p.model_dump()


@api.patch("/production/{pid}")
async def update_production(pid: str, body: dict, user: dict = Depends(get_current_user)):
    body.pop("id", None)
    body["updated_at"] = now_iso()
    await db.production.update_one({"id": pid}, {"$set": body})
    return await db.production.find_one({"id": pid}, {"_id": 0})


@api.delete("/production/{pid}")
async def delete_production(pid: str, user: dict = Depends(get_current_user)):
    await db.production.delete_one({"id": pid})
    return {"ok": True}


# ============ WARRANTIES ============
@api.get("/warranties")
async def list_warranties(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    docs = await db.warranties.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/warranties")
async def create_warranty(body: WarrantyBase, user: dict = Depends(get_current_user)):
    payload = body.model_dump()
    if not payload.get("expiry_date") and payload.get("installation_date"):
        try:
            base_date = datetime.fromisoformat(payload["installation_date"]).date()
            payload["expiry_date"] = (base_date + timedelta(days=30 * payload.get("duration_months", 24))).isoformat()
        except Exception:
            pass
    w = Warranty(**payload)
    await db.warranties.insert_one(w.model_dump())
    return w.model_dump()


@api.patch("/warranties/{wid}")
async def update_warranty(wid: str, body: dict, user: dict = Depends(get_current_user)):
    body.pop("id", None)
    await db.warranties.update_one({"id": wid}, {"$set": body})
    return await db.warranties.find_one({"id": wid}, {"_id": 0})


@api.delete("/warranties/{wid}")
async def delete_warranty(wid: str, user: dict = Depends(get_current_user)):
    await db.warranties.delete_one({"id": wid})
    return {"ok": True}


# ============ SERVICE TICKETS ============
@api.get("/service-tickets")
async def list_tickets(status: Optional[str] = None, mine: Optional[bool] = False,
                       user: dict = Depends(get_current_user)):
    query = {}
    if mine:
        query["assigned_to"] = user["id"]
    if status:
        query["status"] = status
    docs = await db.service_tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/service-tickets")
async def create_ticket(body: ServiceTicketBase, user: dict = Depends(get_current_user)):
    t = ServiceTicket(**body.model_dump())
    await db.service_tickets.insert_one(t.model_dump())
    if t.assigned_to:
        await create_internal_notification(
            db, user_id=t.assigned_to, customer_id=t.customer_id, kind="service",
            title="Intervenție alocată", body=t.problem,
        )
    return t.model_dump()


@api.patch("/service-tickets/{tid}")
async def update_ticket(tid: str, body: dict, user: dict = Depends(get_current_user)):
    body.pop("id", None)
    body["updated_at"] = now_iso()
    await db.service_tickets.update_one({"id": tid}, {"$set": body})
    return await db.service_tickets.find_one({"id": tid}, {"_id": 0})


@api.delete("/service-tickets/{tid}")
async def delete_ticket(tid: str, user: dict = Depends(get_current_user)):
    await db.service_tickets.delete_one({"id": tid})
    return {"ok": True}


# ============ NOTIFICATIONS ============
@api.get("/notifications")
async def list_notifications(user: dict = Depends(get_current_user)):
    query = {"$or": [{"user_id": user["id"]}, {"user_id": ""}]}
    docs = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.post("/notifications/{nid}/read")
async def mark_read(nid: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"id": nid}, {"$set": {"read": True}})
    return {"ok": True}


@api.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"$or": [{"user_id": user["id"]}, {"user_id": ""}]}, {"$set": {"read": True}}
    )
    return {"ok": True}


# ============ SETTINGS ============
@api.get("/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    doc = await db.settings.find_one({"id": "singleton"}, {"_id": 0})
    if not doc:
        s = Settings()
        await db.settings.insert_one(s.model_dump())
        return s.model_dump()
    return doc


@api.put("/settings")
async def update_settings(body: dict, user: dict = Depends(require_roles("admin"))):
    body.pop("id", None)
    await db.settings.update_one({"id": "singleton"}, {"$set": body}, upsert=True)
    return await db.settings.find_one({"id": "singleton"}, {"_id": 0})


# ============ DASHBOARD STATS ============
@api.get("/dashboard/stats")
async def dashboard_stats(user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()

    measurements_today = await db.measurements.count_documents({"date": today})
    installations_today = await db.installations.count_documents({"date": today})
    unassigned_measurements = await db.measurements.count_documents({
        "$or": [{"assigned_to": ""}, {"assigned_to": None}]
    })
    unassigned_installations = await db.installations.count_documents({
        "$or": [{"assigned_to": ""}, {"assigned_to": None}]
    })
    late_installations = await db.installations.count_documents({
        "date": {"$lt": today},
        "status": {"$nin": ["finalizat", "anulat"]}
    })
    new_leads = await db.leads.count_documents({"status": "nou"})
    offers_to_make = await db.leads.count_documents({"status": "programat"})
    in_production = await db.production.count_documents({"status": {"$in": ["nou", "in_lucru", "in_asteptare_material"]}})
    ready_to_install = await db.work_orders.count_documents({"status": "gata_de_montaj"})
    active_warranties = await db.warranties.count_documents({"status": "activa"})
    open_tickets = await db.service_tickets.count_documents({"status": {"$in": ["noua", "alocata", "in_lucru"]}})
    total_customers = await db.customers.count_documents({})

    return {
        "measurements_today": measurements_today,
        "installations_today": installations_today,
        "unassigned": unassigned_measurements + unassigned_installations,
        "late_works": late_installations,
        "new_leads": new_leads,
        "offers_to_make": offers_to_make,
        "in_production": in_production,
        "ready_to_install": ready_to_install,
        "active_warranties": active_warranties,
        "open_tickets": open_tickets,
        "total_customers": total_customers,
    }


# ============ REPORTS ============
@api.get("/reports/summary")
async def reports_summary(user: dict = Depends(get_current_user)):
    # Basic aggregated counts
    def _agg_status(coll):
        return db[coll].aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}])

    async def _to_list(cursor):
        return await cursor.to_list(100)

    leads_by_status = await _to_list(_agg_status("leads"))
    orders_by_status = await _to_list(_agg_status("work_orders"))
    measurements_by_status = await _to_list(_agg_status("measurements"))
    installations_by_status = await _to_list(_agg_status("installations"))
    sources = await _to_list(db.customers.aggregate([
        {"$group": {"_id": "$source", "count": {"$sum": 1}}}
    ]))
    # Employee performance: installations finished by installer
    perf = await _to_list(db.installations.aggregate([
        {"$match": {"status": "finalizat"}},
        {"$group": {"_id": "$assigned_to", "count": {"$sum": 1}}},
    ]))
    return {
        "leads_by_status": leads_by_status,
        "orders_by_status": orders_by_status,
        "measurements_by_status": measurements_by_status,
        "installations_by_status": installations_by_status,
        "customer_sources": sources,
        "employee_performance": perf,
    }


# ============ CLIENT PORTAL (OTP) ============
class OtpRequest(BaseModel):
    phone: str


class OtpVerify(BaseModel):
    phone: str
    code: str


def normalize_client_phone(phone: str) -> str:
    phone = (
        phone.strip()
        .replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )

    if not phone:
        raise HTTPException(
            status_code=400,
            detail="Telefon obligatoriu",
        )

    # Acceptă +40744xxxxxx
    if phone.startswith("+40"):
        phone = phone[1:]

    # Acceptă 0744xxxxxx și transformă în 40744xxxxxx
    if len(phone) == 10 and phone.startswith("0"):
        phone = "40" + phone[1:]

    # Acceptă 744xxxxxx și transformă în 40744xxxxxx
    elif len(phone) == 9:
        phone = "40" + phone

    # Formatul final trebuie să fie 40744xxxxxx
    if (
        not phone.isdigit()
        or len(phone) != 11
        or not phone.startswith("40")
    ):
        raise HTTPException(
            status_code=400,
            detail="Număr de telefon invalid",
        )

    return phone


@api.post("/client-auth/request-otp")
async def client_request_otp(body: OtpRequest):
    phone = normalize_client_phone(body.phone)

    phone_variants = [
        phone,
        f"+{phone}",
        f"0{phone[2:]}",
    ]

    customer = await db.customers.find_one(
        {
            "phone": {
                "$in": phone_variants,
            }
        },
        {"_id": 0},
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Nu găsim un cont client cu acest număr",
        )

    # Invalidează codurile OTP anterioare
    await db.otp_codes.update_many(
        {
            "phone": phone,
            "used": False,
        },
        {
            "$set": {
                "used": True,
            }
        },
    )

    code = "".join(
        random.choices(
            string.digits,
            k=6,
        )
    )

    expires = (
        datetime.now(timezone.utc)
        + timedelta(minutes=10)
    ).isoformat()

    otp = OtpCode(
        phone=phone,
        code=code,
        expires_at=expires,
    )

    await db.otp_codes.insert_one(
        otp.model_dump().copy()
    )

    whatsapp_result = await send_whatsapp_template(
        phone=phone,
        template_name="portal_otp",
        language_code="ro",
        parameters=[code],
        button_code=code,
    )

    if whatsapp_result.get("status") != "sent":
        logger.error(
            "WhatsApp OTP failed phone=%s result=%s",
            phone,
            whatsapp_result,
        )

        await db.otp_codes.update_one(
            {"id": otp.id},
            {"$set": {"used": True}},
        )

        raise HTTPException(
            status_code=502,
            detail="Codul nu a putut fi trimis prin WhatsApp.",
        )

    logger.info(
        "[OTP WHATSAPP SENT] customer_id=%s phone=%s",
        customer.get("id"),
        phone,
    )

    return {
        "ok": True,
        "message": "Codul a fost trimis prin WhatsApp.",
        "expires_in": 600,
    }


@api.post("/client-auth/verify-otp")
async def client_verify_otp(
    body: OtpVerify,
    response: Response,
):
    phone = normalize_client_phone(body.phone)
    code = body.code.strip()

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Cod obligatoriu",
        )

    now = datetime.now(timezone.utc).isoformat()

    otp = await db.otp_codes.find_one(
        {
            "phone": phone,
            "code": code,
            "used": False,
            "expires_at": {
                "$gt": now,
            },
        }
    )

    if not otp:
        raise HTTPException(
            status_code=400,
            detail="Cod invalid sau expirat",
        )

    phone_variants = [
        phone,
        f"+{phone}",
        f"0{phone[2:]}",
    ]

    customer = await db.customers.find_one(
        {
            "phone": {
                "$in": phone_variants,
            }
        },
        {"_id": 0},
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Client inexistent",
        )

    await db.otp_codes.update_one(
        {"id": otp["id"]},
        {
            "$set": {
                "used": True,
            }
        },
    )

    token = create_client_token(
        customer["id"],
        phone,
    )

    set_client_cookie(
        response,
        token,
    )

    return {
        "customer": customer,
    }


@api.post("/client-auth/logout")
async def client_logout(response: Response):
    clear_auth_cookies(response)

    return {
        "ok": True,
    }


@api.get("/client-auth/me")
async def client_me(
    customer: dict = Depends(get_current_client),
):
    return customer


# ============ CLIENT PORTAL DATA ============
@api.get("/client/orders")
async def client_orders(customer: dict = Depends(get_current_client)):
    docs = await db.work_orders.find({"customer_id": customer["id"]}, {"_id": 0}).to_list(100)
    return docs


@api.get("/client/orders/{oid}")
async def client_order_detail(oid: str, customer: dict = Depends(get_current_client)):
    wo = await db.work_orders.find_one({"id": oid, "customer_id": customer["id"]}, {"_id": 0})
    if not wo:
        raise HTTPException(status_code=404, detail="Comandă inexistentă")
    measurement = await db.measurements.find_one({"customer_id": customer["id"]}, {"_id": 0})
    installation = await db.installations.find_one({"work_order_id": oid}, {"_id": 0})
    warranty = await db.warranties.find_one({"work_order_id": oid}, {"_id": 0})
    return {"work_order": wo, "measurement": measurement, "installation": installation, "warranty": warranty}


@api.get("/client/warranties")
async def client_warranties(customer: dict = Depends(get_current_client)):
    docs = await db.warranties.find({"customer_id": customer["id"]}, {"_id": 0}).to_list(100)
    return docs


@api.get("/client/service")
async def client_service(customer: dict = Depends(get_current_client)):
    docs = await db.service_tickets.find({"customer_id": customer["id"]}, {"_id": 0}).to_list(100)
    return docs


class ClientServiceRequest(BaseModel):
    problem: str
    warranty_id: Optional[str] = ""
    work_order_id: Optional[str] = ""


@api.post("/client/service")
async def client_create_service(body: ClientServiceRequest, customer: dict = Depends(get_current_client)):
    t = ServiceTicket(
        customer_id=customer["id"], warranty_id=body.warranty_id or "",
        work_order_id=body.work_order_id or "",
        problem=body.problem, status="noua",
    )
    await db.service_tickets.insert_one(t.model_dump())
    await create_internal_notification(
        db, customer_id=customer["id"], kind="service",
        title="Solicitare service nouă", body=body.problem,
    )
    return t.model_dump()


@api.get("/client/messages")
async def client_messages(customer: dict = Depends(get_current_client)):
    docs = await db.messages.find({"customer_id": customer["id"]}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return docs


class ClientMessage(BaseModel):
    body: str


@api.post("/client/messages")
async def client_send_message(body: ClientMessage, customer: dict = Depends(get_current_client)):
    m = Message(customer_id=customer["id"], from_role="client", body=body.body)
    await db.messages.insert_one(m.model_dump())
    return m.model_dump()


# ============ MESSAGES (staff) ============
@api.get("/messages/{customer_id}")
async def staff_messages(customer_id: str, user: dict = Depends(get_current_user)):
    docs = await db.messages.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", 1).to_list(200)
    return docs


@api.post("/messages/{customer_id}")
async def staff_send_message(customer_id: str, body: ClientMessage, user: dict = Depends(get_current_user)):
    m = Message(customer_id=customer_id, from_role="staff", body=body.body)
    await db.messages.insert_one(m.model_dump())
    return m.model_dump()


# ============ REFERRALS ============
class ReferralSubmit(BaseModel):
    friend_name: str
    friend_phone: str
    friend_city: Optional[str] = ""
    product_interest: Optional[str] = ""
    friend_message: Optional[str] = ""


def _customer_has_active_warranty(customer_id: str, warranties: list, work_orders: list) -> bool:
    if any(w.get("status") == "activa" for w in warranties if w.get("customer_id") == customer_id):
        return True
    active_wo_statuses = {"garantie_activa", "finalizat", "montat"}
    return any(w.get("status") in active_wo_statuses for w in work_orders if w.get("customer_id") == customer_id)


@api.get("/refer/{code}")
async def refer_info(code: str):
    """Public endpoint: friend lands here from share link."""
    code = code.strip().upper()
    ref = await db.customers.find_one({"referral_code": code}, {"_id": 0, "name": 1, "referral_code": 1})
    if not ref:
        raise HTTPException(status_code=404, detail="Cod de recomandare invalid")
    settings = await db.settings.find_one({"id": "singleton"}, {"_id": 0}) or {}
    return {
        "referrer_name": ref.get("name", ""),
        "code": code,
        "discount": settings.get("referral_discount", "10%"),
        "company_name": settings.get("company_name", "ART JUNKIE"),
    }


@api.post("/refer/{code}")
async def refer_submit(code: str, body: ReferralSubmit):
    """Public: friend submits the referral form."""
    code = code.strip().upper()
    referrer = await db.customers.find_one({"referral_code": code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Cod de recomandare invalid")
    if not body.friend_name.strip() or not body.friend_phone.strip():
        raise HTTPException(status_code=400, detail="Nume și telefon obligatorii")

    friend_phone = body.friend_phone.strip()
    # Find or create the friend as a Customer with source=recomandare
    existing = await db.customers.find_one({"phone": friend_phone}, {"_id": 0})
    if existing:
        new_customer = existing
    else:
        c = Customer(
            name=body.friend_name.strip(),
            phone=friend_phone,
            city=body.friend_city or "",
            source="recomandare",
            status="nou",
            notes=(f"Recomandat de {referrer.get('name','')}. "
                   f"Mesaj: {body.friend_message or '-'}"),
        )
        await db.customers.insert_one(c.model_dump())
        await _ensure_referral_code(c.id)
        new_customer = await db.customers.find_one({"id": c.id}, {"_id": 0})

    # Create lead
    lead = Lead(
        customer_id=new_customer["id"],
        source="recomandare",
        product_interest=body.product_interest or "",
        status="nou",
        notes=(f"Lead din recomandare — recomandat de {referrer.get('name','')} "
               f"(cod {code}). {body.friend_message or ''}").strip(),
    )
    await db.leads.insert_one(lead.model_dump())

    # Create referral record
    ref = Referral(
        referrer_customer_id=referrer["id"],
        code=code,
        friend_name=body.friend_name.strip(),
        friend_phone=friend_phone,
        friend_city=body.friend_city or "",
        product_interest=body.product_interest or "",
        friend_message=body.friend_message or "",
        status="lead_creata",
        lead_id=lead.id,
        created_customer_id=new_customer["id"],
    )
    await db.referrals.insert_one(ref.model_dump())

    # Internal notification (broadcast to admins: user_id="")
    await create_internal_notification(
        db, user_id="", customer_id=new_customer["id"], kind="referral",
        title="Lead nou din recomandare",
        body=f"{referrer.get('name','')} a recomandat pe {body.friend_name.strip()} ({friend_phone}).",
        link="/admin/recomandari",
    )

    return {"ok": True, "message": "Îți mulțumim! Te vom contacta în curând."}


@api.get("/client/referral")
async def client_referral(customer: dict = Depends(get_current_client)):
    """Return current client's referral code, eligibility, share link + template."""
    code = customer.get("referral_code") or await _ensure_referral_code(customer["id"])
    warranties = await db.warranties.find({"customer_id": customer["id"]}, {"_id": 0}).to_list(100)
    work_orders = await db.work_orders.find({"customer_id": customer["id"]}, {"_id": 0}).to_list(100)
    eligible = _customer_has_active_warranty(customer["id"], warranties, work_orders)
    settings = await db.settings.find_one({"id": "singleton"}, {"_id": 0}) or {}
    templates = settings.get("templates", {}) or {}
    return {
        "code": code,
        "eligible": eligible,
        "discount": settings.get("referral_discount", "10%"),
        "referral_enabled": settings.get("referral_enabled", True),
        "whatsapp_template": templates.get("referral_share", ""),
        "company_name": settings.get("company_name", "ART JUNKIE"),
        "referrer_name": customer.get("name", ""),
    }


@api.get("/client/referrals")
async def client_list_referrals(customer: dict = Depends(get_current_client)):
    docs = await db.referrals.find(
        {"referrer_customer_id": customer["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return docs


@api.get("/referrals")
async def admin_list_referrals(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if status:
        query["status"] = status
    docs = await db.referrals.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Enrich with referrer name
    if docs:
        ids = list({d["referrer_customer_id"] for d in docs})
        refs = await db.customers.find({"id": {"$in": ids}}, {"_id": 0, "id": 1, "name": 1, "phone": 1}).to_list(500)
        by_id = {r["id"]: r for r in refs}
        for d in docs:
            r = by_id.get(d["referrer_customer_id"])
            d["referrer_name"] = r["name"] if r else ""
            d["referrer_phone"] = r["phone"] if r else ""
    return docs


@api.patch("/referrals/{rid}")
async def admin_update_referral(rid: str, body: dict, user: dict = Depends(get_current_user)):
    body.pop("id", None)
    body["updated_at"] = now_iso()
    await db.referrals.update_one({"id": rid}, {"$set": body})
    return await db.referrals.find_one({"id": rid}, {"_id": 0})


@api.get("/")
async def root():
    return {"app": "ART JUNKIE OS", "version": "1.0"}


app.include_router(api)


@app.on_event("startup")
async def startup():
    await seed_all(db)
    await db.customers.create_index("referral_code")
    await db.referrals.create_index("referrer_customer_id")
    await _backfill_referral_codes()
    # Ensure referral template exists in settings (idempotent)
    settings_doc = await db.settings.find_one({"id": "singleton"}, {"_id": 0})
    if settings_doc:
        templates = settings_doc.get("templates", {}) or {}
        updates = {}
        if "referral_share" not in templates:
            templates["referral_share"] = (
                "Bună! Am ales ART JUNKIE pentru perdele/draperii/rolete și sunt "
                "foarte mulțumit(ă). Îți recomand și ție echipa lor — dacă folosești "
                "linkul meu, primești {discount} discount la prima comandă: {link}"
            )
            updates["templates"] = templates
        if "referral_discount" not in settings_doc:
            updates["referral_discount"] = "10%"
        if "referral_enabled" not in settings_doc:
            updates["referral_enabled"] = True
        if updates:
            await db.settings.update_one({"id": "singleton"}, {"$set": updates})
    logger.info("ART JUNKIE OS ready.")


@app.on_event("shutdown")
async def shutdown():
    mongo_client.close()
