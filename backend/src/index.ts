import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log('Starting server initialization...');

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    status: 404,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Start server
try {
  const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   LEM App Backend - Server Running     ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                ║
║   CORS Origin: ${FRONTEND_URL}          ║
╚════════════════════════════════════════╝
    `);
  });

  server.on('error', (err: any) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
} catch (err) {
  console.error('Fatal error starting server:', err);
  process.exit(1);
}
