const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 8080;

console.log('Starting server...');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'pm@impact.com' && password === 'demo123') {
    return res.json({
      status: 200,
      token: 'demo-' + Date.now(),
      user: { user_id: 'u1', email, full_name: 'PM' },
    });
  }
  res.status(401).json({ error: 'Invalid' });
});

// Projects from database
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    console.error('Projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

console.log('Listening on ' + PORT);
app.listen(PORT, () => console.log('✅ Server running'));
setInterval(() => {}, 30000);
