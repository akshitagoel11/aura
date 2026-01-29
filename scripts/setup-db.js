#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // SQL initialization - inlined for reliability
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS intent_executions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        intent_type VARCHAR(50) NOT NULL,
        input_text TEXT NOT NULL,
        preview_output TEXT,
        execution_status VARCHAR(50) DEFAULT 'pending',
        webhook_response JSONB,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        intent_execution_id INTEGER REFERENCES intent_executions(id) ON DELETE SET NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_intent_executions_user_id ON intent_executions(user_id);
      CREATE INDEX IF NOT EXISTS idx_intent_executions_created_at ON intent_executions(created_at);
      CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
    `;

    // Execute the SQL
    console.log('Setting up database schema...');
    await pool.query(sql);
    console.log('Database setup completed successfully!');

    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nCreated tables:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
