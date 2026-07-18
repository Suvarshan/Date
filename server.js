const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createLoginController } = require('./controllers/authController');

const app = express();
const port = process.env.PORT || 3000;
const dbFile = path.join(__dirname, 'responses.db');
const db = new Database(dbFile);
console.log(`Connected to SQLite database at: ${dbFile}`);
const jwtSecret = process.env.JWT_SECRET || 'super-secret-key';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Password123!';

// Create tables if they do not exist
const createResponses = `
  CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    birthday TEXT NOT NULL,
    colour TEXT NOT NULL,
    place TEXT NOT NULL,
    food TEXT NOT NULL,
    date TEXT,
    accepted INTEGER NOT NULL,
    createdAt TEXT NOT NULL
  )
`;
const createUsers = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`;

db.prepare(createResponses).run();
db.prepare(createUsers).run();

const createSpecialDates = `
  CREATE TABLE IF NOT EXISTS special_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dob TEXT NOT NULL UNIQUE,
    label TEXT,
    createdAt TEXT NOT NULL
  )
`;
const createSpecialDateImages = `
  CREATE TABLE IF NOT EXISTS special_date_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dateId INTEGER NOT NULL,
    filename TEXT NOT NULL,
    originalName TEXT NOT NULL,
    dataUrl TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (dateId) REFERENCES special_dates(id) ON DELETE CASCADE
  )
`;

db.prepare(createSpecialDates).run();
db.prepare(createSpecialDateImages).run();

const adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!adminUser) {
  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO users (name, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)')
    .run('Admin', adminEmail, passwordHash, new Date().toISOString());
  console.log(`Created default admin user: ${adminEmail}`);
  console.log('Change the default password by setting ADMIN_PASSWORD in the environment.');
}

function validateToken(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (error) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const payload = validateToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = payload;
  next();
}

app.use(express.json({ limit: '25mb' }));

const corsOrigins = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAll = corsOrigins.includes('*');
  const isAllowedOrigin = requestOrigin && corsOrigins.includes(requestOrigin);

  if (allowAll) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const staticOptions = {
  etag: false,
  lastModified: false,
  cacheControl: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
};

app.use('/admin', express.static(path.join(__dirname, 'public', 'admin'), staticOptions));
app.use('/shared', express.static(path.join(__dirname, 'public', 'shared'), staticOptions));
app.use('/', express.static(path.join(__dirname, 'public', 'app'), staticOptions));

const loginController = createLoginController({ db, bcrypt, jwt, jwtSecret });
app.post('/admin/login', loginController);
app.post('/api/admin/login', loginController);

app.get('/admin/responses', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM responses ORDER BY id DESC').all();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load responses' });
  }
});

app.get('/admin/special-dates', authMiddleware, (req, res) => {
  try {
    const dates = db.prepare('SELECT * FROM special_dates ORDER BY id DESC').all();
    const imagesByDate = db.prepare(
      'SELECT id, dateId, filename, originalName, dataUrl, createdAt FROM special_date_images WHERE dateId = ? ORDER BY id DESC'
    );

    const rows = dates.map(date => ({
      ...date,
      images: imagesByDate.all(date.id).map(image => ({
        id: image.id,
        filename: image.filename,
        originalName: image.originalName,
        src: image.dataUrl,
        createdAt: image.createdAt,
      }))
    }));

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load special dates' });
  }
});

app.post('/admin/special-dates', authMiddleware, (req, res) => {
  const { dob, label } = req.body;
  if (!dob) {
    return res.status(400).json({ error: 'Date of birth is required' });
  }

  try {
    const existing = db.prepare('SELECT * FROM special_dates WHERE dob = ?').get(dob);
    if (existing) {
      return res.status(409).json({ error: 'This date of birth already exists' });
    }

    const info = db.prepare(
      'INSERT INTO special_dates (dob, label, createdAt) VALUES (?, ?, ?)'
    ).run(dob, label || '', new Date().toISOString());

    res.status(201).json({
      id: info.lastInsertRowid,
      dob,
      label: label || '',
      images: [],
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not save special date' });
  }
});

app.delete('/admin/special-dates/:id', authMiddleware, (req, res) => {
  try {
    const dateId = Number(req.params.id);
    db.prepare('DELETE FROM special_date_images WHERE dateId = ?').run(dateId);
    const info = db.prepare('DELETE FROM special_dates WHERE id = ?').run(dateId);
    if (!info.changes) {
      return res.status(404).json({ error: 'Special date not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete special date' });
  }
});

app.post('/admin/special-dates/:dateId/images', authMiddleware, (req, res) => {
  const dateId = Number(req.params.dateId);
  const { imageData, originalName } = req.body;

  if (!imageData || !originalName) {
    return res.status(400).json({ error: 'Image data and original name are required' });
  }

  try {
    const date = db.prepare('SELECT id FROM special_dates WHERE id = ?').get(dateId);
    if (!date) {
      return res.status(404).json({ error: 'Special date not found' });
    }

    const info = db.prepare(
      'INSERT INTO special_date_images (dateId, filename, originalName, dataUrl, createdAt) VALUES (?, ?, ?, ?, ?)'
    ).run(
      dateId,
      `${dateId}-${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      originalName,
      imageData,
      new Date().toISOString()
    );

    res.status(201).json({
      id: info.lastInsertRowid,
      dateId,
      originalName,
      src: imageData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not upload image' });
  }
});

app.delete('/admin/special-dates/:dateId/images/:imageId', authMiddleware, (req, res) => {
  try {
    const dateId = Number(req.params.dateId);
    const imageId = Number(req.params.imageId);
    const info = db.prepare('DELETE FROM special_date_images WHERE id = ? AND dateId = ?').run(imageId, dateId);
    if (!info.changes) {
      return res.status(404).json({ error: 'Image not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not delete image' });
  }
});

app.post('/api/check-dob', (req, res) => {
  const { dob } = req.body;
  if (!dob) {
    return res.status(400).json({ error: 'DOB is required' });
  }

  try {
    const specialDate = db.prepare('SELECT * FROM special_dates WHERE dob = ?').get(dob);
    if (!specialDate) {
      return res.json({ matched: false, images: [] });
    }

    const images = db.prepare(
      'SELECT dataUrl FROM special_date_images WHERE dateId = ? ORDER BY id DESC'
    ).all(specialDate.id).map(image => image.dataUrl);

    return res.json({
      matched: images.length > 0,
      label: specialDate.label || '',
      images
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not check DOB' });
  }
});

app.get('/admin', (req, res) => {
  res.redirect('/admin/login.html');
});

app.get('/admin/', (req, res) => {
  res.redirect('/admin/login.html');
});

app.get('/api/responses', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM responses ORDER BY id DESC').all();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load responses' });
  }
});

app.post('/api/responses', (req, res) => {
  const { name, birthday, colour, place, food, date, accepted, createdAt } = req.body;
  if (!name || !birthday || !colour || !place || !food || typeof accepted !== 'boolean') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const stmt = db.prepare(
      `INSERT INTO responses (name, birthday, colour, place, food, date, accepted, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const info = stmt.run(name, birthday, colour, place, food, date || null, accepted ? 1 : 0, createdAt || new Date().toISOString());
    return res.status(201).json({ id: info.lastInsertRowid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not save response' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
