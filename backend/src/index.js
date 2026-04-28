const express = require('express');
const app = express();
const PORT = 8080;

console.log('Starting server...');

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

// Projects
app.get('/api/projects', (req, res) => {
  res.json([
    {
      project_id: '1',
      project_name: 'Downtown Office Retrofit',
      project_number: 'DOR-2024-001',
      po_number: 'PO-12345',
      po_value: '125000.00',
      budget_type: 'T&M',
      start_date: '2024-01-15',
      end_date: '2024-06-30',
      pm_name: 'John Smith',
    },
    {
      project_id: '2',
      project_name: 'Industrial Plant Upgrade',
      project_number: 'IPU-2024-002',
      po_number: 'PO-12346',
      po_value: '250000.00',
      budget_type: 'LS',
      start_date: '2024-02-01',
      end_date: '2024-08-15',
      pm_name: 'Jane Doe',
    },
  ]);
});

console.log('Listening on ' + PORT);
app.listen(PORT, () => console.log('✅ Server running'));
setInterval(() => {}, 30000);
