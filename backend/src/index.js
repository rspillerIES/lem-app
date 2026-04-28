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

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects LIMIT 50');
    res.json(result.rows);
  } catch (err) {
    console.error('Projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project by ID
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project: result.rows[0] });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get entries for a project
app.get('/api/projects/:projectId/daily-entries', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      'SELECT * FROM daily_time_entries WHERE project_id = $1 ORDER BY date_of_work DESC LIMIT 100',
      [projectId]
    );
    res.json({ entries: result.rows });
  } catch (err) {
    console.error('Get entries error:', err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Create entry for a project
app.post('/api/projects/:projectId/daily-entries/time', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { employee_id, date_of_work, regular_hours, cost_code_id, position_name } = req.body;

    if (!date_of_work || !cost_code_id || !position_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO daily_time_entries (project_id, employee_id, date_of_work, regular_hours, cost_code_id, position_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [projectId, employee_id, date_of_work, regular_hours || 0, cost_code_id, position_name]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create entry error:', err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// Get entries (legacy route)
app.get('/api/entries', async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM daily_time_entries WHERE 1=1';
    const params = [];
    if (projectId) { sql += ' AND project_id = $' + (params.length + 1); params.push(projectId); }
    if (startDate) { sql += ' AND date_of_work >= $' + (params.length + 1); params.push(startDate); }
    if (endDate) { sql += ' AND date_of_work <= $' + (params.length + 1); params.push(endDate); }
    sql += ' ORDER BY date_of_work DESC LIMIT 100';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get entries error:', err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Create entry (legacy route)
app.post('/api/entries', async (req, res) => {
  try {
    const { project_id, employee_id, date_of_work, regular_hours, cost_code_id, position_name } = req.body;
    if (!project_id || !date_of_work || !cost_code_id || !position_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const result = await pool.query(
      `INSERT INTO daily_time_entries (project_id, employee_id, date_of_work, regular_hours, cost_code_id, position_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [project_id, employee_id, date_of_work, regular_hours || 0, cost_code_id, position_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create entry error:', err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

console.log('Listening on ' + PORT);
app.listen(PORT, () => console.log('✅ Server running'));
setInterval(() => {}, 30000);
