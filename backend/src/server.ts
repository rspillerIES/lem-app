import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware, requireRole } from './middleware/auth';
import { errorHandler } from './middleware/errors';

// Import routes (we'll create these next)
// import authRoutes from './routes/auth';
// import projectRoutes from './routes/projects';
// import entryRoutes from './routes/entries';
// import dashboardRoutes from './routes/dashboards';
// import employeeRoutes from './routes/employees';
// import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Middleware
 */

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

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * Routes (will be implemented next)
 */

// Public routes (no auth required)
// app.use('/api/auth', authRoutes);

// Protected routes (auth required)
// app.use('/api/projects', authMiddleware, projectRoutes);
// app.use('/api/entries', authMiddleware, entryRoutes);
// app.use('/api/dashboards', authMiddleware, dashboardRoutes);
// app.use('/api/employees', authMiddleware, employeeRoutes);
// app.use('/api/admin', authMiddleware, requireRole('Admin'), adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    status: 404,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Error handler (must be last)
app.use(errorHandler);

/**
 * Start server
 */
export async function startServer() {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   LEM App Backend - Server Running     ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                ║
║   CORS Origin: ${FRONTEND_URL}          ║
╚════════════════════════════════════════╝
    `);
  });
}

export default app;
