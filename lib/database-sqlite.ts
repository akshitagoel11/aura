import Database from 'better-sqlite3';
import { join } from 'path';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

// Database path - ensure directory exists
const DB_DIR = join(process.cwd(), 'data');
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = join(DB_DIR, 'aura.db');

// Encryption key (in production, use environment variable)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

// Database connection
let db: Database.Database;

// Initialize database
export function initDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    
    // Enable foreign keys and performance optimizations
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = 1000000');
    db.pragma('temp_store = MEMORY');
    
    // Create tables
    createTables();
  }
  return db;
}

// Create database schema with proper indexing for large datasets
function createTables(): void {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sessions table with proper indexing
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tasks table with optimized indexes
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      intent_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      scheduled_date DATE,
      scheduled_time TIME,
      is_time_flexible BOOLEAN DEFAULT 1,
      encrypted_payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // AI Actions audit log with partitioning support
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      intent_text TEXT NOT NULL,
      intent_type TEXT NOT NULL,
      preview_data TEXT,
      execution_data TEXT,
      status TEXT NOT NULL,
      confidence_score REAL,
      reasoning TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Cognitive load tracking with time-series optimization
  db.exec(`
    CREATE TABLE IF NOT EXISTS cognitive_load (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      task_count INTEGER DEFAULT 0,
      load_level TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    )
  `);

  // Create optimized indexes for large datasets
  db.exec(`
    -- User indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    
    -- Session indexes for performance
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    
    -- Task indexes for large datasets
    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_intent_type ON tasks(intent_type);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    
    -- AI Actions indexes for audit trail performance
    CREATE INDEX IF NOT EXISTS idx_ai_actions_user_id ON ai_actions(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_actions_created_at ON ai_actions(created_at);
    CREATE INDEX IF NOT EXISTS idx_ai_actions_intent_type ON ai_actions(intent_type);
    CREATE INDEX IF NOT EXISTS idx_ai_actions_status ON ai_actions(status);
    
    -- Cognitive load indexes for analytics
    CREATE INDEX IF NOT EXISTS idx_cognitive_load_user_date ON cognitive_load(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_cognitive_load_date ON cognitive_load(date);
  `);

  // Create triggers for automatic timestamp updates
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
    
    CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
    AFTER UPDATE ON tasks
    BEGIN
      UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
}

// Encryption utilities (same as before)
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
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

export function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Database utility functions for large datasets
export function backupDatabase(): string {
  const backup = db.exec(`SELECT * FROM users UNION ALL SELECT * FROM sessions UNION ALL SELECT * FROM tasks UNION ALL SELECT * FROM ai_actions UNION ALL SELECT * FROM cognitive_load`);
  return JSON.stringify(backup);
}

export function getDatabaseStats(): {
  users: number;
  sessions: number;
  tasks: number;
  aiActions: number;
  cognitiveLoad: number;
  databaseSize: number;
} {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number },
    sessions: db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number },
    tasks: db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number },
    aiActions: db.prepare('SELECT COUNT(*) as count FROM ai_actions').get() as { count: number },
    cognitiveLoad: db.prepare('SELECT COUNT(*) as count FROM cognitive_load').get() as { count: number },
    databaseSize: 0
  };
  
  // Get database file size
  try {
    const fs = require('fs');
    stats.databaseSize = fs.statSync(DB_PATH).size;
  } catch (error) {
    stats.databaseSize = 0;
  }
  
  return {
    users: stats.users.count,
    sessions: stats.sessions.count,
    tasks: stats.tasks.count,
    aiActions: stats.aiActions.count,
    cognitiveLoad: stats.cognitiveLoad.count,
    databaseSize: stats.databaseSize
  };
}

export function optimizeDatabase(): void {
  // Vacuum and reindex for performance
  db.exec('VACUUM');
  db.exec('REINDEX');
  db.exec('ANALYZE');
}

export { db, DB_PATH };
