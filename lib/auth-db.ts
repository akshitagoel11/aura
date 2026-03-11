import { promises as fs } from 'fs';
import { join } from 'path';
import { hashPassword, verifyPassword } from './auth-simple';

// File-based storage
const DB_FILE = join(process.cwd(), 'auth-data.json');

interface Database {
  users: any[];
  sessions: any[];
  nextUserId: number;
  nextSessionId: number;
}

// Initialize database file
async function initDb(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist, create initial structure
    const db: Database = {
      users: [],
      sessions: [],
      nextUserId: 1,
      nextSessionId: 1,
    };
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }
}

// Save database to file
async function saveDb(db: Database): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

export interface User {
  id: number;
  email: string;
  fullName: string | null;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: number;
  user: User;
  createdAt: string;
}

// Create user
export async function createUser(
  email: string,
  password: string,
  fullName?: string
): Promise<User> {
  const db = await initDb();
  
  // Check if user already exists
  const existingUser = db.users.find((u: any) => u.email === email);
  if (existingUser) {
    return null as any;
  }

  const passwordHash = await hashPassword(password);
  const user: User = {
    id: db.nextUserId++,
    email,
    fullName: fullName || null,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  await saveDb(db);
  
  return user;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await initDb();
  const user = db.users.find((u: any) => u.email === email);
  return user || null;
}

// Get user by ID
export async function getUserById(userId: number): Promise<User | null> {
  const db = await initDb();
  const user = db.users.find((u: any) => u.id === userId);
  return user || null;
}

// Get user with password hash for login
export async function getUserWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
  return getUserByEmail(email);
}

// Create session token
export async function createSession(userId: number): Promise<string> {
  const db = await initDb();
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) throw new Error('User not found');
  
  const sessionId = `session_${db.nextSessionId++}_${Date.now()}`;
  const session: any = {
    id: sessionId,
    userId,
    createdAt: new Date().toISOString(),
  };
  
  db.sessions.push(session);
  await saveDb(db);
  
  return sessionId;
}

// Get session
export async function getSession(token: string): Promise<Session | null> {
  const db = await initDb();
  const sessionData = db.sessions.find((s: any) => s.id === token);
  
  if (!sessionData) return null;
  
  const user = db.users.find((u: any) => u.id === sessionData.userId);
  if (!user) return null;
  
  return {
    id: sessionData.id,
    userId: sessionData.userId,
    user,
    createdAt: sessionData.createdAt,
  };
}

// Delete session
export async function deleteSession(token: string): Promise<void> {
  const db = await initDb();
  db.sessions = db.sessions.filter((s: any) => s.id !== token);
  await saveDb(db);
}

// Re-export verifyPassword for use in login API
export { hashPassword, verifyPassword };

// Log activity (integrated with activity API)
export async function logActivity(
  userId: number,
  action: string,
  details?: Record<string, any>,
  intentExecutionId?: number
): Promise<void> {
  // Import the aiActionService to log activities
  const { aiActionService } = await import('./services-sqlite');
  
  const status = action === 'executed_intent' && details?.success ? 'executed' : 
                action === 'executed_intent' && !details?.success ? 'failed' : 'pending';
  
  await aiActionService.logAIAction(userId, {
    intentText: action,
    intentType: details?.intentType || 'activity',
    previewData: details,
    status: status as any,
    reasoning: `Activity logged: ${action}`
  });
  
  console.log(`[Activity] User ${userId}: ${action}`, details);
}
