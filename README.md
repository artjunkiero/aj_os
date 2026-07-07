# ART JUNKIE OS

**Platformă internă completă** pentru ART JUNKIE (artjunkie.ro) — administrarea clienților, lead-urilor, măsurătorilor, ofertelor, comenzilor, producției, montajelor, garanțiilor, intervențiilor service, notificărilor, angajaților și a portalului client. Include și programul de recomandare „Recomandă un prieten".

- **Stack**: React 19 · FastAPI · MongoDB · JWT (cookie) auth · PWA
- **Design**: premium navy / gold / white · font Manrope
- **Limbă**: română

---

## 📁 Structură proiect

```
/app
├── backend/                      FastAPI backend
│   ├── server.py                 API routes + startup / seed
│   ├── auth.py                   JWT + bcrypt
│   ├── models.py                 Pydantic models (User, Customer, Lead, ...)
│   ├── notifications.py          WhatsApp / Push / Email (graceful fallback)
│   ├── seed.py                   Demo seed (idempotent)
│   ├── tests/                    pytest suite
│   ├── .env.example              template variabile de mediu
│   └── requirements.txt
├── frontend/                     React frontend
│   ├── src/
│   │   ├── App.js                router principal
│   │   ├── lib/                  api client + auth context + status helpers
│   │   ├── pages/
│   │   │   ├── admin/            consolă admin (14 module)
│   │   │   ├── employee/         PWA mobile pentru echipa de teren
│   │   │   ├── client/           portal client (OTP)
│   │   │   ├── Login.jsx
│   │   │   └── Refer.jsx         formular public de recomandare
│   │   └── components/ui/        shadcn/ui
│   ├── public/
│   │   ├── manifest.json         PWA
│   │   └── service-worker.js
│   ├── .env.example
│   └── package.json
└── README.md                     (acest fișier)
```

---

## 🚀 Instalare locală

### Cerințe
- Node.js 18+ și `yarn`
- Python 3.11+ și `pip`
- MongoDB 6+ (local sau Atlas)

### 1. Backend

```bash
cd backend

# 1. Copiază fișierul de mediu și completează valorile
cp .env.example .env
# editează .env: MONGO_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

# 2. Instalează dependințele Python
pip install -r requirements.txt

# 3. Pornește serverul (auto-reload)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

La primul start, `seed.py` populează baza de date (idempotent — nu suprascrie datele existente):
- 1 super admin + 7 angajați demo (admin/showroom, vânzări, măsurători x2, montatori x2, service)
- 5 clienți, 5 lead-uri, 5 măsurători, 5 montaje, 5 comenzi, 5 fișe producție
- 3 garanții, 2 intervenții service, 3 notificări
- Setări singleton cu template-uri WhatsApp

### 2. Frontend

```bash
cd frontend

# 1. Copiază fișierul de mediu
cp .env.example .env
# editează .env: REACT_APP_BACKEND_URL=http://localhost:8001

# 2. Instalează dependințele (⚠️ folosește YARN, nu npm)
yarn install

# 3. Pornește serverul de dezvoltare
yarn start
```

Deschide `http://localhost:3000`.

---

## 🌱 Seed & date demo

Seed-ul rulează automat la fiecare start al backend-ului și este **idempotent**:
- Nu se recrează dacă super admin-ul există deja;
- Codurile de recomandare lipsă sunt completate automat (backfill);
- Template-urile de mesaje noi (ex. `referral_share`) sunt migrate în setările existente.

Pentru re-seed complet dintr-o bază curată:
```bash
mongosh "$MONGO_URL" --eval "db.getSiblingDB('artjunkie_os').dropDatabase()"
# apoi restart backend
```

---

## 🧪 Rularea testelor

```bash
cd backend
pip install pytest pytest-asyncio requests
pytest tests/ -v
```

Suita curentă include:
- `tests/backend_test.py` — 17 teste (auth, CRUD, notificări, portal client, dashboard)
- `tests/test_referral.py` — 16 teste (flux recomandare complet: cod, endpoint public, creare lead, notificare, admin management)

---

## 🔑 Variabile de mediu

### Backend (`backend/.env`)

| Variabilă | Obligatoriu | Descriere |
|-----------|-------------|-----------|
| `MONGO_URL` | ✅ | URI MongoDB — local (`mongodb://localhost:27017`) sau Atlas (`mongodb+srv://...`) |
| `DB_NAME` | ✅ | Numele bazei (implicit `artjunkie_os`) |
| `CORS_ORIGINS` | ✅ | Origini permise, separate prin virgulă. Producție: `https://os.artjunkie.ro` |
| `JWT_SECRET` | ✅ | Cheie de semnare JWT — generează cu `openssl rand -hex 32` |
| `ADMIN_EMAIL` | ✅ | Email super admin (creat la primul start) |
| `ADMIN_PASSWORD` | ✅ | Parolă super admin — **schimb-o înainte de deploy** |
| `WHATSAPP_ACCESS_TOKEN` | ❌ | Token Meta Cloud API — gol = mesajele salvate ca `pending` |
| `WHATSAPP_PHONE_NUMBER_ID` | ❌ | ID numărul WhatsApp Business |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ❌ | WABA ID |
| `VAPID_PUBLIC_KEY` | ❌ | Cheie publică VAPID pentru Web Push |
| `VAPID_PRIVATE_KEY` | ❌ | Cheie privată VAPID |
| `EMAIL_SERVER` | ❌ | URL SMTP (ex: `smtps://user:pass@smtp.host:465`) |
| `EMAIL_FROM` | ❌ | Adresă expeditor |

### Frontend (`frontend/.env`)

| Variabilă | Obligatoriu | Descriere |
|-----------|-------------|-----------|
| `REACT_APP_BACKEND_URL` | ✅ | URL-ul backend-ului, fără `/api` la final |
| `WDS_SOCKET_PORT` | ❌ | Port websocket pentru hot reload (util în medii cloud) |
| `ENABLE_HEALTH_CHECK` | ❌ | `false` implicit |

> **Fără chei WhatsApp / VAPID / SMTP**: aplicația funcționează integral. Toate apelurile către aceste servicii ies grațios cu status `pending` (log în consolă), fără să blocheze fluxurile principale.

---

## 👥 Conturi demo

Toate parolele demo: **`ArtJunkie123!`**

| Rol | Email |
|-----|-------|
| Super Admin | `admin@artjunkie.ro` |
| Admin / Showroom | `showroom@artjunkie.ro` |
| Consilier vânzări | `vanzari@artjunkie.ro` |
| Măsurători | `masuratori1@artjunkie.ro`, `masuratori2@artjunkie.ro` |
| Montator | `montator1@artjunkie.ro`, `montator2@artjunkie.ro` |
| Service | `service@artjunkie.ro` |

### Portal client (OTP)
Login pe `/client/login` cu unul dintre numerele demo (codul OTP este returnat în răspunsul API și afișat în UI ca „Demo cod"):
- `+40721000001` (client cu garanție activă — vede cardul de recomandare)
- `+40721000002`, `+40721000003`, `+40721000005` (istoric variat)
- `+40721000004` (client fără garanție activă — nu vede cardul de recomandare)

### Formular public de recomandare
După login în portalul clientului, mergi la **Recomandă** → copiază codul (ex: `D2PGZP8Z`) → deschide `/refer/<COD>` într-un browser fără login.

---

## ☁️ Deploy

### Backend (opțiuni recomandate)

#### A. Render / Railway / Fly.io

1. Creează un serviciu Web Python (runtime 3.11+).
2. **Start command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
3. **Root directory**: `backend/`
4. **Build command**: `pip install -r requirements.txt`
5. Adaugă toate variabilele din `backend/.env.example`.
6. Setează `CORS_ORIGINS` la domeniul exact al frontend-ului (`https://os.artjunkie.ro`).

#### B. Docker (self-hosted)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Frontend (Vercel — recomandat)

1. **Import** proiectul din Git.
2. **Root directory**: `frontend/`
3. **Framework preset**: Create React App
4. **Build command**: `yarn build`
5. **Output directory**: `build`
6. **Environment variables**:
   - `REACT_APP_BACKEND_URL` = URL-ul public al backend-ului
7. **Rewrites** (pentru client-side routing) — creează `frontend/vercel.json`:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
   ```

### Frontend (Netlify)

- Build command: `yarn build`
- Publish directory: `build`
- Adaugă `_redirects` cu `/* /index.html 200`

### Reverse proxy (opțional, aceeași origine)

Pentru a servi backend + frontend sub același domeniu (elimină CORS):
```
https://os.artjunkie.ro/api/*   →  backend  (proxy /api la port 8001)
https://os.artjunkie.ro/*       →  frontend static
```
În `CORS_ORIGINS` poți lăsa doar `https://os.artjunkie.ro`.

---

## 🍃 MongoDB Atlas (recomandat pentru producție)

1. Creează un cluster gratuit la [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → creează un user cu rol *Read and write to any database*.
3. **Network Access** → adaugă IP-urile serverului de producție (sau `0.0.0.0/0` pentru început, restrânge apoi).
4. **Connect** → *Drivers* → copiază connection string:
   ```
   mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Adaugă acest URL în `MONGO_URL` (backend). Nu este nevoie de nicio schimbare de cod — driver-ul `motor` funcționează identic pentru cluster și local.
6. La primul start, backend-ul creează automat indexurile necesare (email unic pentru user, telefon pentru customers, cod recomandare, OTP).

**Backup**: activează *Snapshot backups* din Atlas UI (gratuit până la 512 MB, apoi ~0.10 USD/GB/lună).

---

## 📱 PWA

Aplicația este instalabilă pe mobil (angajați + clienți):
- Manifest la `/manifest.json` (name: *ART JUNKIE OS*, short_name: *AJ OS*, theme #0B1F3A)
- Service worker la `/service-worker.js` (cache app-shell, niciodată API)
- Se instalează automat prin promptul „Add to Home Screen"

---

## 🔌 Integrări opționale (viitor)

Fiecare integrare are un stub în `backend/notifications.py` care returnează `{"status": "pending", "reason": "missing_keys"}` când cheile lipsesc:

- **WhatsApp Business Cloud API** → completează cele 3 variabile `WHATSAPP_*` și implementează apelul HTTP către Meta Graph API în `send_whatsapp_message()`.
- **Web Push notifications** → completează cele 2 chei VAPID + adaugă endpoint-ul pentru înregistrarea subscribers.
- **Email tranzacțional** → completează `EMAIL_SERVER` + `EMAIL_FROM` și implementează în `send_email_notification()` (aiosmtplib sau Resend API).

---

## 🧪 Criterii de acceptare — verificate

- [x] `pip install -r requirements.txt` — instalează fără erori
- [x] Backend pornește pe `:8001`
- [x] Frontend pornește pe `:3000`
- [x] Login admin funcțional (cookie JWT)
- [x] Dashboard, CRM, lead-uri, măsurători, montaje, comenzi, producție, garanții, service, notificări, rapoarte, setări, recomandări — toate funcționale
- [x] Aplicația angajați (PWA) — angajatul vede doar lucrările lui
- [x] Portal client cu OTP — clientul vede statusul comenzii + card recomandare + solicitare service
- [x] Calendar cu programări
- [x] Manifest PWA valid + service worker înregistrat
- [x] **Lipsa cheilor WhatsApp/Push/Email nu produce erori** — apeluri graceful cu `pending`
- [x] 33/33 teste pytest passing (17 core + 16 referral)

---

## 📄 Licență

Cod proprietar ART JUNKIE. Utilizare permisă doar cu acordul deținătorului.
