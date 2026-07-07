# ART JUNKIE OS — Product Requirements Document

## Original Problem Statement
Complete internal web platform for ART JUNKIE (artjunkie.ro) — a Romanian company selling curtains, drapes, textile blinds, venetian blinds, plisse, external rollers, insect screens, and motorized systems. The platform manages customers, leads, measurements, offers, orders, production, installations, warranties, service interventions, notifications, employees and provides a customer portal. Language: Romanian. Design: premium navy/gold/white. Delivered as React + FastAPI + MongoDB.

## Architecture
- **Backend**: FastAPI on `:8001`, all routes under `/api`. Cookie-based JWT auth (`access_token`, `refresh_token`, `client_token`). Motor async MongoDB driver.
- **Frontend**: React 19 + React Router 7, Tailwind (Manrope font), sonner toasts, axios with `withCredentials`.
- **PWA**: manifest.json + service worker registered from `index.js`. App name: ART JUNKIE OS, short: AJ OS, theme #0B1F3A.
- **Multi-shell UI**: Admin (desktop, navy sidebar) · Employee (mobile dark navy, bottom nav, big tap targets) · Client (light, timeline-centric).

## User Personas
1. **Super Admin / Admin** — full access, manages employees, settings, sees all data.
2. **Sales (Consilier vânzări)** — leads, customers, offers.
3. **Măsurători (Measurement crew)** — mobile app; sees only own measurements.
4. **Montator (Installer)** — mobile app; sees only own installations.
5. **Service** — service tickets.
6. **Client** — OTP-based portal (phone + 6-digit demo code).

## Core Requirements (Static)
- Multi-role auth · CRM · Lead Kanban · Measurements · Installations · Work Orders · Production · Warranties · Service · Calendar · Notifications · Reports · Settings · PWA Employee App · Client Portal.
- All API endpoints must handle missing keys gracefully (WhatsApp/Push/Email save as pending).
- All forms validated, all lists have fallback empty states.

## What's Been Implemented (2026-07)
### Iteration 1
- Full stack: FastAPI + MongoDB, 10 core modules (CRM, leads, măsurători, montaje, comenzi, producție, garanții, service, notificări, setări).
- Multi-role JWT (cookie) auth, employee mobile PWA shell, client OTP portal, 11-stage lifecycle timeline.
- Seed with 8 users + 5 customers and full related data. **17/17 backend tests + all critical frontend flows passing.**

### Iteration 2 — Referral flow "Recomandă un prieten"
- Referral model + endpoints:
  - `GET /api/refer/{code}` (public) — returns referrer name, discount, company name.
  - `POST /api/refer/{code}` (public) — creates Customer (or reuses phone match), Lead with source=`recomandare` (notes include referrer name), Referral row with status `lead_creata`, internal admin notification.
  - `GET /api/client/referral` — code + eligibility (based on active warranty or finalized order) + share message template.
  - `GET /api/client/referrals`, `GET /api/referrals`, `PATCH /api/referrals/{id}`.
- Unique 8-char alphanumeric code per customer (no ambiguous chars), auto-backfilled on startup.
- Startup migration adds `referral_discount`, `referral_enabled`, and `referral_share` template to existing Settings.
- Client shell: new "Recomandă" nav tab, CTA card on Dashboard when eligible, `/client/recomanda` with copy link / WhatsApp / native share, message preview with editable template.
- Public `/refer/:code` page with premium hero and full form (name, phone, city, product, message).
- Admin: `/admin/recomandari` with KPI-per-status + table + inline status change; new "Recomandări" tab in customer detail; referral code displayed in header; **Settings** now has "Program Recomandare" card (discount + enabled toggle + editable `referral_share` template).
- **Discount is NOT applied automatically** — admin confirms manually in offer/order.
- **16/16 new backend tests + all critical frontend flows passing.**
- Cookie JWT auth with bcrypt hashing, role guards, super_admin bypass
- Models: User, Customer, Lead, Measurement, Installation, WorkOrder, ProductionItem, Warranty, ServiceTicket, Notification, Settings, OtpCode, Message
- CRUD for all 10 modules, filters (mine, status, q)
- Auto-notification on measurement/installation assignment
- Auto-warranty creation when installation finalized + warranty_activated
- Dashboard stats + Reports summary
- Client OTP flow (phone → 6-digit code stored in DB, returned as `demo_code` for demo)
- Client portal endpoints (orders, order-detail with timeline, warranties, service, messages)
- Startup seed: 1 super_admin + 7 employees across roles, 5 customers, 5 leads, 5 measurements, 5 installations, 5 work orders, 5 production items, 3 warranties, 2 service tickets, 3 notifications, settings singleton with 6 WhatsApp templates.

### Frontend
- **Login shell** — hero with luxury interior imagery, gold accents.
- **Admin console** — sidebar with 14 modules, KPI dashboard (11 metrics), Customers list + detail (7 history tabs), Leads Kanban (6 columns), Employees, Measurements + Installations with inline status/assignee, Work Orders with pipeline, Production cards, Calendar month view (measurements/installations/service color-coded), Warranties, Service, Notifications, Reports (bar visualisations), Settings (company info + editable WhatsApp templates).
- **Employee mobile app (PWA)** — dark navy shell, bottom nav (Azi/Măsurători/Montaje/Service), Today feed, large action buttons (În drum / Ajuns / În montaj / Finalizat / Problemă), phone + Google Maps deep-link, quick notes.
- **Client portal** — OTP login with phone, timeline lifecycle (11 stages), orders, warranties, service request form, chat messages.
- Data-testid attributes across all interactive elements.
- Pre-configured PWA manifest, service worker, gold/navy SVG icons.

### Testing (iteration_1.json)
- Backend: **17/17 pytest passing** (100%)
- Frontend: **all core flows passing** (100%)
- Only cosmetic note: unauthenticated /auth/me 401 in console (silent, handled).

## Prioritized Backlog

### P0 (deferred to next iteration but requested in spec)
- Rate-limiting on /api/auth/login and /api/client-auth/request-otp (5 failures → 15 min lockout)
- Photo upload UI in employee WorkDetail + Warranty/Service tickets (backend fields ready, needs S3/object storage integration)

### P1
- Real WhatsApp Business API integration (send_whatsapp_message wired to Meta Graph API)
- Real Push Notifications (VAPID) — worker + subscribe endpoint
- Email transactional (SMTP or Resend)
- Employee performance report with % completion
- Advanced filters on Calendar (per angajat, per tip lucrare)
- Client rating + Google Review CTA after finalization
- Loss reason picker for lost leads

### P2
- Multi-language (only RO now)
- Export CSV / PDF for reports
- Advance payment tracking with receipts
- Employee scheduling optimizer
- Inventory (materials) module

## Test Credentials
See `/app/memory/test_credentials.md`.

## Next Tasks
1. Photo upload flow (object storage integration via integration_playbook_expert_v2)
2. Real WhatsApp/Push/Email integrations
3. Login brute-force lockout
4. PDF offer generation
