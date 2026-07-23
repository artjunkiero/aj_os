"""Demo seed for ART JUNKIE OS."""
import os
import logging
from datetime import datetime, timezone, timedelta
from auth import hash_password
from models import (
    User, Customer, Lead, Measurement, Installation, WorkOrder,
    ProductionItem, Warranty, ServiceTicket, Notification, Settings, now_iso
)

logger = logging.getLogger(__name__)


async def seed_all(db):
    # Ensure indexes
    await db.users.create_index("email", unique=True)
    await db.customers.create_index("phone")
    await db.otp_codes.create_index("phone")

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@artjunkie.ro")
    admin_password = os.environ.get("ADMIN_PASSWORD", "ArtJunkie123!")

    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin = User(email=admin_email, name="Super Admin", role="super_admin", phone="+40712345678")
        doc = admin.model_dump()
        doc["password_hash"] = hash_password(admin_password)
        await db.users.insert_one(doc)
        logger.info(f"Seeded super admin: {admin_email}")
    else:
        # keep password fresh with .env
        from auth import verify_password
        if not verify_password(admin_password, existing_admin.get("password_hash", "")):
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"password_hash": hash_password(admin_password)}}
            )

    # Migrare automată: rolurile tehnice vechi devin un singur rol "technician".
    legacy_roles = ["measurement", "installer", "service"]
    migration_result = await db.users.update_many(
        {"role": {"$in": legacy_roles}},
        {"$set": {"role": "technician", "updated_at": now_iso()}},
    )
    if migration_result.modified_count:
        logger.info(
            "Migrated %s technical users to role technician.",
            migration_result.modified_count,
        )

    # Datele demo sunt create numai când variabila SEED_DEMO_DATA este activată.
    seed_demo_enabled = (
        os.environ.get("SEED_DEMO_DATA", "false")
        .strip()
        .lower()
        in {"1", "true", "yes", "on"}
    )

    if not seed_demo_enabled:
        logger.info("Demo seed disabled. Only the Super Admin account is ensured.")
        return

    # Nu dubla datele demo dacă acestea există deja.
    if await db.users.count_documents({}) > 1:
        logger.info("Demo data already exists. Seed skipped.")
        return

    def mkuser(email, name, role, phone, pwd="ArtJunkie123!"):
        u = User(email=email, name=name, role=role, phone=phone)
        d = u.model_dump()
        d["password_hash"] = hash_password(pwd)
        return d

    users = [
        mkuser("showroom@artjunkie.ro", "Ana Popescu", "admin", "+40711111111"),
        mkuser("vanzari@artjunkie.ro", "Mihai Ionescu", "sales", "+40722222222"),
        mkuser("tehnician1@artjunkie.ro", "Cristian Radu", "technician", "+40733333333"),
        mkuser("tehnician2@artjunkie.ro", "Andrei Marin", "technician", "+40733333334"),
        mkuser("tehnician3@artjunkie.ro", "George Dumitrescu", "technician", "+40744444444"),
        mkuser("tehnician4@artjunkie.ro", "Vlad Georgescu", "technician", "+40744444445"),
        mkuser("tehnician5@artjunkie.ro", "Radu Stanciu", "technician", "+40755555555"),
    ]
    await db.users.insert_many(users)
    user_map = {u["role"]: u["id"] for u in users}
    all_users = list(await db.users.find({}, {"_id": 0}).to_list(100))
    technician_ids = [u["id"] for u in all_users if u["role"] == "technician"]

    # Customers
    demo_customers = [
        Customer(name="Alexandru Munteanu", phone="+40721000001", email="alex@example.com",
                 address="Str. Trandafirilor 12", city="București", county="B",
                 source="site", status="comanda_activa", tags=["premium"]),
        Customer(name="Elena Vasile", phone="+40721000002", email="elena@example.com",
                 address="Bd. Unirii 45", city="București", county="B",
                 source="google", status="ofertat"),
        Customer(name="Robert Popa", phone="+40721000003", email="robert@example.com",
                 address="Str. Lalelelor 8", city="Ilfov", county="IF",
                 source="recomandare", status="activ"),
        Customer(name="Maria Georgescu", phone="+40721000004", email="maria@example.com",
                 address="Str. Salcâmilor 22", city="Cluj-Napoca", county="CJ",
                 source="facebook", status="nou"),
        Customer(name="SC Design Interior SRL", phone="+40721000005", email="office@design.ro",
                 address="Bd. Timișoara 100", city="București", county="B",
                 client_type="firma", cui="RO12345678",
                 source="showroom", status="finalizat"),
    ]
    for c in demo_customers:
        await db.customers.insert_one(c.model_dump())
    customer_docs = list(await db.customers.find({}, {"_id": 0}).to_list(100))

    # Leads
    for i, c in enumerate(customer_docs):
        lead = Lead(
            customer_id=c["id"], source=c["source"],
            product_interest=["perdele + draperii", "rolete textile", "jaluzele verticale",
                              "plise", "rulouri exterioare"][i % 5],
            budget=[3500, 5200, 2100, 4800, 12000][i % 5],
            urgency=["normala", "urgent", "normala", "normala", "foarte_urgent"][i % 5],
            status=["nou", "ofertat", "contactat", "castigat", "programat"][i % 5],
            assigned_to=user_map.get("sales", ""),
            notes="Lead demo generat automat.",
        )
        await db.leads.insert_one(lead.model_dump())

    # Measurements
    today = datetime.now(timezone.utc)
    for i, c in enumerate(customer_docs):
        date = (today + timedelta(days=i - 2)).date().isoformat()
        m = Measurement(
            customer_id=c["id"], address=c["address"],
            date=date, time=["09:00", "11:00", "13:30", "15:00", "17:00"][i],
            assigned_to=technician_ids[i % len(technician_ids)] if technician_ids else "",
            products=[["perdele", "draperii"], ["rolete"], ["jaluzele"],
                      ["plise"], ["rulouri exterioare"]][i],
            status=["alocata", "in_drum", "masurata", "noua", "reprogramata"][i],
            priority=["normala", "urgenta", "normala", "normala", "foarte_urgenta"][i],
            customer_notes="Cameră spațioasă, ferestre mari",
            measurements_data="Fereastra 1: 180x220 cm\nFereastra 2: 150x220 cm",
        )
        await db.measurements.insert_one(m.model_dump())

    # Work orders
    wo_ids = []
    for i, c in enumerate(customer_docs):
        wo = WorkOrder(
            customer_id=c["id"],
            title=f"Comandă #{1000 + i} — {c['name']}",
            products=[
                {"name": "Perdele living", "room": "Living", "dimensions": "180x220", "material": "Voile", "color": "Ivory", "qty": 2},
                {"name": "Draperii living", "room": "Living", "dimensions": "180x220", "material": "Blackout", "color": "Navy", "qty": 2},
            ],
            total_amount=[4500, 6200, 2800, 5100, 15000][i],
            advance_paid=[2000, 3000, 0, 2500, 15000][i],
            status=["in_montaj", "in_productie", "ofertat", "gata_de_montaj", "finalizat"][i],
        )
        await db.work_orders.insert_one(wo.model_dump())
        wo_ids.append(wo.id)

    # Installations
    for i, c in enumerate(customer_docs):
        inst = Installation(
            customer_id=c["id"], work_order_id=wo_ids[i], address=c["address"],
            date=(today + timedelta(days=i)).date().isoformat(),
            time=["10:00", "12:00", "14:00", "16:00", "09:30"][i],
            assigned_to=technician_ids[i % len(technician_ids)] if technician_ids else "",
            products=["Perdele + Draperii", "Rolete textile", "Jaluzele",
                      "Plise", "Rulouri exterioare"][i:i+1],
            status=["alocat", "in_drum", "in_montaj", "finalizat", "nou"][i],
            notes="Client va fi acasă începând cu ora programării.",
        )
        await db.installations.insert_one(inst.model_dump())

    # Production items
    for i in range(5):
        p = ProductionItem(
            work_order_id=wo_ids[i], customer_id=customer_docs[i]["id"],
            product=["Perdele", "Rolete Day&Night", "Jaluzele verticale", "Plise", "Rulouri exterioare"][i],
            room=["Living", "Dormitor", "Bucătărie", "Birou", "Balcon"][i],
            dimensions=["180x220", "120x160", "80x140", "100x120", "200x220"][i],
            material=["Voile", "Poliester", "Aluminiu", "Bumbac", "PVC"][i],
            color=["Ivory", "Grey", "White", "Beige", "Antracit"][i],
            quantity=[2, 3, 4, 2, 1][i],
            status=["in_lucru", "nou", "finalizat", "in_asteptare_material", "gata_de_montaj"][i],
            deadline=(today + timedelta(days=7 + i)).date().isoformat(),
        )
        await db.production.insert_one(p.model_dump())

    # Warranties
    for i in range(3):
        w = Warranty(
            customer_id=customer_docs[i]["id"], work_order_id=wo_ids[i],
            product=["Rolete Day&Night", "Jaluzele plisse", "Perdele + Draperii"][i],
            installation_date=(today - timedelta(days=30 * (i + 1))).date().isoformat(),
            duration_months=24,
            expiry_date=(today + timedelta(days=365 * 2 - 30 * (i + 1))).date().isoformat(),
            status=["activa", "interventie_deschisa", "activa"][i],
        )
        await db.warranties.insert_one(w.model_dump())

    # Service tickets
    for i in range(2):
        s = ServiceTicket(
            customer_id=customer_docs[i]["id"], work_order_id=wo_ids[i],
            problem=["Rolou blocat la ridicare", "Zgomot mecanism motorizat"][i],
            assigned_to=technician_ids[0] if technician_ids else "",
            status=["alocata", "in_lucru"][i],
            priority=["urgenta", "normala"][i],
        )
        await db.service_tickets.insert_one(s.model_dump())

    # Notifications for admin
    for i in range(3):
        n = Notification(
            kind=["allocation", "reschedule", "urgent"][i],
            title=["Măsurătoare alocată", "Reprogramare montaj", "Intervenție urgentă"][i],
            body=[f"Client: {customer_docs[i]['name']}", "Ora s-a mutat", "Contra timp"][i],
            status="sent",
        )
        await db.notifications.insert_one(n.model_dump())

    # Settings singleton
    existing = await db.settings.find_one({"id": "singleton"})
    if not existing:
        s = Settings()
        await db.settings.insert_one(s.model_dump())

    logger.info("Demo seed complete.")
