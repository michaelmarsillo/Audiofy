const pool = require('../db');

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test query
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully!');
    console.log('📅 Current time:', result.rows[0].current_time);
    console.log('🐘 PostgreSQL version:', result.rows[0].pg_version.split(' ')[1]);
    
    // Test users table
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Users in database: ${usersCount.rows[0].count}`);
    
    // Test games table
    const gamesCount = await pool.query('SELECT COUNT(*) FROM games');
    console.log(`🎮 Games in database: ${gamesCount.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();