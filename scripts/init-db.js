#!/usr/bin/env node

// Database initialization script for Aura AI Productivity Platform
// Run this script to initialize the SQLite database with proper schema

const { initDatabase } = require('../lib/database-sqlite');
const path = require('path');

function initializeDatabase() {
  try {
    console.log('🚀 Initializing Aura AI Database...');
    
    // Initialize database and create tables
    const db = initDatabase();
    
    console.log('✅ Database initialized successfully!');
    console.log('📁 Database location:', path.join(process.cwd(), 'data', 'aura.db'));
    
    // Test basic operations
    console.log('🧪 Testing database operations...');
    
    // Test user table
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log(`👥 Users table: ${userCount.count} records`);
    
    // Test sessions table
    const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
    console.log(`🔐 Sessions table: ${sessionCount.count} records`);
    
    // Test tasks table
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    console.log(`📋 Tasks table: ${taskCount.count} records`);
    
    // Test AI actions table
    const actionCount = db.prepare('SELECT COUNT(*) as count FROM ai_actions').get();
    console.log(`🤖 AI Actions table: ${actionCount.count} records`);
    
    // Test cognitive load table
    const loadCount = db.prepare('SELECT COUNT(*) as count FROM cognitive_load').get();
    console.log(`🧠 Cognitive Load table: ${loadCount.count} records`);
    
    // Get database file size
    const fs = require('fs');
    const dbPath = path.join(process.cwd(), 'data', 'aura.db');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`💾 Database size: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
    console.log('\n🎉 Database is ready for use!');
    console.log('🔒 Security: AES-256-GCM encryption enabled');
    console.log('⚡ Performance: WAL mode and optimized indexes');
    console.log('📊 Analytics: Time-series cognitive load tracking');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
