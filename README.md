# 🏃 RFID Race Tracking System

> **A full-stack web application for the Indian Army to track race participants in real-time using RFID tags across multiple checkpoints.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.5-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-asyncpg-336791?logo=postgresql)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📖 Table of Contents

- [Why This Was Built](#-why-this-was-built)
- [How It Works](#-how-it-works)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Frontend Pages & Features](#-frontend-pages--features)
- [Race Lifecycle](#-race-lifecycle)
- [Development Notes](#-development-notes)
- [Future Roadmap](#-future-roadmap)

---

## 🎯 Why This Was Built

Manual race tracking in large events (like Indian Army fitness tests — BPT, PPT, CPT) is error-prone, slow, and hard to audit. This system replaces manual stopwatches and paper-based recording with:

- **Automated RFID scanning** at each checkpoint gate (start, checkpoint 1, checkpoint 2, finish)
- **Real-time leaderboard** that updates every 2 seconds during an active race
- **Army server verification** — each runner is authenticated against internal army records before being allowed to race
- **Permanent archiving** — race results are immutably stored per session, exportable as CSV for records

**Target users:** Race administrators / officials at army physical fitness events.

---

## ⚙️ How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             HIGH-LEVEL FLOW                                 │
│                                                                             │
│  Admin uploads CSV  →  Backend verifies against Army server  →  Race starts │
│                                                                             │
│  Runners cross gates → RFID readers POST to /checkpoints/record             │
│                                                                             │
│  Frontend polls/simulates live updates → leaderboard re-ranks in real-time  │
│                                                                             │
│  Admin ends race → results archived → CSV export available                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Flow

1. **Upload Runners** — Admin uploads a `.csv` file with two columns: `RFID_Tag, Army_Number`
2. **Verify Runners** — The system calls `/api/v1/verify/{army_number}` for each runner against an internal Army verification server (mock in dev: always passes)
3. **Configure Race** — Admin picks race type (BPT / PPT / CPT / custom) and number of checkpoints (2–4)
4. **Start Race** — Creates a `RaceSession` in the DB (status: `pending → active`). RFID readers are now "armed"
5. **RFID Reads** — Each time a runner crosses a gate, the RFID reader sends an HTTP POST to the backend with the tag ID and checkpoint name
6. **Live Dashboard** — The frontend refreshes the leaderboard every 2 seconds, ranking runners by elapsed time
7. **Finish Race** — Admin ends the race. Results are snapshotted into `race_results` (immutable archive), ranked, with total times in seconds
8. **Export** — CSV export available directly from the dashboard or via `GET /api/v1/races/{id}/export`

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE                              │
│                                                                            │
│   ┌──────────────────────┐          ┌───────────────────────────────────┐  │
│   │   React Frontend     │  HTTP    │       FastAPI Backend              │  │
│   │   (Vite + TailwindCSS│ ◄──────► │   (Python 3.11+, Async)           │  │
│   │   + Framer Motion)   │  :8000   │                                   │  │
│   │                      │          │  ┌─────────────────────────────┐  │  │
│   │  Pages:              │          │  │  Routers:                   │  │  │
│   │  • Login             │          │  │  • /runners  (CRUD)         │  │  │
│   │  • Dashboard         │          │  │  • /checkpoints (record)    │  │  │
│   │  • Upload Tags       │          │  │  • /verify  (auth check)    │  │  │
│   │  • Settings          │          │  │  • /races   (lifecycle)     │  │  │
│   │                      │          │  └──────────────┬──────────────┘  │  │
│   │  State (Zustand):    │          │                 │ SQLAlchemy ORM  │  │
│   │  • authStore         │          │  ┌──────────────▼──────────────┐  │  │
│   │  • raceStore         │          │  │     PostgreSQL Database      │  │  │
│   │  • runnerStore       │          │  │                              │  │  │
│   │  • settingsStore     │          │  │  Tables:                     │  │  │
│   └──────────────────────┘          │  │  • runners                  │  │  │
│                                     │  │  • race_sessions             │  │  │
│   ┌──────────────────────┐          │  │  • checkpoint_records        │  │  │
│   │    RFID Readers      │ HTTP POST │  │  • race_results              │  │  │
│   │ (Physical hardware / │ ────────► │  └──────────────────────────── │  │  │
│   │  simulated in dev)   │ /checkpoints/record                        │  │  │
│   └──────────────────────┘          │                                   │  │
│                                     │  ┌─────────────────────────────┐  │  │
│                                     │  │  Internal Army Server       │  │  │
│                                     │  │  (mock in dev mode)         │  │  │
│                                     │  └─────────────────────────────┘  │  │
│                                     └───────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Layer | Technology | Responsibility |
|---|---|---|
| **Frontend** | React 19 + Vite | UI, state management, real-time leaderboard |
| **State Management** | Zustand | Auth, race lifecycle, runner list, settings |
| **Backend** | FastAPI (async) | REST API, race logic, data validation |
| **ORM** | SQLAlchemy 2 (async) | Database models and queries |
| **Database** | PostgreSQL + asyncpg | Persistent storage of all race data |
| **Migrations** | Alembic | Schema versioning |
| **Validation** | Pydantic v2 | Request/response models |
| **Styling** | TailwindCSS v4 + Framer Motion | Design system + animations |

---

## 🛠️ Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| `fastapi` | 0.115.5 | Web framework |
| `uvicorn[standard]` | 0.32.1 | ASGI server |
| `sqlalchemy` | 2.0.36 | ORM (async mode) |
| `asyncpg` | 0.30.0 | Async PostgreSQL driver |
| `psycopg2-binary` | 2.9.10 | Sync driver for Alembic migrations |
| `alembic` | 1.14.0 | Schema migrations |
| `pydantic` | 2.10.3 | Data validation |
| `pydantic-settings` | 2.6.1 | `.env` config loading |
| `python-dotenv` | 1.0.1 | Environment file support |
| `httpx` | 0.28.1 | Async HTTP client (for calling Army server) |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | 19.x | UI framework |
| `react-router-dom` | 7.x | Client-side routing |
| `zustand` | 5.x | Lightweight state management |
| `framer-motion` | 12.x | Animations |
| `tailwindcss` | 4.x | Utility-first CSS |
| `lucide-react` | 1.x | Icon set |
| `papaparse` | 5.x | CSV parsing in browser |
| `@radix-ui/*` | various | Accessible UI primitives |

---

## 📁 Project Structure

```
RFID_race_tracking/
│
├── backend/                        # Python FastAPI backend
│   ├── .env                        # Local environment variables (git-ignored)
│   ├── .env.example                # Template for .env
│   ├── requirements.txt            # Python dependencies
│   ├── alembic.ini                 # Alembic config
│   ├── alembic/
│   │   ├── env.py                  # Migration environment setup
│   │   └── versions/               # Auto-generated migration files
│   └── app/
│       ├── main.py                 # FastAPI app factory + router registration
│       ├── database.py             # Async engine + session factory
│       ├── core/
│       │   └── config.py           # Settings loaded from .env via pydantic-settings
│       ├── models/                 # SQLAlchemy ORM models
│       │   ├── runner.py           # Runner + RunnerStatus enum
│       │   ├── race_session.py     # RaceSession + RaceCategory/Status enums
│       │   ├── checkpoint.py       # CheckpointRecord + CheckpointName enum
│       │   └── race_result.py      # Immutable final standings
│       ├── schemas/                # Pydantic request/response schemas
│       ├── crud/                   # Database access layer
│       │   ├── runner.py           # Runner CRUD operations
│       │   ├── race.py             # Race lifecycle logic
│       │   └── checkpoint.py       # Checkpoint record creation
│       └── routers/                # FastAPI route handlers
│           ├── runners.py          # /runners endpoints
│           ├── checkpoints.py      # /checkpoints endpoints
│           ├── verify.py           # /verify endpoints
│           └── races.py            # /races endpoints
│
├── src/                            # React frontend (Vite)
│   ├── main.jsx                    # App entry point
│   ├── App.jsx                     # Router + ProtectedRoute setup
│   ├── index.css                   # Global CSS design tokens
│   ├── pages/
│   │   ├── Login.jsx               # Auth gate (local credentials)
│   │   ├── Dashboard.jsx           # Live leaderboard + race controls
│   │   ├── UploadTags.jsx          # CSV upload + verification wizard
│   │   ├── Settings.jsx            # Race config + RFID reader status
│   │   └── NotFound.jsx            # 404 page
│   ├── store/                      # Zustand state stores
│   │   ├── authStore.js            # Login state
│   │   ├── raceStore.js            # Race lifecycle (idle/active/finished)
│   │   ├── runnerStore.js          # Runner list + live simulation
│   │   └── settingsStore.js        # Checkpoints count, race title, reader status
│   ├── services/
│   │   └── api.js                  # All backend API calls (fetch wrapper)
│   ├── components/                 # Reusable UI components
│   ├── layouts/
│   │   └── DashboardLayout.jsx     # Sidebar + top nav wrapper
│   ├── hooks/                      # Custom React hooks
│   ├── routes/                     # Route definitions
│   ├── mock/                       # Mock data for dev/testing
│   └── utils/                      # Helper utilities
│
├── index.html                      # Vite HTML entry point
├── vite.config.js                  # Vite + React + TailwindCSS plugin config
├── tsconfig.json                   # TypeScript config (used by Vite)
├── package.json                    # Node dependencies
└── .gitignore
```

---

## 🗄️ Database Schema

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATABASE TABLES                          │
│                                                                  │
│  runners                          race_sessions                  │
│  ─────────────────────────        ─────────────────────────────  │
│  army_number  PK  VARCHAR(32)     id            PK  UUID         │
│  rfid_tag     UQ  VARCHAR(64)     category          ENUM         │
│  verified         BOOLEAN         custom_name       VARCHAR(100) │
│  verified_at      TIMESTAMP       status            ENUM         │
│  status           ENUM            started_at        TIMESTAMP    │
│  created_at       TIMESTAMP       finished_at       TIMESTAMP    │
│  updated_at       TIMESTAMP       created_at        TIMESTAMP    │
│                                                                  │
│  checkpoint_records               race_results                   │
│  ─────────────────────────        ─────────────────────────────  │
│  id             PK  UUID          id             PK  UUID        │
│  army_number    FK  VARCHAR(32)   race_session_id FK  UUID       │
│  checkpoint         ENUM          army_number    FK  VARCHAR(32) │
│  recorded_at        TIMESTAMP     rfid_tag           VARCHAR(64) │
│  reader_id          VARCHAR(32)   start_time         TIMESTAMP   │
│  race_session_id FK  UUID         checkpoint1_time   TIMESTAMP   │
│  created_at         TIMESTAMP     checkpoint2_time   TIMESTAMP   │
│                                   finish_time        TIMESTAMP   │
│                                   total_time_seconds INTEGER     │
│                                   rank               INTEGER     │
│                                   status             VARCHAR(20) │
│                                   created_at         TIMESTAMP   │
└──────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **`army_number` as primary key for `runners`** — Uniquely identifies a soldier even if their RFID tag is replaced or lost
- **`race_results` is an immutable archive** — When a race is finished, standings are copied here and never modified, preserving historical records
- **`checkpoint_records` is append-only** — Every RFID read is recorded; the backend uses the *earliest* read at each gate as the authoritative time
- **One active race at a time** — The API enforces that you cannot create a new race while one is active

### Enums

| Enum | Values |
|---|---|
| `RunnerStatus` | `registered`, `running`, `finished`, `disqualified` |
| `RaceCategory` | `BPT`, `PPT`, `CPT`, `others` |
| `RaceStatus` | `pending`, `active`, `finished` |
| `CheckpointName` | `start`, `checkpoint1`, `checkpoint2`, `finish` |

---

## 📡 API Reference

Base URL: `http://localhost:8000/api/v1`

Interactive docs: `http://localhost:8000/api/docs` (Swagger UI) | `http://localhost:8000/api/redoc`

### Runners

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/runners/` | List all runners |
| `GET` | `/runners/verified` | List only verified runners |
| `POST` | `/runners/` | Register a single runner |
| `POST` | `/runners/bulk` | Bulk register from CSV upload |
| `GET` | `/runners/{army_number}` | Get a specific runner |
| `PATCH` | `/runners/{army_number}/status` | Update runner status |
| `DELETE` | `/runners/{army_number}` | Remove a runner |

### Verification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/verify/{army_number}` | Verify a soldier against the Army server |

> In development (`DEBUG=True`), verification always returns `verified: true` after a simulated 150ms delay. Set `VERIFICATION_SERVER_URL` in `.env` to enable the real server call.

### Race Sessions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/races/` | List all race sessions (newest first) |
| `POST` | `/races/` | Create a new race session |
| `POST` | `/races/{id}/start` | Start a pending race |
| `POST` | `/races/{id}/finish` | Finish an active race + archive results |
| `GET` | `/races/{id}/results` | Get final standings for a finished race |
| `GET` | `/races/{id}/export` | Download results as CSV |

### Checkpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/checkpoints/record` | Record an RFID read at a gate |
| `GET` | `/checkpoints/{army_number}` | Get all checkpoint records for a runner |

#### Record Checkpoint Payload
```json
{
  "rfid_tag": "TAG-1007",
  "checkpoint": "start",
  "recorded_at": "2025-06-01T08:30:00Z",
  "race_session_id": "uuid-here-or-null"
}
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 20+** and **npm**
- **PostgreSQL 14+** (running locally or remotely)
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/Sahilnegi4444/RFID-based-Race-tracking-system.git
cd RFID-based-Race-tracking-system
```

---

### 2. Set Up the Backend

#### a. Create and activate a virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

#### b. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### c. Configure environment variables

```bash
# Copy the example file
copy .env.example .env      # Windows
cp .env.example .env        # macOS/Linux
```

Edit `.env` with your actual values:

```env
# PostgreSQL — adjust host/user/pass/dbname as needed
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/race_track

# Leave blank to use mock verification (always passes)
VERIFICATION_SERVER_URL=

# App settings
APP_ENV=development
DEBUG=True
```

#### d. Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE race_track;"
```

#### e. Run database migrations (optional — auto-created in DEBUG mode)

```bash
# From inside the backend/ directory
alembic upgrade head
```

> **Note:** In `DEBUG=True` mode, tables are automatically created on startup via `Base.metadata.create_all`. Alembic is recommended for production deployments.

#### f. Start the backend server

```bash
# From inside the backend/ directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
Swagger docs: `http://localhost:8000/api/docs`

---

### 3. Set Up the Frontend

#### a. Install Node dependencies

```bash
# From the project root
npm install
```

#### b. Start the development server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

### 4. Quick Start Summary

Open **3 terminals**:

```bash
# Terminal 1 — PostgreSQL (if not running as a service)
# Start your PostgreSQL service

# Terminal 2 — Backend
cd backend
venv\Scripts\activate       # Windows
uvicorn app.main:app --reload --port 8000

# Terminal 3 — Frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## ⚙️ Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Full async PostgreSQL connection string |
| `VERIFICATION_SERVER_URL` | *(empty)* | URL of the internal Army server. Leave empty for mock mode |
| `APP_ENV` | `development` | Environment name (`development` / `production`) |
| `DEBUG` | `True` | Enables SQL echo logging and auto table creation |
| `SECRET_KEY` | `changeme_...` | JWT secret (not yet wired to auth — for future use) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token expiry |

### Frontend (`src/services/api.js`)

The API base URL is hardcoded for local dev:
```js
const API_URL = 'http://localhost:8000/api/v1';
```

Change this to your production server URL when deploying.

---

## 🖥️ Frontend Pages & Features

### 🔐 Login (`/login`)
- Simple credential-based login (stored in `authStore` via Zustand)
- All other routes are protected — redirect to login if unauthenticated

### 📊 Dashboard (`/dashboard`)
- **Stats bar** — Total runners, currently running, finished count, active checkpoint count
- **Race control** — Start Race / End Race buttons with animated status indicator
- **Live leaderboard** — Animates row re-ordering in real-time using Framer Motion's `layout` prop. Updates every 2 seconds during an active race via `simulateLiveUpdates`
- **Export CSV** — Downloadable results with rank, army number, RFID tag, all checkpoint times, and total elapsed time

### 📤 Upload Tags (`/upload`)
Three-step wizard:
1. **Drag & drop or browse** a `.csv` file (`RFID_Tag, Army_Number` per row)
2. **Verify** — Each army number is verified against the backend in sequence (with spinner per row)
3. **Import** — Only verified runners are bulk-inserted into the database and added to the frontend store

### ⚙️ Settings (`/settings`)
- **Race Type** — Select BPT / PPT / CPT / Custom
- **Custom Race Name** — Shown when "others" is selected
- **Checkpoint Count** — 2 (Start → CP1), 3 (+ CP2), or 4 (+ Finish)
- **RFID Reader Status Panel** — Shows online/offline status and signal strength for each configured reader

---

## 🏁 Race Lifecycle

```
     ┌─────────────┐
     │    idle     │  ◄── Default state, no race running
     └──────┬──────┘
            │ Admin presses "Start Race"
            ▼
     ┌─────────────┐    POST /races/        → creates session (pending)
     │   pending   │    POST /races/{id}/start → transitions to active
     └──────┬──────┘
            │ Backend confirms start
            ▼
     ┌─────────────┐    RFID readers POST checkpoint records
     │   active    │    Frontend polls every 2s to update leaderboard
     └──────┬──────┘
            │ Admin presses "End Race"
            ▼
     ┌─────────────┐    POST /races/{id}/finish
     │  finished   │    → calculates rankings + total times
     └─────────────┘    → archives to race_results table
                        GET /races/{id}/export → CSV download
```

---

## 🔧 Development Notes

### Mock Mode
When `VERIFICATION_SERVER_URL` is not set, the `/verify/{army_number}` endpoint always returns `verified: true` after 150ms — no real army server needed during development.

### Live Simulation
During an active race, `runnerStore.simulateLiveUpdates()` randomly advances runners through checkpoints every 2 seconds. This replaces real RFID hardware in development. To disable it, stop the `setInterval` in `Dashboard.jsx`.

### CORS
The backend allows requests from `http://localhost:5173` and `http://localhost:3000`. Update `allow_origins` in `backend/app/main.py` for other origins.

### Database Connection Pool
Configured with `pool_size=10, max_overflow=20` in `database.py`. Adjust for your expected load.

### API Error Handling
All frontend API calls in `src/services/api.js` have `try/catch` with graceful fallbacks — the UI won't hard-crash if the backend is temporarily unavailable.

### CSV Format
The upload page expects exactly two columns, no header row:
```
TAG-1001,14682571K
TAG-1002,15893421J
TAG-1003,22341589M
```

---

## 🛣️ Future Roadmap

- [ ] **WebSocket support** — Replace polling with real-time push from backend using `websockets` or Server-Sent Events
- [ ] **JWT Authentication** — Wire up the existing `SECRET_KEY` / `ALGORITHM` settings into proper login tokens
- [ ] **Admin roles** — Different access levels (read-only vs. race control)
- [ ] **Multi-race concurrency** — Allow parallel races for different categories
- [ ] **Real RFID reader integration** — Replace simulation with actual hardware API
- [ ] **Mobile-responsive leaderboard** — Optimize for large display screens at race venues
- [ ] **Alembic migrations for production** — Full migration history instead of auto-create
- [ ] **Docker Compose setup** — One-command deployment for the full stack
- [ ] **Automated tests** — pytest for backend, Vitest for frontend

---

## 📄 License

This project is built for the **Indian Army** internal use. All rights reserved.

---

<div align="center">
  <p>Built with ❤️ for precision, speed, and accountability in Indian Army fitness evaluations.</p>
</div>
