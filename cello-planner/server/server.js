require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Database = require('better-sqlite3');

// ─────────────────────────────────────────────
//  App & Config
// ─────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'cello_planner_dev_secret_change_me';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─────────────────────────────────────────────
//  Database Initialization
// ─────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'cello_planner.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    title      TEXT    NOT NULL,
    date       TEXT    NOT NULL,
    description TEXT   DEFAULT '',
    location   TEXT    DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id   INTEGER NOT NULL,
    title      TEXT    NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'To-Do',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendees (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id     INTEGER NOT NULL,
    name         TEXT    NOT NULL,
    email        TEXT    DEFAULT '',
    has_attended INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS audio_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id        INTEGER NOT NULL,
    file_path       TEXT    NOT NULL,
    transcription   TEXT    DEFAULT '',
    extracted_tasks TEXT    DEFAULT '[]',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );
`);

console.log('✅  SQLite database initialized at', DB_PATH);

// ─────────────────────────────────────────────
//  Auth Middleware
// ─────────────────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ─────────────────────────────────────────────
//  Auth Routes
// ─────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check if email already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const password_hash = bcrypt.hashSync(password, 12);
  const userRole = role === 'admin' ? 'admin' : 'user';

  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, password_hash, userRole);

  const token = jwt.sign(
    { id: result.lastInsertRowid, email, name, role: userRole },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: { id: result.lastInsertRowid, name, email, role: userRole },
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me  – validate token & get current user
app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// PUT /api/auth/profile – update name/email
app.put('/api/auth/profile', authenticate, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

  const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
  if (conflict) return res.status(409).json({ error: 'Email already in use' });

  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, req.user.id);
  res.json({ message: 'Profile updated' });
});

// PUT /api/auth/password – change password
app.put('/api/auth/password', authenticate, (req, res) => {
  const { current, next: nextPass } = req.body;
  if (!current || !nextPass) return res.status(400).json({ error: 'Both current and new password required' });
  if (nextPass.length < 6) return res.status(400).json({ error: 'New password too short (min 6)' });

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current, user.password_hash))
    return res.status(401).json({ error: 'Current password is incorrect' });

  const newHash = bcrypt.hashSync(nextPass, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);
  res.json({ message: 'Password updated' });
});

// ─────────────────────────────────────────────
//  Events Routes
// ─────────────────────────────────────────────

// GET /api/events
app.get('/api/events', authenticate, (req, res) => {
  const events = db
    .prepare(`
      SELECT e.*,
             COUNT(DISTINCT t.id) AS task_count,
             COUNT(DISTINCT a.id) AS attendee_count
      FROM events e
      LEFT JOIN tasks t ON t.event_id = e.id
      LEFT JOIN attendees a ON a.event_id = e.id
      WHERE e.user_id = ?
      GROUP BY e.id
      ORDER BY e.date ASC
    `)
    .all(req.user.id);

  res.json({ events });
});

// GET /api/events/:id
app.get('/api/events/:id', authenticate, (req, res) => {
  const event = db
    .prepare('SELECT * FROM events WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!event) return res.status(404).json({ error: 'Event not found' });

  const tasks = db
    .prepare('SELECT * FROM tasks WHERE event_id = ? ORDER BY created_at ASC')
    .all(event.id);

  const attendees = db
    .prepare('SELECT * FROM attendees WHERE event_id = ? ORDER BY name ASC')
    .all(event.id);

  res.json({ event, tasks, attendees });
});

// POST /api/events
app.post('/api/events', authenticate, (req, res) => {
  const { title, date, description, location } = req.body;

  if (!title || !date) {
    return res.status(400).json({ error: 'Title and date are required' });
  }

  const result = db
    .prepare('INSERT INTO events (user_id, title, date, description, location) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, title, date, description || '', location || '');

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Event created', event });
});

// PUT /api/events/:id
app.put('/api/events/:id', authenticate, (req, res) => {
  const { title, date, description, location } = req.body;
  const event = db
    .prepare('SELECT id FROM events WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!event) return res.status(404).json({ error: 'Event not found' });

  db.prepare(
    'UPDATE events SET title = ?, date = ?, description = ?, location = ? WHERE id = ?'
  ).run(title, date, description || '', location || '', req.params.id);

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  res.json({ message: 'Event updated', event: updated });
});

// DELETE /api/events/:id
app.delete('/api/events/:id', authenticate, (req, res) => {
  const event = db
    .prepare('SELECT id FROM events WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);

  if (!event) return res.status(404).json({ error: 'Event not found' });

  db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  res.json({ message: 'Event deleted' });
});

// ─────────────────────────────────────────────
//  Tasks Routes
// ─────────────────────────────────────────────

// GET /api/events/:eventId/tasks
app.get('/api/events/:eventId/tasks', authenticate, (req, res) => {
  // Verify ownership
  const event = db
    .prepare('SELECT id FROM events WHERE id = ? AND user_id = ?')
    .get(req.params.eventId, req.user.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const tasks = db
    .prepare('SELECT * FROM tasks WHERE event_id = ? ORDER BY created_at ASC')
    .all(req.params.eventId);

  res.json({ tasks });
});

// POST /api/events/:eventId/tasks
app.post('/api/events/:eventId/tasks', authenticate, (req, res) => {
  const event = db
    .prepare('SELECT id FROM events WHERE id = ? AND user_id = ?')
    .get(req.params.eventId, req.user.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { title, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const validStatuses = ['To-Do', 'In-Progress', 'Done'];
  const taskStatus = validStatuses.includes(status) ? status : 'To-Do';

  const result = db
    .prepare('INSERT INTO tasks (event_id, title, status) VALUES (?, ?, ?)')
    .run(req.params.eventId, title, taskStatus);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Task created', task });
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', authenticate, (req, res) => {
  const task = db
    .prepare(`
      SELECT t.* FROM tasks t
      JOIN events e ON e.id = t.event_id
      WHERE t.id = ? AND e.user_id = ?
    `)
    .get(req.params.id, req.user.id);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, status } = req.body;
  const validStatuses = ['To-Do', 'In-Progress', 'Done'];
  const taskStatus = validStatuses.includes(status) ? status : task.status;

  db.prepare('UPDATE tasks SET title = ?, status = ? WHERE id = ?').run(
    title || task.title,
    taskStatus,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ message: 'Task updated', task: updated });
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', authenticate, (req, res) => {
  const task = db
    .prepare(`
      SELECT t.id FROM tasks t
      JOIN events e ON e.id = t.event_id
      WHERE t.id = ? AND e.user_id = ?
    `)
    .get(req.params.id, req.user.id);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

// ─────────────────────────────────────────────
//  Attendees Routes
// ─────────────────────────────────────────────

// GET /api/events/:eventId/attendees
app.get('/api/events/:eventId/attendees', authenticate, (req, res) => {
  const event = db
    .prepare('SELECT id FROM events WHERE id = ? AND user_id = ?')
    .get(req.params.eventId, req.user.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const attendees = db
    .prepare('SELECT * FROM attendees WHERE event_id = ? ORDER BY name ASC')
    .all(req.params.eventId);

  res.json({ attendees });
});

// POST /api/events/:eventId/attendees
app.post('/api/events/:eventId/attendees', authenticate, (req, res) => {
  const event = db
    .prepare('SELECT id FROM events WHERE id = ? AND user_id = ?')
    .get(req.params.eventId, req.user.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { name, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Attendee name is required' });

  const result = db
    .prepare('INSERT INTO attendees (event_id, name, email) VALUES (?, ?, ?)')
    .run(req.params.eventId, name, email || '');

  const attendee = db.prepare('SELECT * FROM attendees WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: 'Attendee added', attendee });
});

// PATCH /api/attendees/:id/check-in  – mark attendance via QR scan
app.patch('/api/attendees/:id/check-in', authenticate, (req, res) => {
  const attendee = db
    .prepare(`
      SELECT a.* FROM attendees a
      JOIN events e ON e.id = a.event_id
      WHERE a.id = ? AND e.user_id = ?
    `)
    .get(req.params.id, req.user.id);

  if (!attendee) return res.status(404).json({ error: 'Attendee not found' });

  db.prepare('UPDATE attendees SET has_attended = 1 WHERE id = ?').run(req.params.id);
  const updated = db.prepare('SELECT * FROM attendees WHERE id = ?').get(req.params.id);
  res.json({ message: 'Checked in successfully', attendee: updated });
});

// DELETE /api/attendees/:id
app.delete('/api/attendees/:id', authenticate, (req, res) => {
  const attendee = db
    .prepare(`
      SELECT a.id FROM attendees a
      JOIN events e ON e.id = a.event_id
      WHERE a.id = ? AND e.user_id = ?
    `)
    .get(req.params.id, req.user.id);

  if (!attendee) return res.status(404).json({ error: 'Attendee not found' });

  db.prepare('DELETE FROM attendees WHERE id = ?').run(req.params.id);
  res.json({ message: 'Attendee removed' });
});

// ─────────────────────────────────────────────
//  File Upload & AI Routes (stubs for Phase 3)
// ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm', 'audio/ogg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// POST /api/events/:eventId/transcribe  – Whisper + GPT-4o-mini
app.post('/api/events/:eventId/transcribe', authenticate, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

  const event = db
    .prepare('SELECT id FROM events WHERE id = ? AND user_id = ?')
    .get(req.params.eventId, req.user.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (!process.env.OPENAI_API_KEY) {
    // Graceful degradation when key not set
    const result = db
      .prepare('INSERT INTO audio_logs (event_id, file_path) VALUES (?, ?)')
      .run(req.params.eventId, req.file.path);
    return res.status(201).json({
      message: 'Audio uploaded. Add OPENAI_API_KEY to .env to enable transcription.',
      logId: result.lastInsertRowid,
      transcription: '',
      extractedTasks: [],
    });
  }

  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Whisper transcription
    const transcriptionResp = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      response_format: 'text',
    });
    const transcription = transcriptionResp;

    // 2. GPT-4o-mini task extraction
    const extractionResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an event planning assistant. Extract a JSON array of clear, actionable task strings from the meeting transcript. Return ONLY valid JSON — an array of strings, no markdown. Example: ["Book the venue by Friday","Send invites to all attendees"]',
        },
        { role: 'user', content: transcription },
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    let extractedTasks = [];
    try {
      const raw = extractionResp.choices[0].message.content.trim();
      extractedTasks = JSON.parse(raw);
      if (!Array.isArray(extractedTasks)) extractedTasks = [];
    } catch {
      extractedTasks = [];
    }

    // 3. Persist log
    const logResult = db
      .prepare('INSERT INTO audio_logs (event_id, file_path, transcription, extracted_tasks) VALUES (?, ?, ?, ?)')
      .run(req.params.eventId, req.file.path, transcription, JSON.stringify(extractedTasks));

    res.status(201).json({
      logId: logResult.lastInsertRowid,
      transcription,
      extractedTasks,
    });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({ error: 'AI transcription failed: ' + err.message });
  }
});

// ─────────────────────────────────────────────
//  Health Check
// ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────
//  Global Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─────────────────────────────────────────────
//  Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎻 Cello Planner API running on http://localhost:${PORT}`);
});
