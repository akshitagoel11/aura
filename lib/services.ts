import { initDatabase, hashPassword, verifyPassword, sanitizeInput, encrypt, decrypt } from './database';
import { randomBytes } from 'crypto';

export interface User {
  id: number;
  email: string;
  fullName: string | null;
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

// User Management
export class UserService {
  private db = initDatabase();

  async createUser(email: string, password: string, fullName?: string): Promise<User | null> {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const sanitizedFullName = fullName ? sanitizeInput(fullName) : null;

      // Check if user already exists
      const existingUser = this.db.prepare('SELECT id FROM users WHERE email = ?').get(sanitizedEmail);
      if (existingUser) {
        return null;
      }

      // Hash password
      const { hash, salt } = hashPassword(password);

      // Insert user
      const result = this.db.prepare(`
        INSERT INTO users (email, full_name, password_hash, salt) 
        VALUES (?, ?, ?, ?)
      `).run(sanitizedEmail, sanitizedFullName, hash, salt);

      // Return created user
      const user = this.db.prepare('SELECT id, email, full_name, created_at, updated_at FROM users WHERE id = ?').get(result.lastInsertRowid);
      
      return user as User;
    } catch (error) {
      console.error('[UserService] Error creating user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash: string; salt: string }) | null> {
    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const user = this.db.prepare(`
        SELECT id, email, full_name, password_hash, salt, created_at, updated_at 
        FROM users WHERE email = ?
      `).get(sanitizedEmail);
      
      return user as (User & { passwordHash: string; salt: string }) || null;
    } catch (error) {
      console.error('[UserService] Error getting user by email:', error);
      return null;
    }
  }

  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = this.db.prepare(`
        SELECT id, email, full_name, created_at, updated_at 
        FROM users WHERE id = ?
      `).get(userId);
      
      return user as User || null;
    } catch (error) {
      console.error('[UserService] Error getting user by ID:', error);
      return null;
    }
  }
}

// Session Management
export class SessionService {
  private db = initDatabase();

  async createSession(userId: number): Promise<Session | null> {
    try {
      const sessionId = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      this.db.prepare(`
        INSERT INTO sessions (id, user_id, expires_at) 
        VALUES (?, ?, ?)
      `).run(sessionId, userId, expiresAt.toISOString());

      const session = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
      return session as Session || null;
    } catch (error) {
      console.error('[SessionService] Error creating session:', error);
      return null;
    }
  }

  async getSession(sessionId: string): Promise<(Session & { user: User }) | null> {
    try {
      const session = this.db.prepare(`
        SELECT s.*, u.id as user_id, u.email, u.full_name, u.created_at as user_created_at, u.updated_at as user_updated_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.expires_at > datetime('now')
      `).get(sessionId) as any;

      if (!session) return null;

      return {
        id: session.id,
        userId: session.user_id,
        expiresAt: session.expires_at,
        createdAt: session.created_at,
        user: {
          id: session.user_id,
          email: session.email,
          fullName: session.full_name,
          createdAt: session.user_created_at,
          updatedAt: session.user_updated_at
        }
      };
    } catch (error) {
      console.error('[SessionService] Error getting session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const result = this.db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
      return result.changes > 0;
    } catch (error) {
      console.error('[SessionService] Error deleting session:', error);
      return false;
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      this.db.prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")').run();
    } catch (error) {
      console.error('[SessionService] Error cleaning up expired sessions:', error);
    }
  }
}

// Task Management
export class TaskService {
  private db = initDatabase();

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
      const encryptedPayload = taskData.payload ? 
        JSON.stringify(encrypt(JSON.stringify(taskData.payload))) : null;

      const result = this.db.prepare(`
        INSERT INTO tasks (
          user_id, title, description, intent_type, priority, 
          scheduled_date, scheduled_time, is_time_flexible, encrypted_payload
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        sanitizeInput(taskData.title),
        taskData.description ? sanitizeInput(taskData.description) : null,
        taskData.intentType,
        taskData.priority || 'medium',
        taskData.scheduledDate || null,
        taskData.scheduledTime || null,
        taskData.isTimeFlexible !== false ? 1 : 0,
        encryptedPayload
      );

      const task = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
      return task as Task || null;
    } catch (error) {
      console.error('[TaskService] Error creating task:', error);
      return null;
    }
  }

  async getUserTasks(userId: number, status?: string): Promise<Task[]> {
    try {
      let query = 'SELECT * FROM tasks WHERE user_id = ?';
      const params: any[] = [userId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const tasks = this.db.prepare(query).all(...params);
      return tasks as Task[];
    } catch (error) {
      console.error('[TaskService] Error getting user tasks:', error);
      return [];
    }
  }

  async updateTaskStatus(taskId: number, status: Task['status']): Promise<boolean> {
    try {
      const result = this.db.prepare(`
        UPDATE tasks SET status = ?, updated_at = datetime('now') WHERE id = ?
      `).run(status, taskId);
      return result.changes > 0;
    } catch (error) {
      console.error('[TaskService] Error updating task status:', error);
      return false;
    }
  }
}

// AI Actions Audit
export class AIActionService {
  private db = initDatabase();

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
      const result = this.db.prepare(`
        INSERT INTO ai_actions (
          user_id, intent_text, intent_type, preview_data, execution_data, 
          status, confidence_score, reasoning
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        sanitizeInput(actionData.intentText),
        actionData.intentType,
        actionData.previewData ? JSON.stringify(actionData.previewData) : null,
        actionData.executionData ? JSON.stringify(actionData.executionData) : null,
        actionData.status,
        actionData.confidenceScore || null,
        actionData.reasoning ? sanitizeInput(actionData.reasoning) : null
      );

      const action = this.db.prepare('SELECT * FROM ai_actions WHERE id = ?').get(result.lastInsertRowid);
      return action as AIAction || null;
    } catch (error) {
      console.error('[AIActionService] Error logging AI action:', error);
      return null;
    }
  }

  async getUserAIActions(userId: number, limit: number = 50): Promise<AIAction[]> {
    try {
      const actions = this.db.prepare(`
        SELECT * FROM ai_actions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(userId, limit);
      return actions as AIAction[];
    } catch (error) {
      console.error('[AIActionService] Error getting user AI actions:', error);
      return [];
    }
  }
}

// Cognitive Load Management
export class CognitiveLoadService {
  private db = initDatabase();

  async calculateAndUpdateCognitiveLoad(userId: number): Promise<CognitiveLoad | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Count tasks for today
      const taskCount = this.db.prepare(`
        SELECT COUNT(*) as count FROM tasks 
        WHERE user_id = ? AND scheduled_date = ? AND status != 'cancelled'
      `).get(userId, today) as { count: number };

      // Determine load level
      let loadLevel: CognitiveLoad['loadLevel'] = 'low';
      if (taskCount.count >= 10) {
        loadLevel = 'overloaded';
      } else if (taskCount.count >= 7) {
        loadLevel = 'high';
      } else if (taskCount.count >= 4) {
        loadLevel = 'medium';
      }

      // Upsert cognitive load
      this.db.prepare(`
        INSERT OR REPLACE INTO cognitive_load (user_id, date, task_count, load_level)
        VALUES (?, ?, ?, ?)
      `).run(userId, today, taskCount.count, loadLevel);

      const load = this.db.prepare(`
        SELECT * FROM cognitive_load WHERE user_id = ? AND date = ?
      `).get(userId, today);

      return load as CognitiveLoad || null;
    } catch (error) {
      console.error('[CognitiveLoadService] Error calculating cognitive load:', error);
      return null;
    }
  }

  async getCognitiveLoad(userId: number, days: number = 7): Promise<CognitiveLoad[]> {
    try {
      const loads = this.db.prepare(`
        SELECT * FROM cognitive_load 
        WHERE user_id = ? AND date >= date('now', '-${days} days')
        ORDER BY date DESC
      `).all(userId);
      return loads as CognitiveLoad[];
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
