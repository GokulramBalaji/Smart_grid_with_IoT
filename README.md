# SmartGrid Monitor

**Intelligent Three-Phase Energy Monitoring and Analytics Platform**

SmartGrid Monitor is a full-stack IoT energy monitoring application built around an
ESP32 microcontroller and three PZEM-004T energy sensors — one per electrical phase
(R, Y, B). It ingests live sensor data, stores it in PostgreSQL, computes derived
electrical parameters, raises threshold-based alerts, and visualizes everything in a
real-time, Apple-inspired dashboard.

The platform works with real hardware out of the box, and ships with a fully
functional **Demo Mode** so the entire application can be explored without any
physical device.

---

## Features

- **Real-time dashboard** — live-updating summary cards, three-phase detail cards, and
  a range-filterable power chart (1h / 6h / 24h / 7d / 30d), pushed to the browser over
  Server-Sent Events.
- **Three-phase monitoring** — dedicated Phase R / Y / B cards with voltage, current,
  active/apparent/reactive power, power factor, frequency and energy.
- **Voltage, current & power factor analysis** — imbalance percentage, min/max/avg, and
  power-factor status (Excellent / Good / Warning / Poor) with recommendations.
- **Load Balance page** — per-phase load distribution, most/least loaded phase, and
  plain-language rebalancing recommendations.
- **Energy Analytics** — hourly/daily/weekly/monthly consumption, phase-wise energy,
  today-vs-yesterday / week-vs-week / month-vs-month comparisons, and an **explainable,
  clearly-labeled forecast** (linear trend blended with a 7-day moving average).
- **Alert Center** — eight alert types (high/low voltage, overcurrent, phase imbalance,
  poor power factor, frequency abnormality, device offline, communication failure)
  across Info/Warning/Critical severities, with search, filters, and acknowledge/resolve
  workflow.
- **Device management** — provision ESP32 devices, generate & rotate API keys, view
  per-sensor (PZEM R/Y/B) connection status, edit device metadata.
- **Historical data explorer** — searchable, sortable, paginated table with phase and
  date-range filters, plus CSV export.
- **Reports** — daily / weekly / monthly / custom-range reports with CSV export;
  architected so a PDF export can be added later without changing the data layer.
- **Settings** — profile & password, device configuration, per-device alert thresholds,
  and notification toggles.
- **Admin dashboard** — platform totals (users, devices, online/offline, readings) and
  user role management, visible only to `ADMIN` accounts.
- **Demo Mode** — a realistic three-phase load simulator (diurnal load curve, correlated
  V/I/P/PF, occasional injected anomalies) that runs through the exact same ingestion,
  threshold-evaluation and alerting pipeline as real hardware.

---

## Technology Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, hand-built Apple-inspired component library |
| Charts | Recharts |
| Animation | Framer Motion |
| Icons | Lucide React |
| Auth | Auth.js (NextAuth v5), Credentials provider, bcrypt password hashing |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Real-time | Server-Sent Events (`/api/stream/dashboard`) |
| Notifications | Sonner (toasts) |

> **Note on "PrebuiltUI":** the component library referenced in the original brief
> ([prebuiltui.com](https://prebuiltui.com)) is a copy-paste Tailwind snippet
> collection, not an installable package. Its visual language (rounded-2xl cards, thin
> borders, soft shadows, restrained color) has been hand-built as a small reusable
> component library in `components/ui/` instead.

---

## Hardware Architecture

```text
        ┌──────────────┐
        │   PZEM 1     │──── Phase R
        └──────┬───────┘
        ┌──────┴───────┐        Wi-Fi / HTTPS         ┌────────────────────┐
        │    ESP32     │───────────────────────────▶  │  POST /api/iot/    │
        └──────┬───────┘        JSON payload           │      readings      │
        ┌──────┴───────┐        + Bearer API key        └─────────┬──────────┘
        │   PZEM 2     │──── Phase Y                              │
        └──────────────┘                                          ▼
        ┌──────────────┐                                 validate → ingest →
        │   PZEM 3     │──── Phase B                      derive → threshold-check
        └──────────────┘                                  → alert → store
```

One ESP32 polls three PZEM-004T sensors (one per phase) and POSTs a combined reading
to the backend on a fixed interval. See **ESP32 Integration** below for the exact
payload and authentication scheme.

## Software Architecture

```text
app/
  (auth)/            Login, register, forgot/reset password (centered card layout)
  dashboard/          Protected app shell: dashboard, analytics, load-balance,
                       historical-data, alerts, devices, reports, settings, admin
  api/
    auth/             Auth.js handlers, register, forgot/reset password
    iot/readings/     ESP32 ingestion endpoint (device API key auth)
    demo/             Demo Mode tick + toggle
    stream/dashboard/ Server-Sent Events live dashboard feed
    dashboard/        Dashboard summary API
    readings/         Raw readings, history (chart), sparklines, CSV export
    analytics/        Consumption trends, comparisons, forecast
    alerts/           Alert list/filter + acknowledge/resolve
    devices/          CRUD, API key rotation, per-device config
    reports/          Report generation + CSV export
    admin/            Platform stats + user management (ADMIN only)

components/
  ui/                 Button, Card, Input, Badge, Modal, Tabs, Dropdown, Table,
                       Switch, Avatar, EmptyState, Loading
  layout/              Sidebar, mobile nav, dashboard shell
  dashboard/, analytics/, load-balance/, alerts/, devices/, historical/, reports/,
  settings/, admin/, landing/, charts/   Page-specific composed components

lib/
  calculations/       Pure electrical-engineering math (imbalance, power-factor
                       status, energy delta, load distribution, alert thresholds)
  analytics/           Bucketing, forecasting (explainable linear-trend model),
                       report aggregation
  validations/         Zod schemas (auth, IoT ingestion, device, config)
  demo/                Three-phase load simulator
  ingest.ts            Shared ingestion pipeline (used by both the ESP32 endpoint
                       and Demo Mode) — validate → store → derive → alert
  session.ts           Auth/ownership guards for API routes
  security.ts           Password hashing, device API key generation/verification

prisma/
  schema.prisma        Data model (see below)
  seed.ts              Demo user, admin user, device, 30 days of realistic
                       15-minute-resolution readings, energy summaries, alerts

types/                 Shared TypeScript types
hooks/                  useDashboardStream (SSE), useDemoMode (client-side ticking)
```

### Database schema

- **User** — id, name, email, passwordHash, role (`ADMIN`/`USER`)
- **Device** — id, name, deviceIdentifier, apiKeyHash/apiKeyPrefix, location, status,
  demoMode, lastSeenAt, wifiSignal, ownerId
- **SensorReading** — deviceId, timestamp, phase (`R`/`Y`/`B`), voltage, current,
  activePower, apparentPower, reactivePower, powerFactor, frequency, energy
  (cumulative), energyDelta (duplicate-safe consumption since the previous reading),
  isCalculated (true when apparent/reactive power were derived rather than measured)
- **Alert** — deviceId, type, severity, status, phase, message, value, threshold,
  timestamp, acknowledgedBy/At, resolvedAt
- **EnergySummary** — deviceId, period (`DAILY`/`WEEKLY`/`MONTHLY`/`YEARLY`),
  periodStart/End, per-phase + total energy, avg power factor, peak power, min/max
  voltage — pre-aggregated rollups that back the analytics/reports pages
- **SystemConfig** — per-device thresholds (voltage, current, power, imbalance, power
  factor) and per-alert-type notification toggles
- **PasswordResetToken** — token, userId, expiresAt, usedAt

Indexes are set on `(deviceId, timestamp)`, `(deviceId, phase, timestamp)`,
`(deviceId, status)` and `(deviceId, period, periodStart)` for the query patterns the
dashboard, analytics and alert pages actually use.

---

## Derived Calculations

All formulas live in `lib/calculations/electrical.ts` and are unit-tested by
construction (pure functions, no side effects):

```text
Total Active Power        Ptotal = PR + PY + PB
Average Voltage            Vavg = (VR + VY + VB) / 3
Average Current             Iavg = (IR + IY + IB) / 3
Average Power Factor        PFavg = (PFR + PFY + PFB) / 3
Voltage/Current Imbalance   max(|x - avg|) / avg × 100
Apparent Power (if needed)  S = V × I
Reactive Power (if needed)  Q = √(S² − P²), only when S ≥ P
Energy Delta                 max(0, cumulative_new − cumulative_prev),
                              or cumulative_new if the meter counter reset
```

Apparent and reactive power are only *calculated* when the sensor payload doesn't
already include them — each stored reading carries an `isCalculated` flag so the UI
never silently presents an estimate as a direct measurement. Forecasts (`lib/
analytics/forecast.ts`) use a simple, inspectable linear-regression trend blended with
the recent 7-day average, and are always labeled **"Estimated Forecast"** in the UI.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local install, Docker, or a hosted instance)

### Windows quick start

Double-click **`run.bat`** in the project root. It installs dependencies, prompts you
to fill in `.env` on first run, applies Prisma migrations, seeds demo data once, and
starts the dev server at http://localhost:3000. Re-running it later just starts the
server (it skips steps already done). Requires Node.js and a reachable PostgreSQL
instance — the same prerequisites as below.

### Installation

```bash
npm install
cp .env.example .env
# edit .env — see Environment Variables below
```

### Database setup

```bash
npm run db:migrate     # creates the database schema (prisma migrate dev)
npm run db:seed        # demo user, admin user, device, 30 days of readings, alerts
```

`db:seed` prints the demo device's ESP32 API key **once** — copy it if you intend to
send real payloads to `/api/iot/readings` for the seeded device instead of using Demo
Mode.

### Run the app

```bash
npm run dev
# → http://localhost:3000
```

Sign in with the seeded demo account:

```text
Email:    demo@smartgrid.io
Password: SmartGrid#2026
```

(An admin account is also seeded: `admin@smartgrid.io` / `Admin#2026`.)

### Other useful scripts

```bash
npm run build        # production build
npm run start         # run the production build
npm run db:studio      # Prisma Studio — browse the database
npm run db:reset        # drop, recreate and reseed the database
```

---

## Environment Variables

See `.env.example` for the full list. The essentials:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/smartgrid_monitor?schema=public
AUTH_SECRET=            # generate with `openssl rand -base64 32`
NEXTAUTH_SECRET=        # same value as AUTH_SECRET
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEVICE_API_SECRET=       # server-side pepper; not required by the current
                          # bcrypt-based device-key scheme, reserved for future use
SEED_DEMO_EMAIL=demo@smartgrid.io
SEED_DEMO_PASSWORD="SmartGrid#2026"   # quote any value containing '#' — dotenv
                                        # treats an unquoted '#' as a comment
```

Never commit a real `.env` file — only `.env.example` is tracked.

---

## ESP32 Integration

The complete, ready-to-flash Arduino sketch for this section lives in
[`firmware/SmartGridMonitor/`](firmware/SmartGridMonitor/) — see
[`firmware/README.md`](firmware/README.md) for wiring, libraries, and flashing
instructions. It implements everything documented below.

### Auto-provisioning (no manual key entry)

A brand-new ESP32 doesn't need an API key flashed onto it — it discovers itself onto
a utility node through the web UI:

```text
1. POST /api/devices/announce         Bearer <DEVICE_API_SECRET>   (shared bootstrap secret)
   { "deviceIdentifier": "ESP32-SMARTGRID-004", "wifiSsid": "Building-C-Chiller", "firmwareVersion": "1.0.0" }
   → { "claimed": false }             (device keeps re-announcing every ~15s)

2. An operator opens Utilities → sees it under "Discovered Devices" → clicks
   "Claim & map" → creates a new utility node (pre-filled from the Wi-Fi SSID) or
   attaches it to an existing one. This provisions a real Device row + API key.

3. POST /api/devices/fetch-key         Bearer <DEVICE_API_SECRET>
   { "deviceIdentifier": "ESP32-SMARTGRID-004" }
   → { "apiKey": "sg_live_...", "claimed": true }   (device keeps polling every ~10s until claimed)

4. The device stores that key in NVS and switches to step 5 (below) for good.
```

`fetch-key` hands back the plaintext key **exactly once** — the same one-time value
shown to the operator in the claim modal — then immediately wipes it server-side, the
same way a rotated key (`POST /api/devices/:id/regenerate-key`) becomes available for
one more auto-pickup so an already-deployed device can recover from a rotation without
being reflashed.

### Sending readings

Each device authenticates with a per-device API key (shown once, at creation or
rotation, from the Devices page, or picked up automatically as above). The ESP32
sends one combined reading per interval covering all three phases:

```text
POST /api/iot/readings
Authorization: Bearer <DEVICE_API_KEY>
Content-Type: application/json
```

```json
{
  "deviceId": "ESP32-SMARTGRID-001",
  "timestamp": "2026-08-28T12:00:00Z",
  "phases": {
    "R": { "voltage": 230.5, "current": 5.2, "power": 1100, "energy": 12.5, "frequency": 50.0, "powerFactor": 0.92 },
    "Y": { "voltage": 228.7, "current": 4.8, "power": 980,  "energy": 11.8, "frequency": 50.1, "powerFactor": 0.89 },
    "B": { "voltage": 232.1, "current": 6.1, "power": 1300, "energy": 13.4, "frequency": 49.9, "powerFactor": 0.94 }
  }
}
```

- `timestamp` is optional (defaults to server time on receipt).
- `energy` is the sensor's **cumulative** kWh counter, not a delta — the server
  computes a duplicate-safe delta itself and handles counter resets.
- `apparentPower` / `reactivePower` may be included if your firmware/sensor provides
  them; otherwise they're calculated server-side and flagged `isCalculated: true`.
- The payload is validated with Zod (`lib/validations/iot.ts`) and rejected with `400`
  if malformed, `401` if the device ID or API key don't match.
- Ingestion is rate-limited per device (120 requests/minute) to protect against a
  misbehaving device.

On success the endpoint stores three `SensorReading` rows, updates the device's
`lastSeenAt`/status, evaluates all configured thresholds, and creates any resulting
`Alert` rows — all in one transaction.

---

## Demo Mode

Every device has a `demoMode` flag. When enabled from the Devices page (or the toggle
on the main dashboard), the browser calls `POST /api/demo/tick` every 5 seconds while
a dashboard-family page is open. Each tick generates one realistic three-phase reading
(`lib/demo/simulator.ts`) — voltage wanders slightly around 230V, current follows a
diurnal load curve, and power/power-factor/energy are derived from voltage and current
rather than sampled independently — and pushes it through **the exact same
`ingestThreePhaseReading` pipeline** a real ESP32 payload uses, so thresholds, alerts
and the SSE stream all behave identically to production ingestion.

Because ticking is driven by an open browser tab rather than a persistent server
process, a device will correctly show as **offline** if no dashboard page has been open
(and no real hardware is reporting) for more than 90 seconds. For a deployment that
needs Demo Mode to run unattended, replace the client-side interval in `hooks/
useDemoMode.ts` with a scheduled job (e.g. a cron-triggered API route) that calls the
same `/api/demo/tick` endpoint.

---

## API Reference

All `/api/*` routes other than `/api/auth/*` and `/api/iot/readings` require an
authenticated session and scope data to the current user (or all users, for `ADMIN`).

```text
POST   /api/auth/register
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET|POST /api/auth/[...nextauth]      Auth.js session endpoints

GET    /api/devices                    List my devices
POST   /api/devices                    Create a device (returns API key once)
GET    /api/devices/:id                 Device detail + sensor status
PATCH  /api/devices/:id                  Update name/location/demoMode
DELETE /api/devices/:id                  Delete device
POST   /api/devices/:id/regenerate-key   Rotate API key
PATCH  /api/devices/:id/config            Update thresholds & notification toggles

POST   /api/iot/readings                ESP32 ingestion (device API key auth)
POST   /api/devices/announce             ESP32 self-announce (bootstrap secret auth)
POST   /api/devices/fetch-key            ESP32 one-time key pickup (bootstrap secret auth)
GET    /api/devices/pending               List discovered-but-unmapped devices
POST   /api/devices/pending/:id/claim     Map a discovered device onto the utility tree
POST   /api/demo/tick                    Advance Demo Mode by one reading
POST   /api/demo/toggle                  Enable/disable Demo Mode for a device

GET    /api/dashboard                    Current dashboard summary
GET    /api/stream/dashboard              SSE live dashboard feed
GET    /api/readings                      Paginated raw readings (filters + sort)
GET    /api/readings/history               Chart data, bucketed by range
GET    /api/readings/sparklines             Small multi-metric sparkline series
GET    /api/readings/export                 CSV export of raw readings

GET    /api/analytics                    Hourly/daily/weekly/monthly + comparisons + forecast
GET    /api/reports                       Report summary for a period
GET    /api/reports/export                 CSV export of a report

GET    /api/alerts                        List/filter/search alerts
PATCH  /api/alerts/:id                     Acknowledge / resolve

PATCH  /api/user/profile                  Update name / password

GET    /api/admin/stats                    Platform totals (ADMIN only)
GET    /api/admin/users                    User list (ADMIN only)
PATCH  /api/admin/users/:id                 Change a user's role (ADMIN only)
```

---

## Known Limitations / Next Steps

- **Device-offline / communication-failure alerts** are reflected live in the UI
  (computed from `lastSeenAt`), but proactively *creating* `DEVICE_OFFLINE` /
  `COMMUNICATION_FAILURE` alert rows requires a background job the current
  serverless-friendly architecture doesn't run by default — wire up a scheduled route
  (Vercel Cron, a self-hosted cron, etc.) that scans for stale devices if you need
  those as persisted alerts rather than a live status indicator.
- **Rate limiting** is in-memory and per-instance; swap in a shared store (e.g.
  Upstash Redis) before running multiple server instances.
- **PDF reports**: the reports API returns structured JSON and a CSV export today;
  the same `buildReportSummary()` data is enough to drive a PDF renderer (e.g.
  `@react-pdf/renderer`) later without changing the underlying report logic.
- **Password reset email**: `forgot-password` returns the reset link directly in the
  API response (and shows it on the confirmation screen) since no transactional email
  provider is configured — wire up Resend/SES/Postmark and remove `resetUrl` from the
  response before shipping this to production.
