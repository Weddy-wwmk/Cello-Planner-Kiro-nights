# 🎻 Cello Planner — AI-Powered Event Planning Ecosystem

A full-stack event planning app with AI transcription, QR gate check-in, and a premium glassmorphism UI.

## Tech Stack
- **Frontend:** React (Vite) · Tailwind CSS · React Router DOM
- **Backend:** Node.js · Express.js · better-sqlite3
- **Auth:** JSON Web Tokens (JWT) · bcryptjs
- **AI:** OpenAI Whisper (transcription) · GPT-4o-mini (task extraction)
- **File uploads:** Multer
- **QR:** react-qr-code · html5-qrcode

---

## 🚀 Quick Start

### 1. Set up environment variables
```bash
cd server
copy .env.example .env
# Edit .env — set JWT_SECRET and OPENAI_API_KEY
```

### 2. Start the backend
```bash
cd server
npm install        # first time only
npm run dev        # nodemon dev server on :3001
```

### 3. Start the frontend
```bash
cd client
npm install        # first time only
npm run dev        # Vite dev server on :5173
```

Open http://localhost:5173 — register an account and start planning!

---

## 📁 Project Structure
```
cello-planner/
├── server/
│   ├── server.js          # Express API + SQLite init + all routes
│   ├── .env.example       # Copy to .env and fill in secrets
│   ├── uploads/           # Audio file storage (auto-created)
│   └── cello_planner.db   # SQLite database (auto-created)
└── client/
    └── src/
        ├── App.jsx              # Router + Sidebar shell
        ├── context/
        │   └── AuthContext.jsx  # JWT auth state
        ├── lib/
        │   └── api.js           # Axios instance w/ interceptors
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── EventsPage.jsx   # Events list + detail (tasks + attendees)
            ├── TasksPage.jsx    # Kanban board across all events
            ├── AttendeesPage.jsx
            ├── TranscribePage.jsx  # Whisper + GPT task extraction
            ├── GateScannerPage.jsx # QR generator + live scanner
            └── SettingsPage.jsx
```

## 🔑 API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login, returns JWT |
| GET | /api/auth/me | ✅ | Get current user |
| PUT | /api/auth/profile | ✅ | Update name/email |
| PUT | /api/auth/password | ✅ | Change password |
| GET | /api/events | ✅ | List user's events |
| POST | /api/events | ✅ | Create event |
| GET | /api/events/:id | ✅ | Event detail + tasks + attendees |
| PUT | /api/events/:id | ✅ | Update event |
| DELETE | /api/events/:id | ✅ | Delete event (cascades) |
| GET | /api/events/:id/tasks | ✅ | List tasks |
| POST | /api/events/:id/tasks | ✅ | Create task |
| PUT | /api/tasks/:id | ✅ | Update task status/title |
| DELETE | /api/tasks/:id | ✅ | Delete task |
| GET | /api/events/:id/attendees | ✅ | List attendees |
| POST | /api/events/:id/attendees | ✅ | Add attendee |
| PATCH | /api/attendees/:id/check-in | ✅ | Mark as attended (QR scan) |
| DELETE | /api/attendees/:id | ✅ | Remove attendee |
| POST | /api/events/:id/transcribe | ✅ | Upload audio → Whisper → GPT tasks |
| GET | /api/health | — | Health check |

## 🎨 Design System
Colors: **Sage Green** · **Gold** · **Cream**  
Style: Glassmorphism cards · Soft shadows · `rounded-2xl` · Smooth transitions
