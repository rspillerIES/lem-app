const express = require('express');
const app = express();
const PORT = 8080;

console.log('Starting server...');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === 'pm@impact.com' && password === 'demo123') {
      return res.json({
        status: 200,
        message: 'Login successful',
        token: 'demo-token-' + Date.now(),
        user: {
          user_id: 'user-demo-001',
          email: 'pm@impact.com',
          full_name: 'Project Manager',
        },
      });
    }
    
    return res.status(401).json({
      error: 'Invalid credentials',
      status: 401,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error', status: 500 });
  }
});

console.log('About to listen on port ' + PORT);

app.listen(PORT, () => {
  console.log('✅ Server listening on ' + PORT);
});

setInterval(() => {}, 30000);
