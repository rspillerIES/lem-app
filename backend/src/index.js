const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const server = app.listen(PORT, () => {
  console.log('✅ Server running on port ' + PORT);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
