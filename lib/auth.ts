import bcrypt from 'bcryptjs';
import { query, executeTransaction } from './db';
import crypto from 'crypto';

const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface User {
  id: number;
  email: string;
  fullName: string | null;
  createdAt: string;
}

export interface Session {
  userId: number;
  user: User;
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create user
export async function createUser(
  email: string,
  password: string,
  fullName?: string
): Promise<User> {
  const passwordHash = await hashPassword(password);

  const result = await query(
    `INSERT INTO users (email, password_hash, full_name) 
     VALUES ($1, $2, $3) 
     RETURNING id, email, full_name, created_at`,
    [email, passwordHash, fullName || null]
  );

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    createdAt: user.created_at,
  };
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query(
    'SELECT id, email, full_name, created_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) return null;

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    createdAt: user.created_at,
  };
}

// Get user by ID
export async function getUserById(userId: number): Promise<User | null> {
  const result = await query(
    'SELECT id, email, full_name, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) return null;

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    createdAt: user.created_at,
  };
}

// Get user with password hash for login
export async function getUserWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
  const result = await query(
    'SELECT id, email, password_hash, full_name, created_at FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) return null;

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    createdAt: user.created_at,
    passwordHash: user.password_hash,
  };
}

// Create session token
export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  return token;
}

// Get session
export async function getSession(token: string): Promise<Session | null> {
  const result = await query(
    `SELECT s.user_id, u.id, u.email, u.full_name, u.created_at 
     FROM sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    userId: row.user_id,
    user: {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      createdAt: row.created_at,
    },
  };
}

// Delete session
export async function deleteSession(token: string): Promise<void> {
  await query('DELETE FROM sessions WHERE token = $1', [token]);
}

// Log activity
export async function logActivity(
  userId: number,
  action: string,
  details?: Record<string, any>,
  intentExecutionId?: number
): Promise<void> {
  await query(
    `INSERT INTO activity_log (user_id, action, intent_execution_id, details) 
     VALUES ($1, $2, $3, $4)`,
    [userId, action, intentExecutionId || null, JSON.stringify(details || {})]
  );
}
