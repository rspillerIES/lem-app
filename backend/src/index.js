const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

console.log('Starting server...');

app.get('/health', (req, res) => {
  res.send('OK');
});

console.log('About to listen on port ' + PORT);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Server listening on ' + PORT);
});

// Keep process alive
setInterval(() => {
  console.log('Process alive');
}, 30000);
