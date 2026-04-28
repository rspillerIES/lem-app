import { query } from '../config/database';
import { generateToken, comparePassword, hashPassword } from '../middleware/auth';
import { User, LoginRequest, AuthPayload, Role } from '../types';
import { AppError } from '../middleware/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * Authentication Service
 * Handles user login, password validation, token generation
 */

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error fetching user:', err);
    throw new AppError('Failed to fetch user', 500);
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await query<User>(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error fetching user:', err);
    throw new AppError('Failed to fetch user', 500);
  }
}

/**
 * Get user's assigned divisions
 */
export async function getUserDivisions(userId: string): Promise<string[]> {
  try {
    const result = await query<{ division_id: string }>(
      `SELECT division_id FROM user_divisions WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((row) => row.division_id);
  } catch (err) {
    console.error('Error fetching user divisions:', err);
    throw new AppError('Failed to fetch user divisions', 500);
  }
}

/**
 * Get user's roles (hardcoded for MVP, can be extended to database)
 * TODO: Store roles in database table in Phase 2
 */
function getUserRoles(email: string): Role[] {
  // Mock roles based on email for MVP
  // In production, store in database
  if (email.includes('admin')) return ['PM', 'PA', 'Admin'] as Role[];
if (email.includes('pm')) return ['PM', 'PC'] as Role[];
if (email.includes('foreman')) return ['Foreman'] as Role[];
return ['Foreman'] as Role[];
}

/**
 * Validate login credentials and return auth payload
 */
export async function validateLogin(loginRequest: LoginRequest) {
  const { email, password } = loginRequest;

  // Validate inputs
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // Find user by email
  const user = await getUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password (for MVP, compare plain text - replace with bcrypt hash in production)
  if (!user.password_hash || user.password_hash !== password) {
    throw new AppError('Invalid email or password', 401);
  }

  // Get user's divisions
  const divisions = await getUserDivisions(user.user_id);

  // Get user's roles
  const roles = getUserRoles(user.email);

  // Build auth payload
  const payload: AuthPayload = {
    user_id: user.user_id,
    company_id: user.company_id,
    email: user.email,
    full_name: user.full_name,
    assigned_divisions: divisions,
    roles: roles,
  };

  // Generate token
  const token = generateToken(payload);

  return {
    token,
    user: payload,
  };
}

/**
 * Create a new user (for admin setup only)
 */
export async function createUser(data: {
  company_id: string;
  email: string;
  full_name: string;
  password: string;
}): Promise<User> {
  const { company_id, email, full_name, password } = data;

  // Validate inputs
  if (!email || !full_name || !password) {
    throw new AppError('Email, full name, and password are required', 400);
  }

  // Check if user already exists
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new AppError('User with this email already exists', 409, 'email');
  }

  // Hash password (for MVP, just store plain - upgrade to bcrypt in production)
  // const passwordHash = await hashPassword(password);
  const passwordHash = password; // MVP: plain text (NOT SECURE - UPGRADE LATER)

  try {
    const userId = uuidv4();
    const result = await query<User>(
      `INSERT INTO users (user_id, company_id, email, full_name, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, company_id, email, full_name, passwordHash]
    );

    return result.rows[0];
  } catch (err) {
    console.error('Error creating user:', err);
    throw new AppError('Failed to create user', 500);
  }
}

/**
 * Assign user to division
 */
export async function assignUserToDivision(
  userId: string,
  divisionId: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO user_divisions (user_id, division_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [userId, divisionId]
    );
  } catch (err) {
    console.error('Error assigning user to division:', err);
    throw new AppError('Failed to assign user to division', 500);
  }
}

/**
 * Update user details
 */
export async function updateUser(
  userId: string,
  data: { email?: string; full_name?: string; password?: string }
): Promise<User> {
  const { email, full_name, password } = data;

  try {
    let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [];
    let paramIndex = 1;

    if (email) {
      updateQuery += `, email = $${paramIndex}`;
      params.push(email);
      paramIndex++;
    }

    if (full_name) {
      updateQuery += `, full_name = $${paramIndex}`;
      params.push(full_name);
      paramIndex++;
    }

    if (password) {
      // In production, hash the password
      updateQuery += `, password_hash = $${paramIndex}`;
      params.push(password);
      paramIndex++;
    }

    updateQuery += ` WHERE user_id = $${paramIndex} RETURNING *`;
    params.push(userId);

    const result = await query<User>(updateQuery, params);

    if (result.rowCount === 0) {
      throw new AppError('User not found', 404);
    }

    return result.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error updating user:', err);
    throw new AppError('Failed to update user', 500);
  }
}

/**
 * Verify token is still valid and get user (called by frontend to check session)
 */
export async function verifySession(userId: string): Promise<AuthPayload> {
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const divisions = await getUserDivisions(userId);
  const roles = getUserRoles(user.email);

  return {
    user_id: user.user_id,
    company_id: user.company_id,
    email: user.email,
    full_name: user.full_name,
    assigned_divisions: divisions,
    roles: roles,
  };
}

export default {
  getUserByEmail,
  getUserById,
  getUserDivisions,
  validateLogin,
  createUser,
  assignUserToDivision,
  updateUser,
  verifySession,
};
