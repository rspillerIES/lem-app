import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

/**
 * Generate JWT token
 */
export function generateToken(payload: AuthPayload): string {
return jwt.sign(payload as Record<string, any>, JWT_SECRET, {
expiresIn: JWT_EXPIRATION as string,
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware to verify JWT from Authorization header
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header',
        status: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        status: 401,
        timestamp: new Date().toISOString(),
      });
    }

    // Attach user to request
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Authentication error',
      status: 401,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Check if user has specific role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthPayload | undefined;

    if (!user) {
      return res.status(401).json({
        error: 'User not authenticated',
        status: 401,
        timestamp: new Date().toISOString(),
      });
    }

    const hasRole = user.roles.some((role) => roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: `Requires one of: ${roles.join(', ')}`,
        status: 403,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Check if user has access to division
 */
export function requireDivisionAccess(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthPayload | undefined;
  const divisionId = req.params.divisionId || req.body.division_id;

  if (!user) {
    return res.status(401).json({
      error: 'User not authenticated',
      status: 401,
      timestamp: new Date().toISOString(),
    });
  }

  if (!divisionId || !user.assigned_divisions.includes(divisionId)) {
    return res.status(403).json({
      error: 'No access to this division',
      status: 403,
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * Hash password (used in auth service, not in middleware)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
}
