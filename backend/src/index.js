const express = require('express');
const authRoutes = require('./routes/auth');
const app = express();
const PORT = 8080;

console.log('Starting server...');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

console.log('About to listen on port ' + PORT);

const server = app.listen(PORT, () => {
  console.log('✅ Server listening on ' + PORT);
});

// Keep process alive
setInterval(() => {
  // Silent interval to keep process from exiting
}, 30000);
