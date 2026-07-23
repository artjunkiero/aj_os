"""Pydantic models for ART JUNKIE OS."""
from datetime import datetime, timezone
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict
import uuid


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ============ USER / EMPLOYEE ============
ROLES = ["super_admin", "admin", "sales", "technician", "client"]


class UserBase(BaseModel):
    email: str
    name: str
    phone: Optional[str] = ""
    role: str = "sales"
    active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    active: Optional[bool] = None
    password: Optional[str] = None


class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)


# ============ CUSTOMER ============
class CustomerBase(BaseModel):
    name: str
    phone: str = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    county: Optional[str] = ""
    client_type: str = "persoana_fizica"  # persoana_fizica | firma
    cui: Optional[str] = ""
    source: str = "showroom"  # showroom, telefon, whatsapp, site, google, facebook, instagram, recomandare, alta
    status: str = "nou"  # nou, activ, ofertat, comanda_activa, finalizat, inactiv
    notes: Optional[str] = ""
    tags: List[str] = Field(default_factory=list)


class Customer(CustomerBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    referral_code: str = ""  # generated once, uppercase alphanumeric (8 chars)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ============ LEAD ============
class LeadBase(BaseModel):
    customer_id: str
    source: str = "showroom"
    product_interest: str = ""
    budget: Optional[float] = 0
    urgency: str = "normala"  # normala, urgent, foarte_urgent
    status: str = "nou"  # nou, contactat, programat, ofertat, pierdut, castigat
    assigned_to: Optional[str] = ""  # user id
    follow_up_date: Optional[str] = ""
    notes: Optional[str] = ""
    loss_reason: Optional[str] = ""


class Lead(LeadBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ============ MEASUREMENT ============
class MeasurementBase(BaseModel):
    customer_id: str
    lead_id: Optional[str] = ""
    address: str = ""
    date: str = ""  # ISO date
    time: str = ""  # HH:MM
    interval: Optional[str] = ""
    assigned_to: Optional[str] = ""
    products: List[str] = Field(default_factory=list)
    status: str = "noua"  # noua, alocata, notificata, in_drum, ajuns, masurata, oferta_de_facut, problema, anulata, reprogramata
    priority: str = "normala"  # normala, urgenta, foarte_urgenta
    customer_notes: Optional[str] = ""
    internal_notes: Optional[str] = ""
    measurements_data: Optional[str] = ""  # dimensiuni text
    photos: List[str] = Field(default_factory=list)
    documents: List[str] = Field(default_factory=list)


class Measurement(MeasurementBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ============ INSTALLATION ============
class InstallationBase(BaseModel):
    customer_id: str
    work_order_id: Optional[str] = ""
    address: str = ""
    date: str = ""
    time: str = ""
    assigned_to: Optional[str] = ""
    products: List[str] = Field(default_factory=list)
    status: str = "nou"  # nou, alocat, notificat, pregatit, in_drum, ajuns, in_montaj, finalizat, problema, reprogramat, anulat
    notes: Optional[str] = ""
    photos_before: List[str] = Field(default_factory=list)
    photos_after: List[str] = Field(default_factory=list)
    client_satisfied: Optional[bool] = None
    paid: bool = False
    warranty_activated: bool = False


class Installation(InstallationBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ============ WORK ORDER (Lucrare) ============
class WorkOrderBase(BaseModel):
    customer_id: str
    lead_id: Optional[str] = ""
    measurement_id: Optional[str] = ""
    installation_id: Optional[str] = ""
    title: str = ""
    products: List[dict] = Field(default_factory=list)  # {name, room, dimensions, material, color, qty}
    total_amount: float = 0
    advance_paid: float = 0
    status: str = "lead"  # lead, masuratoare_programata, masurat, oferta_de_facut, ofertat, acceptat, avans_platit, in_productie, gata_de_montaj, montaj_programat, in_montaj, montat, finalizat, garantie_activa, inchis
    notes: Optional[str] = ""
    documents: List[str] = Field(default_factory=list)


class WorkOrder(WorkOrderBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ============ PRODUCTION ITEM ============
class ProductionItemBase(BaseModel):
    work_order_id: str
    customer_id: str
    product: str
    room: Optional[str] = ""
    dimensions: Optional[str] = ""
    material: Optional[str] = ""
    color: Optional[str] = ""
    quantity: int = 1
    status: str = "nou"  # nou, in_lucru, in_asteptare_material, finalizat, gata_de_montaj
    responsible: Optional[str] = ""
    deadline: Optional[str] = ""
    notes: Optional[str] = ""


class ProductionItem(ProductionItemBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ============ WARRANTY ============
class WarrantyBase(BaseModel):
    customer_id: str
    work_order_id: Optional[str] = ""
    installation_id: Optional[str] = ""
    product: str = ""
    installation_date: str = ""
    duration_months: int = 24
    expiry_date: Optional[str] = ""
    status: str = "activa"  # activa, expirata, interventie_deschisa, rezolvata
    notes: Optional[str] = ""


class Warranty(WarrantyBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)


# ============ SERVICE TICKET ============
class ServiceTicketBase(BaseModel):
    customer_id: str
    warranty_id: Optional[str] = ""
    work_order_id: Optional[str] = ""
    problem: str = ""
    assigned_to: Optional[str] = ""
    status: str = "noua"  # noua, alocata, in_lucru, rezolvata, respinsa, contra_cost
    priority: str = "normala"
    notes: Optional[str] = ""
    photos_before: List[str] = Field(default_factory=list)
    photos_after: List[str] = Field(default_factory=list)


class ServiceTicket(ServiceTicketBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ============ NOTIFICATION ============
class NotificationBase(BaseModel):
    user_id: Optional[str] = ""  # employee target
    customer_id: Optional[str] = ""
    kind: str = "info"  # info, allocation, reschedule, warranty, service, urgent
    title: str = ""
    body: str = ""
    link: Optional[str] = ""
    read: bool = False
    status: str = "pending"  # pending, sent, failed
    channel: str = "internal"  # internal, whatsapp, email, push


class Notification(NotificationBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)


# ============ SETTINGS ============
class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "singleton"
    company_name: str = "ART JUNKIE"
    company_phone: str = ""
    company_email: str = "contact@artjunkie.ro"
    company_address: str = ""
    working_hours: str = "Luni - Vineri: 09:00 - 18:00"
    whatsapp_number: str = ""
    default_warranty_months: int = 24
    google_review_link: str = ""
    templates: dict = Field(default_factory=lambda: {
        "employee_measurement": "Ai fost alocat pentru o măsurătoare ART JUNKIE.\nClient: {clientName}\nTelefon: {clientPhone}\nAdresă: {address}\nData: {date}\nOra: {time}\nProduse: {products}",
        "employee_installation": "Ai fost alocat pentru un montaj ART JUNKIE.\nClient: {clientName}\nTelefon: {clientPhone}\nAdresă: {address}\nData: {date}\nOra: {time}\nProduse: {products}",
        "client_measurement": "Bună ziua! Programarea dumneavoastră ART JUNKIE pentru măsurători a fost stabilită pentru {date}, ora {time}. Vă mulțumim!",
        "client_installation": "Bună ziua! Montajul ART JUNKIE este programat pentru {date}, ora {time}. Vă mulțumim!",
        "reschedule": "Bună ziua! Programarea ART JUNKIE a fost reprogramată pentru {date}, ora {time}.",
        "completed": "Vă mulțumim că ați ales ART JUNKIE. Lucrarea a fost finalizată. Garanția dumneavoastră este activă.",
        "referral_share": "Bună! Am ales ART JUNKIE pentru perdele/draperii/rolete și sunt foarte mulțumit(ă). Îți recomand și ție echipa lor — dacă folosești linkul meu, primești {discount} discount la prima comandă: {link}"
    })
    notifications_enabled: bool = True
    referral_discount: str = "10%"  # afișat prietenului la formular
    referral_enabled: bool = True


# ============ OTP ============
class OtpCode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    phone: str
    code: str
    expires_at: str
    used: bool = False
    created_at: str = Field(default_factory=now_iso)


# ============ MESSAGE (client portal) ============
class MessageBase(BaseModel):
    customer_id: str
    from_role: str = "client"  # client | staff
    body: str = ""
    attachments: List[str] = Field(default_factory=list)


class Message(MessageBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)


# ============ REFERRAL ============
class ReferralBase(BaseModel):
    referrer_customer_id: str
    code: str = ""  # snapshot of referrer's code at time of creation
    friend_name: str
    friend_phone: str
    friend_city: Optional[str] = ""
    product_interest: Optional[str] = ""
    friend_message: Optional[str] = ""
    status: str = "trimisa"  # trimisa, lead_creata, ofertat, castigat, pierdut
    lead_id: Optional[str] = ""
    created_customer_id: Optional[str] = ""
    admin_notes: Optional[str] = ""


class Referral(ReferralBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)
