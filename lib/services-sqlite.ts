import { initDatabase, hashPassword, verifyPassword, sanitizeInput, encrypt, decrypt, getDatabaseStats, optimizeDatabase } from './database-sqlite';
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

// User Management with large dataset support
export class UserService {
  private db = initDatabase();

  async createUser(email: string, password: string, fullName?: string): Promise<User | null> {
    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const sanitizedFullName = fullName ? sanitizeInput(fullName) : null;

      // Check if user already exists
      const existingUser = this.db.prepare('SELECT id FROM users WHERE email = ?').get(sanitizedEmail);
      if (existingUser) {
        return null;
      }

      // Hash password
      const { hash, salt } = hashPassword(password);

      // Insert user with transaction
      const transaction = this.db.transaction(() => {
        const result = this.db.prepare(`
          INSERT INTO users (email, full_name, password_hash, salt) 
          VALUES (?, ?, ?, ?)
        `).run(sanitizedEmail, sanitizedFullName, hash, salt);

        return this.db.prepare('SELECT id, email, full_name, created_at, updated_at FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
      });

      return transaction();
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
      `).get(sanitizedEmail) as any;
      
      if (!user) return null;
      
      // Map snake_case database fields to camelCase
      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        passwordHash: user.password_hash,
        salt: user.salt,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };
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

  async getAllUsers(limit: number = 100, offset: number = 0): Promise<User[]> {
    try {
      const users = this.db.prepare(`
        SELECT id, email, full_name, created_at, updated_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).all(limit, offset);
      return users as User[];
    } catch (error) {
      console.error('[UserService] Error getting all users:', error);
      return [];
    }
  }

  async updateUser(userId: number, updates: { fullName?: string; email?: string }): Promise<boolean> {
    try {
      const fields = [];
      const values = [];
      
      if (updates.fullName !== undefined) {
        fields.push('full_name = ?');
        values.push(sanitizeInput(updates.fullName));
      }
      
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(sanitizeInput(updates.email.toLowerCase()));
      }
      
      if (fields.length === 0) return false;
      
      values.push(userId);
      
      const result = this.db.prepare(`
        UPDATE users SET ${fields.join(', ')} WHERE id = ?
      `).run(...values);
      
      return result.changes > 0;
    } catch (error) {
      console.error('[UserService] Error updating user:', error);
      return false;
    }
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      const transaction = this.db.transaction(() => {
        // Delete related records (cascaded by foreign keys)
        this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      });
      
      transaction();
      return true;
    } catch (error) {
      console.error('[UserService] Error deleting user:', error);
      return false;
    }
  }
}

// Session Management with cleanup for large datasets
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

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = this.db.prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")').run();
      return result.changes;
    } catch (error) {
      console.error('[SessionService] Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  async getUserSessions(userId: number, limit: number = 10): Promise<Session[]> {
    try {
      const sessions = this.db.prepare(`
        SELECT * FROM sessions 
        WHERE user_id = ? AND expires_at > datetime('now')
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(userId, limit);
      return sessions as Session[];
    } catch (error) {
      console.error('[SessionService] Error getting user sessions:', error);
      return [];
    }
  }
}

// Task Management with large dataset support
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

  async getUserTasks(userId: number, status?: string, limit: number = 50, offset: number = 0): Promise<Task[]> {
    try {
      let query = 'SELECT * FROM tasks WHERE user_id = ?';
      const params: any[] = [userId];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const tasks = this.db.prepare(query).all(...params);
      return tasks as Task[];
    } catch (error) {
      console.error('[TaskService] Error getting user tasks:', error);
      return [];
    }
  }

  async getTasksByDateRange(userId: number, startDate: string, endDate: string): Promise<Task[]> {
    try {
      const tasks = this.db.prepare(`
        SELECT * FROM tasks 
        WHERE user_id = ? AND scheduled_date BETWEEN ? AND ?
        ORDER BY scheduled_date ASC, scheduled_time ASC
      `).all(userId, startDate, endDate);
      return tasks as Task[];
    } catch (error) {
      console.error('[TaskService] Error getting tasks by date range:', error);
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

  async updateTask(taskId: number, updates: Partial<Task>): Promise<boolean> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) return false;
      
      values.push(taskId);
      
      const result = this.db.prepare(`
        UPDATE tasks SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?
      `).run(...values);
      
      return result.changes > 0;
    } catch (error) {
      console.error('[TaskService] Error updating task:', error);
      return false;
    }
  }

  async deleteTask(taskId: number): Promise<boolean> {
    try {
      const result = this.db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
      return result.changes > 0;
    } catch (error) {
      console.error('[TaskService] Error deleting task:', error);
      return false;
    }
  }

  async getTaskStats(userId: number): Promise<{
    total: number;
    pending: number;
    completed: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  }> {
    try {
      const stats = {
        total: this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?').get(userId) as { count: number },
        pending: this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "pending"').get(userId) as { count: number },
        completed: this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "executed"').get(userId) as { count: number },
        byPriority: {} as Record<string, number>,
        byType: {} as Record<string, number>
      };

      // Get stats by priority
      const priorityStats = this.db.prepare(`
        SELECT priority, COUNT(*) as count FROM tasks 
        WHERE user_id = ? GROUP BY priority
      `).all(userId) as { priority: string; count: number }[];
      
      priorityStats.forEach(stat => {
        stats.byPriority[stat.priority] = stat.count;
      });

      // Get stats by type
      const typeStats = this.db.prepare(`
        SELECT intent_type, COUNT(*) as count FROM tasks 
        WHERE user_id = ? GROUP BY intent_type
      `).all(userId) as { intent_type: string; count: number }[];
      
      typeStats.forEach(stat => {
        stats.byType[stat.intent_type] = stat.count;
      });

      return {
        total: stats.total.count,
        pending: stats.pending.count,
        completed: stats.completed.count,
        byPriority: stats.byPriority,
        byType: stats.byType
      };
    } catch (error) {
      console.error('[TaskService] Error getting task stats:', error);
      return {
        total: 0,
        pending: 0,
        completed: 0,
        byPriority: {},
        byType: {}
      };
    }
  }
}

// AI Actions Audit with large dataset support
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

  async getUserAIActions(userId: number, limit: number = 50, offset: number = 0): Promise<AIAction[]> {
    try {
      const actions = this.db.prepare(`
        SELECT * FROM ai_actions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `).all(userId, limit, offset);
      return actions as AIAction[];
    } catch (error) {
      console.error('[AIActionService] Error getting user AI actions:', error);
      return [];
    }
  }

  async getAIActionsByType(userId: number, intentType: string, limit: number = 50): Promise<AIAction[]> {
    try {
      const actions = this.db.prepare(`
        SELECT * FROM ai_actions 
        WHERE user_id = ? AND intent_type = ?
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(userId, intentType, limit);
      return actions as AIAction[];
    } catch (error) {
      console.error('[AIActionService] Error getting AI actions by type:', error);
      return [];
    }
  }

  async getAIActionsByDateRange(userId: number, startDate: string, endDate: string): Promise<AIAction[]> {
    try {
      const actions = this.db.prepare(`
        SELECT * FROM ai_actions 
        WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?
        ORDER BY created_at DESC
      `).all(userId, startDate, endDate);
      return actions as AIAction[];
    } catch (error) {
      console.error('[AIActionService] Error getting AI actions by date range:', error);
      return [];
    }
  }

  async getAIActionStats(userId: number): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    avgConfidence: number;
    recentActions: AIAction[];
  }> {
    try {
      const stats = {
        total: (this.db.prepare('SELECT COUNT(*) as count FROM ai_actions WHERE user_id = ?').get(userId) as { count: number }).count,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        avgConfidence: 0,
        recentActions: [] as AIAction[]
      };

      // Get stats by type
      const typeStats = this.db.prepare(`
        SELECT intent_type, COUNT(*) as count FROM ai_actions 
        WHERE user_id = ? GROUP BY intent_type
      `).all(userId) as { intent_type: string; count: number }[];
      
      typeStats.forEach(stat => {
        stats.byType[stat.intent_type] = stat.count;
      });

      // Get stats by status
      const statusStats = this.db.prepare(`
        SELECT status, COUNT(*) as count FROM ai_actions 
        WHERE user_id = ? GROUP BY status
      `).all(userId) as { status: string; count: number }[];
      
      statusStats.forEach(stat => {
        stats.byStatus[stat.status] = stat.count;
      });

      // Get average confidence
      const avgConf = this.db.prepare(`
        SELECT AVG(confidence_score) as avg_conf FROM ai_actions 
        WHERE user_id = ? AND confidence_score IS NOT NULL
      `).get(userId) as { avg_conf: number };
      
      stats.avgConfidence = avgConf.avg_conf || 0;

      // Get recent actions
      stats.recentActions = await this.getUserAIActions(userId, 10, 0);

      return stats;
    } catch (error) {
      console.error('[AIActionService] Error getting AI action stats:', error);
      return {
        total: 0,
        byType: {},
        byStatus: {},
        avgConfidence: 0,
        recentActions: []
      };
    }
  }
}

// Cognitive Load Management with analytics support
export class CognitiveLoadService {
  private db = initDatabase();

  async calculateAndUpdateCognitiveLoad(userId: number): Promise<CognitiveLoad | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Count tasks for today with optimized query
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

  async getCognitiveLoad(userId: number, days: number = 30): Promise<CognitiveLoad[]> {
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

  async getCognitiveLoadAnalytics(userId: number, days: number = 30): Promise<{
    averageLoad: string;
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    peakDays: CognitiveLoad[];
    recommendations: string[];
  }> {
    try {
      const loads = await this.getCognitiveLoad(userId, days);
      
      if (loads.length === 0) {
        return {
          averageLoad: 'low',
          trendDirection: 'stable',
          peakDays: [],
          recommendations: ['Start tracking your tasks to see cognitive load patterns']
        };
      }

      // Calculate average load
      const loadScores = { low: 1, medium: 2, high: 3, overloaded: 4 };
      const avgScore = loads.reduce((sum, load) => sum + loadScores[load.loadLevel], 0) / loads.length;
      
      let averageLoad = 'low';
      if (avgScore >= 3.5) averageLoad = 'overloaded';
      else if (avgScore >= 2.5) averageLoad = 'high';
      else if (avgScore >= 1.5) averageLoad = 'medium';

      // Calculate trend
      const recentLoads = loads.slice(0, 7).map(l => loadScores[l.loadLevel]);
      const olderLoads = loads.slice(7, 14).map(l => loadScores[l.loadLevel]);
      
      const recentAvg = recentLoads.reduce((a, b) => a + b, 0) / recentLoads.length;
      const olderAvg = olderLoads.length > 0 ? olderLoads.reduce((a, b) => a + b, 0) / olderLoads.length : recentAvg;
      
      let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentAvg > olderAvg + 0.5) trendDirection = 'increasing';
      else if (recentAvg < olderAvg - 0.5) trendDirection = 'decreasing';

      // Find peak days
      const peakDays = loads
        .filter(l => l.loadLevel === 'high' || l.loadLevel === 'overloaded')
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 3);

      // Generate recommendations
      const recommendations = [];
      if (trendDirection === 'increasing') {
        recommendations.push('Your cognitive load is increasing - consider delegating or postponing tasks');
      }
      if (averageLoad === 'overloaded') {
        recommendations.push('You are consistently overloaded - review your task management strategy');
      }
      if (peakDays.length > 0) {
        recommendations.push('Identify patterns in your high-load days to better prepare');
      }

      return {
        averageLoad,
        trendDirection,
        peakDays,
        recommendations
      };
    } catch (error) {
      console.error('[CognitiveLoadService] Error getting cognitive load analytics:', error);
      return {
        averageLoad: 'low',
        trendDirection: 'stable',
        peakDays: [],
        recommendations: ['Unable to calculate analytics']
      };
    }
  }
}

// Database management utilities
export class DatabaseService {
  static getStats() {
    return getDatabaseStats();
  }

  static optimize() {
    optimizeDatabase();
  }

  static async cleanupOldData(daysToKeep: number = 90): Promise<{
    deletedSessions: number;
    deletedAIActions: number;
  }> {
    const db = initDatabase();
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    
    const deletedSessions = db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(cutoffDate).changes;
    const deletedAIActions = db.prepare('DELETE FROM ai_actions WHERE created_at < ?').run(cutoffDate).changes;
    
    return {
      deletedSessions,
      deletedAIActions
    };
  }
}

// Export service instances
export const userService = new UserService();
export const sessionService = new SessionService();
export const taskService = new TaskService();
export const aiActionService = new AIActionService();
export const cognitiveLoadService = new CognitiveLoadService();
