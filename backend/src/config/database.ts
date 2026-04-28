import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
// Railway injects DATABASE_URL, fall back to individual env vars for local dev
const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'lem_app',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };

const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute a single query
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const result = await pool.query(text, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount || 0,
    };
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

/**
 * Get a client for transaction
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Close all connections
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('✓ Database connection pool closed');
}

export default pool;
