// ============================================================
//  WeatherApp Backend — server.js
//  Stack: Node.js + Express + SQLite + Twilio
//  Run:   node server.js
// ============================================================

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const Database   = require('better-sqlite3');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const path       = require('path');
const fs         = require('fs');
const dotenv     = require('dotenv');

dotenv.config();

// ── Config ──────────────────────────────────────────────────
const PORT       = process.env.PORT || 3001;
const JWT_SECRET = 'weatherapp_secret_change_in_production';
const DATA_DIR   = path.join(__dirname, '../data');
const DB_PATH    = path.join(DATA_DIR, 'weather.db');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ── Twilio (fill in your credentials in .env or here) ───────
const TWILIO_SID   = process.env.TWILIO_SID   || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || 'your_auth_token';
const TWILIO_FROM  = process.env.TWILIO_FROM  || '+1234567890';

let twilioClient = null;
try {
  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
  console.log('✅ Twilio client ready');
} catch(e) {
  console.log('⚠️  Twilio not installed – SMS disabled. Run: npm install twilio');
}

// ── Database setup ───────────────────────────────────────────
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    email     TEXT UNIQUE NOT NULL,
    password  TEXT NOT NULL,
    phone     TEXT,
    created   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS consumers (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    phone     TEXT UNIQUE NOT NULL,
    email     TEXT,
    location  TEXT DEFAULT 'General',
    active    INTEGER DEFAULT 1,
    created   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS broadcasts (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    message   TEXT NOT NULL,
    sent_by   TEXT NOT NULL,
    sent_to   INTEGER DEFAULT 0,
    status    TEXT DEFAULT 'sent',
    created   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed a default admin if none exist
const adminCount = db.prepare('SELECT COUNT(*) as c FROM admins').get();
if (adminCount.c === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (name, email, password, phone) VALUES (?, ?, ?, ?)').run('Admin', 'admin@weather.app', hash, '');
  console.log('🌱 Default admin created: admin@weather.app / admin123');
}

// ── Helpers ──────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function sendSMS(to, body) {
  if (!twilioClient) return { success: false, reason: 'Twilio not configured' };
  try {
    const msg = await twilioClient.messages.create({ from: TWILIO_FROM, to, body });
    return { success: true, sid: msg.sid };
  } catch(e) {
    return { success: false, reason: e.message };
  }
}

// ── App ──────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));
app.use('/user',  express.static(path.join(__dirname, '../frontend/user')));

// Serve index.html for /admin and /user routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});
app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/user/index.html'));
});
app.get('/', (req, res) => res.redirect('/admin'));

// ── AUTH ─────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password))
    return res.status(401).json({ error: 'Invalid email or password' });
  const token = jwt.sign({ id: admin.id, name: admin.name, email: admin.email }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, phone: admin.phone } });
});

// ── ADMIN: Profile ────────────────────────────────────────────
app.get('/api/admin/profile', authMiddleware, (req, res) => {
  const admin = db.prepare('SELECT id, name, email, phone, created FROM admins WHERE id = ?').get(req.admin.id);
  res.json(admin);
});

app.put('/api/admin/profile', authMiddleware, (req, res) => {
  const { name, phone } = req.body;
  db.prepare('UPDATE admins SET name = ?, phone = ? WHERE id = ?').run(name, phone, req.admin.id);
  res.json({ success: true });
});

app.put('/api/admin/password', authMiddleware, (req, res) => {
  const { current, newPassword } = req.body;
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.admin.id);
  if (!bcrypt.compareSync(current, admin.password))
    return res.status(400).json({ error: 'Current password is incorrect' });
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hash, req.admin.id);
  res.json({ success: true });
});

// ── CONSUMERS ────────────────────────────────────────────────
app.get('/api/consumers', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM consumers ORDER BY created DESC').all();
  res.json(rows);
});

app.post('/api/consumers', authMiddleware, (req, res) => {
  const { name, phone, email, location } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  try {
    const info = db.prepare('INSERT INTO consumers (name, phone, email, location) VALUES (?, ?, ?, ?)').run(name, phone, email || '', location || 'General');
    res.json({ success: true, id: info.lastInsertRowid });
  } catch(e) {
    res.status(400).json({ error: 'Phone number already exists' });
  }
});

app.put('/api/consumers/:id', authMiddleware, (req, res) => {
  const { name, phone, email, location, active } = req.body;
  db.prepare('UPDATE consumers SET name=?, phone=?, email=?, location=?, active=? WHERE id=?').run(name, phone, email, location, active, req.params.id);
  res.json({ success: true });
});

app.delete('/api/consumers/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM consumers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/consumers/export', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM consumers ORDER BY created DESC').all();
  const escapeCSV = (str) => {
    if (!str) return '';
    return '"' + String(str).replace(/"/g, '""') + '"';
  };
  const csv = ['ID,Name,Phone,Email,Location,Active,Joined',
    ...rows.map(r => `${r.id},${escapeCSV(r.name)},${escapeCSV(r.phone)},${escapeCSV(r.email)},${escapeCSV(r.location)},${r.active ? 'Yes':'No'},${escapeCSV(r.created)}`)
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="consumers.csv"');
  res.send(csv);
});

// ── BROADCASTS ───────────────────────────────────────────────
app.post('/api/broadcast', authMiddleware, async (req, res) => {
  const { message, targetAll } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const consumers = db.prepare('SELECT * FROM consumers WHERE active = 1').all();
  let sentCount = 0;
  const results = [];

  for (const c of consumers) {
    const result = await sendSMS(c.phone, `🌤 WeatherApp: ${message}`);
    if (result.success) sentCount++;
    results.push({ phone: c.phone, name: c.name, ...result });
  }

  db.prepare('INSERT INTO broadcasts (message, sent_by, sent_to, status) VALUES (?, ?, ?, ?)')
    .run(escapeHtml(message), req.admin.name, sentCount, 'sent');

  res.json({ success: true, sentCount, total: consumers.length, results });
});

app.get('/api/broadcasts', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM broadcasts ORDER BY created DESC LIMIT 50').all();
  res.json(rows);
});

// ── SETTINGS ─────────────────────────────────────────────────
app.get('/api/settings', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const obj = {};
  rows.forEach(r => obj[r.key] = r.value);
  res.json(obj);
});

app.put('/api/settings', authMiddleware, (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const updateMany = db.transaction((data) => {
    for (const [k, v] of Object.entries(data)) upsert.run(k, String(v));
  });
  updateMany(req.body);
  res.json({ success: true });
});

// ── STATS ─────────────────────────────────────────────────────
app.get('/api/stats', authMiddleware, (req, res) => {
  const totalConsumers = db.prepare('SELECT COUNT(*) as c FROM consumers').get().c;
  const activeConsumers = db.prepare('SELECT COUNT(*) as c FROM consumers WHERE active=1').get().c;
  const totalBroadcasts = db.prepare('SELECT COUNT(*) as c FROM broadcasts').get().c;
  const lastBroadcast = db.prepare('SELECT created FROM broadcasts ORDER BY created DESC LIMIT 1').get();
  res.json({ totalConsumers, activeConsumers, totalBroadcasts, lastBroadcast: lastBroadcast?.created || 'Never' });
});

// ── PUBLIC: Consumer Registration ────────────────────────────
app.post('/api/register', (req, res) => {
  const { name, phone, email, location } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  try {
    const info = db.prepare('INSERT INTO consumers (name, phone, email, location) VALUES (?, ?, ?, ?)').run(name, phone, email || '', location || 'General');
    res.json({ success: true, message: 'Registered successfully! You will receive weather SMS updates.' });
  } catch(e) {
    res.status(400).json({ error: 'This phone number is already registered.' });
  }
});

// ── START ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌤  WeatherApp Server running at http://localhost:${PORT}`);
  console.log(`   Admin panel : http://localhost:${PORT}/admin`);
  console.log(`   User portal : http://localhost:${PORT}/user`);
  console.log(`   API base    : http://localhost:${PORT}/api\n`);
});
