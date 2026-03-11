import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// File-based storage with enhanced security
const DB_FILE = join(process.cwd(), 'aura-data.json');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

interface Database {
  users: any[];
  sessions: any[];
  tasks: any[];
  aiActions: any[];
  cognitiveLoad: any[];
  nextUserId: number;
  nextSessionId: number;
  nextTaskId: number;
  nextAIActionId: number;
  nextCognitiveLoadId: number;
}

// Initialize database file
async function initDb(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    const db = JSON.parse(data);
    // Ensure all required fields exist
    return {
      users: db.users || [],
      sessions: db.sessions || [],
      tasks: db.tasks || [],
      aiActions: db.aiActions || [],
      cognitiveLoad: db.cognitiveLoad || [],
      nextUserId: db.nextUserId || 1,
      nextSessionId: db.nextSessionId || 1,
      nextTaskId: db.nextTaskId || 1,
      nextAIActionId: db.nextAIActionId || 1,
      nextCognitiveLoadId: db.nextCognitiveLoadId || 1,
    };
  } catch {
    // File doesn't exist, create initial structure
    const db: Database = {
      users: [],
      sessions: [],
      tasks: [],
      aiActions: [],
      cognitiveLoad: [],
      nextUserId: 1,
      nextSessionId: 1,
      nextTaskId: 1,
      nextAIActionId: 1,
      nextCognitiveLoadId: 1,
    };
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }
}

// Save database to file
async function saveDb(db: Database): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
}

// Encryption utilities
export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
  const decipher = createDecipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY, 'hex'), 
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Password hashing with SHA-256 and salt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return hash === storedHash;
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .substring(0, 1000); // Limit length
}

// User Management
export interface User {
  id: number;
  email: string;
  fullName: string | null;
  passwordHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: number;
  expiresAt: string;
  createdAt: string;
}

export interface Task {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  intentType: string;
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  scheduledDate: string | null;
  scheduledTime: string | null;
  isTimeFlexible: boolean;
  encryptedPayload: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIAction {
  id: number;
  userId: number;
  intentText: string;
  intentType: string;
  previewData: string | null;
  executionData: string | null;
  status: 'suggested' | 'confirmed' | 'executed' | 'cancelled' | 'failed';
  confidenceScore: number | null;
  reasoning: string | null;
  createdAt: string;
}

export interface CognitiveLoad {
  id: number;
  userId: number;
  date: string;
  taskCount: number;
  loadLevel: 'low' | 'medium' | 'high' | 'overloaded';
  createdAt: string;
}

// User Service
export class UserService {
  async createUser(email: string, password: string, fullName?: string): Promise<User | null> {
    try {
      const db = await initDb();
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const sanitizedFullName = fullName ? sanitizeInput(fullName) : null;

      // Check if user already exists
      const existingUser = db.users.find((u: any) => u.email === sanitizedEmail);
      if (existingUser) {
        return null;
      }

      // Hash password
      const { hash, salt } = hashPassword(password);

      // Insert user
      const user: User = {
        id: db.nextUserId++,
        email: sanitizedEmail,
        fullName: sanitizedFullName,
        passwordHash: hash,
        salt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.users.push(user);
      await saveDb(db);
      
      return user;
    } catch (error) {
      console.error('[UserService] Error creating user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash: string; salt: string }) | null> {
    try {
      const db = await initDb();
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const user = db.users.find((u: any) => u.email === sanitizedEmail);
      
      return user as (User & { passwordHash: string; salt: string }) || null;
    } catch (error) {
      console.error('[UserService] Error getting user by email:', error);
      return null;
    }
  }

  async getUserById(userId: number): Promise<User | null> {
    try {
      const db = await initDb();
      const user = db.users.find((u: any) => u.id === userId);
      
      return user as User || null;
    } catch (error) {
      console.error('[UserService] Error getting user by ID:', error);
      return null;
    }
  }
}

// Session Service
export class SessionService {
  async createSession(userId: number): Promise<Session | null> {
    try {
      const db = await initDb();
      const sessionId = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const session: Session = {
        id: sessionId,
        userId,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
      };

      db.sessions.push(session);
      await saveDb(db);

      return session;
    } catch (error) {
      console.error('[SessionService] Error creating session:', error);
      return null;
    }
  }

  async getSession(sessionId: string): Promise<(Session & { user: User }) | null> {
    try {
      const db = await initDb();
      const session = db.sessions.find((s: any) => s.id === sessionId && new Date(s.expiresAt) > new Date());
      
      if (!session) return null;

      const user = db.users.find((u: any) => u.id === session.userId);
      if (!user) return null;

      return {
        ...session,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      console.error('[SessionService] Error getting session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const db = await initDb();
      const initialLength = db.sessions.length;
      db.sessions = db.sessions.filter((s: any) => s.id !== sessionId);
      await saveDb(db);
      return db.sessions.length < initialLength;
    } catch (error) {
      console.error('[SessionService] Error deleting session:', error);
      return false;
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const db = await initDb();
      db.sessions = db.sessions.filter((s: any) => new Date(s.expiresAt) > new Date());
      await saveDb(db);
    } catch (error) {
      console.error('[SessionService] Error cleaning up expired sessions:', error);
    }
  }
}

// Task Service
export class TaskService {
  async createTask(userId: number, taskData: {
    title: string;
    description?: string;
    intentType: string;
    priority?: 'low' | 'medium' | 'high';
    scheduledDate?: string;
    scheduledTime?: string;
    isTimeFlexible?: boolean;
    payload?: any;
  }): Promise<Task | null> {
    try {
      const db = await initDb();
      const encryptedPayload = taskData.payload ? 
        JSON.stringify(encrypt(JSON.stringify(taskData.payload))) : null;

      const task: Task = {
        id: db.nextTaskId++,
        userId,
        title: sanitizeInput(taskData.title),
        description: taskData.description ? sanitizeInput(taskData.description) : null,
        intentType: taskData.intentType,
        priority: taskData.priority || 'medium',
        scheduledDate: taskData.scheduledDate || null,
        scheduledTime: taskData.scheduledTime || null,
        isTimeFlexible: taskData.isTimeFlexible !== false,
        encryptedPayload,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.tasks.push(task);
      await saveDb(db);
      
      return task;
    } catch (error) {
      console.error('[TaskService] Error creating task:', error);
      return null;
    }
  }

  async getUserTasks(userId: number, status?: string): Promise<Task[]> {
    try {
      const db = await initDb();
      let tasks = db.tasks.filter((t: any) => t.userId === userId);
      
      if (status) {
        tasks = tasks.filter((t: any) => t.status === status);
      }

      return tasks.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('[TaskService] Error getting user tasks:', error);
      return [];
    }
  }

  async updateTaskStatus(taskId: number, status: Task['status']): Promise<boolean> {
    try {
      const db = await initDb();
      const task = db.tasks.find((t: any) => t.id === taskId);
      
      if (task) {
        task.status = status;
        task.updatedAt = new Date().toISOString();
        await saveDb(db);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[TaskService] Error updating task status:', error);
      return false;
    }
  }
}

// AI Action Service
export class AIActionService {
  async logAIAction(userId: number, actionData: {
    intentText: string;
    intentType: string;
    previewData?: any;
    executionData?: any;
    status: AIAction['status'];
    confidenceScore?: number;
    reasoning?: string;
  }): Promise<AIAction | null> {
    try {
      const db = await initDb();
      
      const action: AIAction = {
        id: db.nextAIActionId++,
        userId,
        intentText: sanitizeInput(actionData.intentText),
        intentType: actionData.intentType,
        previewData: actionData.previewData ? JSON.stringify(actionData.previewData) : null,
        executionData: actionData.executionData ? JSON.stringify(actionData.executionData) : null,
        status: actionData.status,
        confidenceScore: actionData.confidenceScore || null,
        reasoning: actionData.reasoning ? sanitizeInput(actionData.reasoning) : null,
        createdAt: new Date().toISOString(),
      };

      db.aiActions.push(action);
      await saveDb(db);
      
      return action;
    } catch (error) {
      console.error('[AIActionService] Error logging AI action:', error);
      return null;
    }
  }

  async getUserAIActions(userId: number, limit: number = 50): Promise<AIAction[]> {
    try {
      const db = await initDb();
      const actions = db.aiActions
        .filter((a: any) => a.userId === userId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
      
      return actions as AIAction[];
    } catch (error) {
      console.error('[AIActionService] Error getting user AI actions:', error);
      return [];
    }
  }
}

// Cognitive Load Service
export class CognitiveLoadService {
  async calculateAndUpdateCognitiveLoad(userId: number): Promise<CognitiveLoad | null> {
    try {
      const db = await initDb();
      const today = new Date().toISOString().split('T')[0];
      
      // Count tasks for today
      const taskCount = db.tasks.filter((t: any) => 
        t.userId === userId && 
        t.scheduledDate === today && 
        t.status !== 'cancelled'
      ).length;

      // Determine load level
      let loadLevel: CognitiveLoad['loadLevel'] = 'low';
      if (taskCount >= 10) {
        loadLevel = 'overloaded';
      } else if (taskCount >= 7) {
        loadLevel = 'high';
      } else if (taskCount >= 4) {
        loadLevel = 'medium';
      }

      // Upsert cognitive load
      const existingLoad = db.cognitiveLoad.find((c: any) => c.userId === userId && c.date === today);
      
      if (existingLoad) {
        existingLoad.taskCount = taskCount;
        existingLoad.loadLevel = loadLevel;
      } else {
        const newLoad: CognitiveLoad = {
          id: db.nextCognitiveLoadId++,
          userId,
          date: today,
          taskCount,
          loadLevel,
          createdAt: new Date().toISOString(),
        };
        db.cognitiveLoad.push(newLoad);
      }

      await saveDb(db);

      return db.cognitiveLoad.find((c: any) => c.userId === userId && c.date === today) as CognitiveLoad || null;
    } catch (error) {
      console.error('[CognitiveLoadService] Error calculating cognitive load:', error);
      return null;
    }
  }

  async getCognitiveLoad(userId: number, days: number = 7): Promise<CognitiveLoad[]> {
    try {
      const db = await initDb();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return db.cognitiveLoad
        .filter((c: any) => c.userId === userId && new Date(c.date) >= cutoffDate)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) as CognitiveLoad[];
    } catch (error) {
      console.error('[CognitiveLoadService] Error getting cognitive load:', error);
      return [];
    }
  }
}

// Export service instances
export const userService = new UserService();
export const sessionService = new SessionService();
export const taskService = new TaskService();
export const aiActionService = new AIActionService();
export const cognitiveLoadService = new CognitiveLoadService();
