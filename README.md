# 🎻 Cello Planner

> **AI-Powered Event Planning Ecosystem** — manage events, tasks, and attendees with OpenAI transcription and QR gate check-in, wrapped in a premium glassmorphism UI.
> By Rehema Muchai and Weddy Karanja.

---

## Overview

Cello Planner is a full-stack web application built for event organizers who need a single, elegant workspace. Create events, build task boards, manage guest lists, record and transcribe planning meetings with AI, and check in attendees at the gate using live QR scanning — all from one dashboard.

---

## Features

| Module | What it does |
|---|---|
| **Dashboard** | At-a-glance stats (events, tasks, attendees) and upcoming event timeline |
| **Events** | Full CRUD — create, edit, delete events with title, date, location, and description |
| **Task Board** | Per-event task creation with To-Do / In-Progress / Done status; cross-event Kanban view |
| **Attendees** | Add guests to events, search/filter by check-in status, one-click check-in from the table |
| **AI Transcribe** | Upload an audio recording → OpenAI Whisper transcribes it → GPT-4o-mini extracts action items → add them directly as tasks |
| **Gate Scanner** | Generate a QR code per attendee, scan with device camera at the door to check them in instantly |
| **Settings** | Update profile name/email and change password |
| **Auth** | JWT-based register/login with bcrypt password hashing, 7-day token expiry, and auto-redirect |

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Dev server & build tool |
| Tailwind CSS | 3 | Utility-first styling |
| React Router DOM | 6 | Client-side routing |
| Axios | 1.6 | HTTP client with JWT interceptors |
| lucide-react | 0.378 | Icon set |
| react-qr-code | 2.0 | QR code generator |
| html5-qrcode | 2.3 | Webcam QR scanner |

### Backend
| Package | Version | Purpose |
|---|---|---|
| Express | 4.18 | HTTP server & routing |
| better-sqlite3 | latest | Embedded SQLite database |
| jsonwebtoken | 9 | JWT creation & verification |
| bcryptjs | 2.4 | Password hashing |
| multer | 1.4 | Audio file uploads |
| openai | 4.38 | Whisper + GPT-4o-mini API |
| dotenv | 16 | Environment variable loading |
| cors | 2.8 | Cross-origin request handling |
| nodemon | 3.1 | Dev auto-restart |

---

## Project Structure

```
cello-planner/
├── README.md
│
├── server/
│   ├── server.js              # Express app — all routes, DB init, middleware
│   ├── package.json
│   ├── .env                   # Your secrets (not committed)
│   ├── .env.example           # Template — copy to .env
│   ├── cello_planner.db       # SQLite file (auto-created on first run)
│   └── uploads/               # Uploaded audio files (auto-created)
│
└── client/
    ├── index.html
    ├── vite.config.js         # Dev proxy → :3001
    ├── tailwind.config.js     # Design tokens (sage, gold, cream)
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx            # Router, sidebar shell, auth guards
        ├── index.css          # Tailwind layers + component classes
        ├── context/
        │   └── AuthContext.jsx    # Auth state, login/register/logout
        ├── lib/
        │   └── api.js             # Axios instance with JWT + 401 handling
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── EventsPage.jsx     # List view + detail view (nested routes)
            ├── TasksPage.jsx      # Cross-event Kanban board
            ├── AttendeesPage.jsx  # Searchable attendee table
            ├── TranscribePage.jsx # Audio upload + AI processing
            ├── GateScannerPage.jsx# QR generator + live webcam scanner
            └── SettingsPage.jsx   # Profile & password management
```

---

## Database Schema

```sql
users
  id            INTEGER PRIMARY KEY
  name          TEXT
  email         TEXT UNIQUE
  password_hash TEXT
  role          TEXT DEFAULT 'user'
  created_at    TEXT

events
  id          INTEGER PRIMARY KEY
  user_id     INTEGER → users.id
  title       TEXT
  date        TEXT
  description TEXT
  location    TEXT
  created_at  TEXT

tasks
  id         INTEGER PRIMARY KEY
  event_id   INTEGER → events.id
  title      TEXT
  status     TEXT  -- 'To-Do' | 'In-Progress' | 'Done'
  created_at TEXT

attendees
  id           INTEGER PRIMARY KEY
  event_id     INTEGER → events.id
  name         TEXT
  email        TEXT
  has_attended INTEGER DEFAULT 0
  created_at   TEXT

audio_logs
  id              INTEGER PRIMARY KEY
  event_id        INTEGER → events.id
  file_path       TEXT
  transcription   TEXT
  extracted_tasks TEXT  -- JSON array of strings
  created_at      TEXT
```

All foreign keys cascade on delete. WAL journal mode is enabled for concurrent reads.

---

## API Reference

All protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | — | `name, email, password` | Create account, returns JWT |
| `POST` | `/api/auth/login` | — | `email, password` | Login, returns JWT |
| `GET` | `/api/auth/me` | ✅ | — | Validate token, get user |
| `PUT` | `/api/auth/profile` | ✅ | `name, email` | Update profile |
| `PUT` | `/api/auth/password` | ✅ | `current, next` | Change password |

### Events
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/events` | ✅ | List all events (with task + attendee counts) |
| `POST` | `/api/events` | ✅ | Create event |
| `GET` | `/api/events/:id` | ✅ | Event detail + tasks + attendees |
| `PUT` | `/api/events/:id` | ✅ | Update event |
| `DELETE` | `/api/events/:id` | ✅ | Delete event (cascades tasks + attendees) |

### Tasks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/events/:id/tasks` | ✅ | List tasks for an event |
| `POST` | `/api/events/:id/tasks` | ✅ | Create task (`title`, optional `status`) |
| `PUT` | `/api/tasks/:id` | ✅ | Update title or status |
| `DELETE` | `/api/tasks/:id` | ✅ | Delete task |

### Attendees
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/events/:id/attendees` | ✅ | List attendees for an event |
| `POST` | `/api/events/:id/attendees` | ✅ | Add attendee (`name`, optional `email`) |
| `PATCH` | `/api/attendees/:id/check-in` | ✅ | Mark attendee as attended |
| `DELETE` | `/api/attendees/:id` | ✅ | Remove attendee |

### AI Transcription
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/events/:id/transcribe` | ✅ | Upload audio file (multipart `audio` field) → returns `transcription` + `extractedTasks[]` |

### Utility
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Server health check |

---

## Quick Start

### Prerequisites
- Node.js 18+ (tested on v24)
- An OpenAI API key (for AI transcription — optional, app works without it)

### 1. Clone and configure

```bash
cd cello-planner/server
copy .env.example .env
```

Open `.env` and set:

```env
PORT=3001
JWT_SECRET=replace_with_a_long_random_string
OPENAI_API_KEY=sk-...   # optional — skip to disable AI features
```

### 2. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Start both servers

```bash
# Terminal 1 — backend (port 3001)
cd server
npm run dev

# Terminal 2 — frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

> The Vite dev server proxies all `/api/*` requests to `:3001` automatically — no CORS issues in development.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default `3001`) |
| `JWT_SECRET` | Yes | Secret key for signing JWTs — use a long random string in production |
| `OPENAI_API_KEY` | No | Enables Whisper transcription + GPT-4o-mini task extraction |

---

## Design System

The UI follows a **"Simple but Fancy"** philosophy — highly intuitive navigation with a visually premium feel.

| Token | Value | Usage |
|---|---|---|
| `sage` | Green family `#4a7c59` base | Primary actions, sidebar, badges |
| `gold` | Amber family `#d4a017` base | Highlights, CTAs, avatars |
| `cream` | Warm off-white `#fdf8f0` base | Backgrounds, cards, subtle fills |

**UI Patterns:**
- Glassmorphism cards: `bg-white/70 backdrop-blur-sm border border-white/50`
- All cards use `rounded-2xl` with `shadow-glass`
- Hover states: `-translate-y-0.5` lift + shadow increase
- Transitions: `transition-all duration-300` throughout
- Collapsible sidebar on desktop, drawer on mobile
- Lucide icons throughout for consistency

---

## How AI Transcription Works

1. User selects an event and uploads an audio file (MP3, WAV, MP4, WebM — max 25 MB)
2. Server receives the file via Multer and streams it to **OpenAI Whisper** (`whisper-1`)
3. The raw transcript is passed to **GPT-4o-mini** with a prompt to extract action items as a JSON array
4. The UI displays the full transcript and each extracted task with an **"Add Task"** button
5. Clicking "Add Task" calls `POST /api/events/:id/tasks` to save it directly to the event

If `OPENAI_API_KEY` is not set, the file is still uploaded and stored — the response just tells you AI is disabled.

---

## How QR Check-in Works

1. On the **Gate Scanner** page, select an event and attendee to generate their QR code
2. The QR value encodes `cello:attendee:<id>`
3. Download the SVG to print or share with the attendee
4. At the door, use the **Live Gate Scanner** — it opens the device camera
5. When a valid QR is scanned, it calls `PATCH /api/attendees/:id/check-in` and shows a confirmation
6. Recent check-ins appear in a live log below the scanner

---

## Production Notes

- Replace `JWT_SECRET` with a cryptographically random 64-character string
- The SQLite `.db` file lives in `server/` — back it up regularly
- For serving the frontend in production, run `npm run build` in `/client` and serve the `dist/` folder from Express or a CDN
- Audio uploads live in `server/uploads/` — consider moving to object storage (S3/R2) at scale
- Add rate-limiting (e.g. `express-rate-limit`) to auth routes before exposing to the internet
