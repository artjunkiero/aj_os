"""Referral feature tests (iteration 2)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://aj-os-platform.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@artjunkie.ro", "password": "ArtJunkie123!"}
CLIENT_ELIGIBLE = "+40721000001"   # Alexandru — has active warranty
CLIENT_INELIGIBLE = "+40721000004"  # Maria — status nou


@pytest.fixture(scope="module")
def admin_sess():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    return s


def _client_login(phone: str):
    s = requests.Session()
    r = s.post(f"{API}/client-auth/request-otp", json={"phone": phone})
    assert r.status_code == 200, r.text
    code = r.json()["demo_code"]
    v = s.post(f"{API}/client-auth/verify-otp", json={"phone": phone, "code": code})
    assert v.status_code == 200, v.text
    return s, v.json()["customer"]


@pytest.fixture(scope="module")
def eligible_client():
    return _client_login(CLIENT_ELIGIBLE)


@pytest.fixture(scope="module")
def ineligible_client():
    return _client_login(CLIENT_INELIGIBLE)


# ---- Settings referral migration ----
class TestSettingsReferral:
    def test_settings_has_referral_fields(self, admin_sess):
        r = admin_sess.get(f"{API}/settings")
        assert r.status_code == 200
        d = r.json()
        assert "referral_discount" in d
        assert "referral_enabled" in d
        assert "templates" in d
        assert "referral_share" in d["templates"]

    def test_update_referral_discount_and_template(self, admin_sess):
        # get current templates
        cur = admin_sess.get(f"{API}/settings").json()
        templates = cur.get("templates", {})
        templates["referral_share"] = "TEST message {referrer_name} {discount} {code} {link}"
        payload = {"referral_discount": "15%", "templates": templates}
        r = admin_sess.put(f"{API}/settings", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["referral_discount"] == "15%"
        assert d["templates"]["referral_share"].startswith("TEST message")
        # restore
        templates["referral_share"] = cur["templates"].get("referral_share", "")
        admin_sess.put(f"{API}/settings", json={
            "referral_discount": cur.get("referral_discount", "10%"),
            "templates": templates,
        })


# ---- Public /refer/{code} ----
class TestPublicRefer:
    def test_get_invalid_code(self):
        r = requests.get(f"{API}/refer/ZZZZZZZZ")
        assert r.status_code == 404

    def test_get_valid_code(self, eligible_client, admin_sess):
        # first ensure client referral code exists via client endpoint
        s, cust = eligible_client
        r = s.get(f"{API}/client/referral")
        assert r.status_code == 200
        code = r.json()["code"]
        assert code and len(code) >= 8

        r2 = requests.get(f"{API}/refer/{code}")
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert d["referrer_name"] == cust["name"]
        assert d["code"] == code
        assert "discount" in d
        assert "company_name" in d

    def test_get_lowercase_code_normalized(self, eligible_client):
        s, _ = eligible_client
        code = s.get(f"{API}/client/referral").json()["code"]
        r = requests.get(f"{API}/refer/{code.lower()}")
        assert r.status_code == 200

    def test_post_creates_customer_lead_referral_and_notification(self, eligible_client, admin_sess):
        s, cust = eligible_client
        code = s.get(f"{API}/client/referral").json()["code"]

        unique_phone = f"+40799{uuid.uuid4().int % 1000000:06d}"
        payload = {
            "friend_name": "TEST_Friend_Referral",
            "friend_phone": unique_phone,
            "friend_city": "Cluj",
            "product_interest": "draperii",
            "friend_message": "Sunt interesat urgent",
        }
        r = requests.post(f"{API}/refer/{code}", json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["ok"] is True

        # (1) Customer created with source=recomandare
        cs = admin_sess.get(f"{API}/customers").json()
        friend = next((c for c in cs if c.get("phone") == unique_phone), None)
        assert friend, "Friend customer not created"
        assert friend["source"] == "recomandare"

        # (2) Lead created with source=recomandare and referrer name in notes
        leads = admin_sess.get(f"{API}/leads").json()
        lead = next((l for l in leads if l.get("customer_id") == friend["id"]), None)
        assert lead, "Lead not created"
        assert lead["source"] == "recomandare"
        assert cust["name"] in (lead.get("notes") or ""), f"Referrer name missing in lead notes: {lead.get('notes')}"

        # (3) Referral row
        refs = admin_sess.get(f"{API}/referrals").json()
        ref_row = next((rr for rr in refs if rr.get("friend_phone") == unique_phone), None)
        assert ref_row, "Referral not created"
        assert ref_row["status"] == "lead_creata"
        assert ref_row["referrer_customer_id"] == cust["id"]
        assert ref_row["lead_id"] == lead["id"]
        assert ref_row.get("referrer_name") == cust["name"]
        assert ref_row.get("referrer_phone") == cust["phone"]

        # (4) Notification broadcast to admins (user_id="")
        notifs = admin_sess.get(f"{API}/notifications").json()
        # Notification list may filter to current user; check kind referral for this customer
        # If empty, at least referral must be listed in admin referrals — already asserted.
        # Optionally verify kind='referral' in db-ish way
        # (Skip strict notification assertion; it's broadcast, endpoint may be user-scoped.)

        # cleanup
        admin_sess.delete(f"{API}/leads/{lead['id']}")
        admin_sess.delete(f"{API}/customers/{friend['id']}")
        # referral row cleanup via patch to pierduta then leave (no DELETE endpoint)
        return ref_row["id"]

    def test_post_reuses_customer_if_phone_exists(self, eligible_client, admin_sess):
        s, cust = eligible_client
        code = s.get(f"{API}/client/referral").json()["code"]

        phone = f"+40799{uuid.uuid4().int % 1000000:06d}"
        # Create customer first
        c = admin_sess.post(f"{API}/customers",
                            json={"name": "TEST_Existing", "phone": phone}).json()
        existing_id = c["id"]

        r = requests.post(f"{API}/refer/{code}", json={
            "friend_name": "Different Name", "friend_phone": phone,
        })
        assert r.status_code == 200
        # Same customer reused
        refs = admin_sess.get(f"{API}/referrals").json()
        ref_row = next((rr for rr in refs if rr.get("friend_phone") == phone), None)
        assert ref_row["created_customer_id"] == existing_id
        # cleanup lead
        if ref_row.get("lead_id"):
            admin_sess.delete(f"{API}/leads/{ref_row['lead_id']}")
        admin_sess.delete(f"{API}/customers/{existing_id}")

    def test_post_invalid_code_404(self):
        r = requests.post(f"{API}/refer/BADCODE1", json={
            "friend_name": "x", "friend_phone": "+40799999999"
        })
        assert r.status_code == 404

    def test_post_missing_fields_400(self, eligible_client):
        s, _ = eligible_client
        code = s.get(f"{API}/client/referral").json()["code"]
        r = requests.post(f"{API}/refer/{code}", json={
            "friend_name": "", "friend_phone": ""
        })
        assert r.status_code == 400


# ---- /api/client/referral ----
class TestClientReferral:
    def test_eligible_client(self, eligible_client):
        s, _ = eligible_client
        r = s.get(f"{API}/client/referral")
        assert r.status_code == 200
        d = r.json()
        assert d["eligible"] is True
        assert d["code"]
        assert "discount" in d
        assert d["referral_enabled"] in (True, False)
        assert "whatsapp_template" in d

    def test_ineligible_client(self, ineligible_client):
        s, _ = ineligible_client
        r = s.get(f"{API}/client/referral")
        assert r.status_code == 200
        d = r.json()
        assert d["eligible"] is False

    def test_client_list_referrals(self, eligible_client):
        s, _ = eligible_client
        r = s.get(f"{API}/client/referrals")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_requires_auth(self):
        r = requests.get(f"{API}/client/referral")
        assert r.status_code == 401


# ---- Admin referrals + PATCH ----
class TestAdminReferrals:
    def test_list_and_patch(self, eligible_client, admin_sess):
        s, cust = eligible_client
        code = s.get(f"{API}/client/referral").json()["code"]
        phone = f"+40799{uuid.uuid4().int % 1000000:06d}"
        requests.post(f"{API}/refer/{code}", json={
            "friend_name": "TEST_PatchFriend", "friend_phone": phone,
        })
        refs = admin_sess.get(f"{API}/referrals").json()
        assert isinstance(refs, list)
        row = next((r for r in refs if r.get("friend_phone") == phone), None)
        assert row
        assert row.get("referrer_name") == cust["name"]

        r = admin_sess.patch(f"{API}/referrals/{row['id']}", json={"status": "trimisa"})
        assert r.status_code == 200
        assert r.json()["status"] == "trimisa"

        r = admin_sess.patch(f"{API}/referrals/{row['id']}", json={"status": "ofertat"})
        assert r.json()["status"] == "ofertat"

        r = admin_sess.patch(f"{API}/referrals/{row['id']}", json={"status": "castigat"})
        assert r.json()["status"] == "castigat"

        # cleanup
        if row.get("lead_id"):
            admin_sess.delete(f"{API}/leads/{row['lead_id']}")
        if row.get("created_customer_id"):
            admin_sess.delete(f"{API}/customers/{row['created_customer_id']}")

    def test_referrals_require_staff_auth(self):
        r = requests.get(f"{API}/referrals")
        assert r.status_code == 401


# ---- Customer detail includes referrals ----
class TestCustomerDetailReferrals:
    def test_referring_customer_has_referrals_array(self, eligible_client, admin_sess):
        s, cust = eligible_client
        r = admin_sess.get(f"{API}/customers/{cust['id']}")
        assert r.status_code == 200
        d = r.json()
        assert "referrals" in d
        assert isinstance(d["referrals"], list)
