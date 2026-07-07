"""Backend API tests for ART JUNKIE OS."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://aj-os-platform.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@artjunkie.ro", "password": "ArtJunkie123!"}
MEAS = {"email": "masuratori1@artjunkie.ro", "password": "ArtJunkie123!"}
INST = {"email": "montator1@artjunkie.ro", "password": "ArtJunkie123!"}
CLIENT_PHONE = "+40721000001"


@pytest.fixture(scope="module")
def admin_sess():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email"] == ADMIN["email"]
    assert data["role"] == "super_admin"
    assert "access_token" in s.cookies
    assert "refresh_token" in s.cookies
    return s


@pytest.fixture(scope="module")
def meas_sess():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=MEAS)
    assert r.status_code == 200, r.text
    return s, r.json()


@pytest.fixture(scope="module")
def client_sess():
    s = requests.Session()
    r = s.post(f"{API}/client-auth/request-otp", json={"phone": CLIENT_PHONE})
    assert r.status_code == 200, r.text
    code = r.json().get("demo_code")
    assert code and len(code) == 6
    v = s.post(f"{API}/client-auth/verify-otp", json={"phone": CLIENT_PHONE, "code": code})
    assert v.status_code == 200, v.text
    assert "client_token" in s.cookies
    return s, v.json()["customer"]


# ---- Auth ----
class TestAuth:
    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong"})
        assert r.status_code == 401

    def test_me(self, admin_sess):
        r = admin_sess.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN["email"]

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---- Dashboard ----
class TestDashboard:
    def test_stats(self, admin_sess):
        r = admin_sess.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ["measurements_today", "installations_today", "new_leads", "total_customers"]:
            assert k in d and isinstance(d[k], int)


# ---- Customers CRUD + history ----
class TestCustomers:
    def test_customer_flow(self, admin_sess):
        payload = {"name": "TEST_Cust", "phone": "+40799000111", "city": "București"}
        r = admin_sess.post(f"{API}/customers", json=payload)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]

        r = admin_sess.get(f"{API}/customers")
        assert r.status_code == 200
        assert any(c["id"] == cid for c in r.json())

        r = admin_sess.patch(f"{API}/customers/{cid}", json={"status": "activ"})
        assert r.status_code == 200
        assert r.json()["status"] == "activ"

        r = admin_sess.get(f"{API}/customers/{cid}")
        assert r.status_code == 200
        d = r.json()
        assert d["customer"]["id"] == cid
        for key in ["leads", "measurements", "installations", "work_orders", "warranties", "service_tickets"]:
            assert key in d

        # cleanup
        admin_sess.delete(f"{API}/customers/{cid}")


# ---- Leads ----
class TestLeads:
    def test_lead_crud(self, admin_sess):
        # need a customer
        c = admin_sess.post(f"{API}/customers", json={"name": "TEST_LeadCust", "phone": "+40799000222"}).json()
        r = admin_sess.post(f"{API}/leads", json={"customer_id": c["id"], "product_interest": "draperii"})
        assert r.status_code == 200, r.text
        lid = r.json()["id"]
        r = admin_sess.patch(f"{API}/leads/{lid}", json={"status": "contactat"})
        assert r.status_code == 200
        assert r.json()["status"] == "contactat"
        r = admin_sess.get(f"{API}/leads")
        assert any(x["id"] == lid for x in r.json())
        admin_sess.delete(f"{API}/leads/{lid}")
        admin_sess.delete(f"{API}/customers/{c['id']}")


# ---- Measurements with notifications ----
class TestMeasurements:
    def test_create_notifies_assignee(self, admin_sess, meas_sess):
        meas_s, meas_user = meas_sess
        c = admin_sess.post(f"{API}/customers", json={"name": "TEST_MeasCust", "phone": "+40799000333"}).json()
        payload = {
            "customer_id": c["id"], "address": "Str Test 1", "date": "2026-02-01", "time": "10:00",
            "assigned_to": meas_user["id"],
        }
        r = admin_sess.post(f"{API}/measurements", json=payload)
        assert r.status_code == 200, r.text
        mid = r.json()["id"]

        # notifications for assignee
        r = meas_s.get(f"{API}/notifications")
        assert r.status_code == 200
        notes = r.json()
        assert any(n.get("kind") == "allocation" and n.get("customer_id") == c["id"] for n in notes)

        # mine=true filter
        r = meas_s.get(f"{API}/measurements?mine=true")
        assert r.status_code == 200
        rows = r.json()
        assert all(row.get("assigned_to") == meas_user["id"] for row in rows)
        assert any(row["id"] == mid for row in rows)

        # cleanup
        admin_sess.delete(f"{API}/measurements/{mid}")
        admin_sess.delete(f"{API}/customers/{c['id']}")


# ---- Installations + warranty auto-create ----
class TestInstallations:
    def test_installation_flow_and_warranty(self, admin_sess, meas_sess):
        _, meas_user = meas_sess  # reuse as installer id proxy? Need installer
        # login as installer instead
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json=INST)
        assert r.status_code == 200
        inst_user = r.json()

        c = admin_sess.post(f"{API}/customers", json={"name": "TEST_InstCust", "phone": "+40799000444"}).json()
        payload = {
            "customer_id": c["id"], "address": "Str Test 2", "date": "2026-02-05", "time": "12:00",
            "assigned_to": inst_user["id"], "products": ["draperii"],
        }
        r = admin_sess.post(f"{API}/installations", json=payload)
        assert r.status_code == 200, r.text
        iid = r.json()["id"]

        # mine filter
        r = s.get(f"{API}/installations?mine=true")
        assert r.status_code == 200
        assert any(x["id"] == iid for x in r.json())

        # notifications
        r = s.get(f"{API}/notifications")
        assert any(n.get("customer_id") == c["id"] and n.get("kind") == "allocation" for n in r.json())

        # PATCH finalizat + warranty
        r = admin_sess.patch(f"{API}/installations/{iid}",
                             json={"status": "finalizat", "warranty_activated": True})
        assert r.status_code == 200

        r = admin_sess.get(f"{API}/warranties")
        assert r.status_code == 200
        assert any(w.get("installation_id") == iid for w in r.json())

        # cleanup
        admin_sess.delete(f"{API}/installations/{iid}")
        admin_sess.delete(f"{API}/customers/{c['id']}")


# ---- Generic list+create+patch endpoints ----
class TestGenericResources:
    def test_work_orders(self, admin_sess):
        c = admin_sess.post(f"{API}/customers", json={"name": "TEST_WOCust", "phone": "+40799000555"}).json()
        r = admin_sess.post(f"{API}/work-orders", json={"customer_id": c["id"], "title": "TEST WO"})
        assert r.status_code == 200
        wid = r.json()["id"]
        r = admin_sess.patch(f"{API}/work-orders/{wid}", json={"status": "ofertat"})
        assert r.status_code == 200 and r.json()["status"] == "ofertat"
        r = admin_sess.get(f"{API}/work-orders")
        assert any(w["id"] == wid for w in r.json())
        admin_sess.delete(f"{API}/work-orders/{wid}")
        admin_sess.delete(f"{API}/customers/{c['id']}")

    def test_production(self, admin_sess):
        r = admin_sess.post(f"{API}/production", json={
            "work_order_id": "TEST_WO", "customer_id": "TEST_C", "product": "TEST prod"
        })
        assert r.status_code == 200
        pid = r.json()["id"]
        r = admin_sess.patch(f"{API}/production/{pid}", json={"status": "in_lucru"})
        assert r.status_code == 200
        admin_sess.delete(f"{API}/production/{pid}")

    def test_warranties(self, admin_sess):
        r = admin_sess.post(f"{API}/warranties", json={
            "customer_id": "TEST_C", "product": "TEST prod", "installation_date": "2026-01-01"
        })
        assert r.status_code == 200
        wid = r.json()["id"]
        assert r.json()["expiry_date"]
        admin_sess.delete(f"{API}/warranties/{wid}")

    def test_service_tickets(self, admin_sess):
        r = admin_sess.post(f"{API}/service-tickets", json={
            "customer_id": "TEST_C", "problem": "TEST issue"
        })
        assert r.status_code == 200
        tid = r.json()["id"]
        r = admin_sess.patch(f"{API}/service-tickets/{tid}", json={"status": "in_lucru"})
        assert r.status_code == 200
        admin_sess.delete(f"{API}/service-tickets/{tid}")

    def test_settings(self, admin_sess):
        r = admin_sess.get(f"{API}/settings")
        assert r.status_code == 200
        assert r.json()["company_name"]
        r = admin_sess.put(f"{API}/settings", json={"company_phone": "+40 000 000 000"})
        assert r.status_code == 200
        assert r.json()["company_phone"] == "+40 000 000 000"


# ---- Reports ----
class TestReports:
    def test_summary(self, admin_sess):
        r = admin_sess.get(f"{API}/reports/summary")
        assert r.status_code == 200
        d = r.json()
        for k in ["leads_by_status", "orders_by_status", "measurements_by_status",
                  "installations_by_status", "customer_sources", "employee_performance"]:
            assert k in d and isinstance(d[k], list)


# ---- Client portal ----
class TestClientPortal:
    def test_client_me_and_orders(self, client_sess):
        s, cust = client_sess
        r = s.get(f"{API}/client-auth/me")
        assert r.status_code == 200
        assert r.json()["id"] == cust["id"]

        r = s.get(f"{API}/client/orders")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_client_endpoints_require_auth(self):
        r = requests.get(f"{API}/client/orders")
        assert r.status_code == 401

    def test_bad_otp(self):
        r = requests.post(f"{API}/client-auth/verify-otp", json={"phone": CLIENT_PHONE, "code": "000000"})
        assert r.status_code == 400
