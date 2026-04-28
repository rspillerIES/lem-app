const express = require('express');
const authRoutes = require('./routes/auth');
const app = express();
const PORT = 8080;

console.log('Starting server...');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Projects endpoint
app.get('/api/projects', (req, res) => {
  const projects = [
    {
      project_id: 'proj-001',
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
      project_id: 'proj-002',
      project_name: 'Industrial Plant Upgrade',
      project_number: 'IPU-2024-002',
      po_number: 'PO-12346',
      po_value: '250000.00',
      budget_type: 'LS',
      start_date: '2024-02-01',
      end_date: '2024-08-15',
      pm_name: 'Jane Doe',
    },
  ];
  
  return res.json({
    status: 200,
    data: projects,
    count: projects.length,
  });
});

console.log('About to listen on port ' + PORT);

app.listen(PORT, () => {
  console.log('✅ Server listening on ' + PORT);
});

setInterval(() => {}, 30000);
