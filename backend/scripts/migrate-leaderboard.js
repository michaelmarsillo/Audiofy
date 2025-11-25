const pool = require('../db');

/**
 * Database Migration Script for Leaderboard System
 * 
 * This script:
 * 1. Creates user_stats table for aggregate statistics
 * 2. Updates games table to support both solo and multiplayer
 * 3. Adds indexes for performance
 * 4. Migrates existing data
 */

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...\n');
    
    await client.query('BEGIN');

    // ========================================
    // STEP 1: Update games table
    // ========================================
    console.log('📊 Step 1: Updating games table...');
    
    // Check if game_mode column exists
    const gamesModeCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'games' AND column_name = 'game_mode'
    `);

    if (gamesModeCheck.rows.length === 0) {
      // First, drop old constraints that might interfere
      console.log('🔧 Dropping old constraints...');
      await client.query(`
        ALTER TABLE games
        DROP CONSTRAINT IF EXISTS games_decade_check
      `);
      await client.query(`
        ALTER TABLE games
        DROP CONSTRAINT IF EXISTS games_score_check
      `);
      await client.query(`
        ALTER TABLE games
        DROP CONSTRAINT IF EXISTS games_duration_ms_check
      `);
      console.log('✅ Old constraints dropped');
      
      // Rename 'decade' to 'playlist' if it exists
      const decadeCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'decade'
      `);
      
      if (decadeCheck.rows.length > 0) {
        await client.query(`
          ALTER TABLE games 
          RENAME COLUMN decade TO playlist
        `);
        console.log('✅ Renamed decade column to playlist');
      }
      
      // Add new columns to games table (one at a time to avoid conflicts)
      await client.query(`
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) DEFAULT 'solo'
      `);
      
      // Ensure playlist column exists and is the right size
      const playlistCheck = await client.query(`
        SELECT column_name, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'playlist'
      `);
      
      if (playlistCheck.rows.length > 0) {
        // Column exists, check if it needs resizing
        const currentLength = playlistCheck.rows[0].character_maximum_length;
        if (currentLength < 100) {
          await client.query(`
            ALTER TABLE games
            ALTER COLUMN playlist TYPE VARCHAR(100)
          `);
          console.log('✅ Resized playlist column to VARCHAR(100)');
        }
      } else {
        // Column doesn't exist, add it
        await client.query(`
          ALTER TABLE games
          ADD COLUMN playlist VARCHAR(100)
        `);
        console.log('✅ Added playlist column');
      }
      
      // Ensure game_mode column is the right size
      const gameModeCheck = await client.query(`
        SELECT column_name, character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'game_mode'
      `);
      
      if (gameModeCheck.rows.length > 0) {
        const currentLength = gameModeCheck.rows[0].character_maximum_length;
        if (currentLength < 20) {
          await client.query(`
            ALTER TABLE games
            ALTER COLUMN game_mode TYPE VARCHAR(20)
          `);
          console.log('✅ Resized game_mode column to VARCHAR(20)');
        }
      }
      
      await client.query(`
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS correct_answers INT
      `);
      
      await client.query(`
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS total_questions INT DEFAULT 7
      `);
      
      await client.query(`
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS accuracy DECIMAL(5,2)
      `);
      
      await client.query(`
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS room_code VARCHAR(10)
      `);
      
      await client.query(`
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS placement INT
      `);
      
      await client.query(`
        ALTER TABLE games
        ADD COLUMN IF NOT EXISTS total_players INT
      `);
      
      // Update existing records to have game_mode = 'solo'
      await client.query(`
        UPDATE games 
        SET game_mode = 'solo' 
        WHERE game_mode IS NULL
      `);
      
      console.log('✅ Games table updated');
    } else {
      console.log('✅ Games table already up to date');
    }

    // ========================================
    // STEP 2: Create user_stats table
    // ========================================
    console.log('\n📊 Step 2: Creating user_stats table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        
        -- Solo Play Stats
        solo_total_score BIGINT DEFAULT 0,
        solo_games_played INT DEFAULT 0,
        solo_avg_score DECIMAL(10,2) DEFAULT 0,
        solo_best_score INT DEFAULT 0,
        
        -- Multiplayer Stats
        multi_total_score BIGINT DEFAULT 0,
        multi_games_played INT DEFAULT 0,
        multi_wins INT DEFAULT 0,
        multi_avg_score DECIMAL(10,2) DEFAULT 0,
        multi_best_score INT DEFAULT 0,
        
        -- Combined Stats (for global leaderboard)
        total_audiofy_score BIGINT DEFAULT 0,
        total_games_played INT DEFAULT 0,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ user_stats table created');

    // ========================================
    // STEP 3: Create indexes for performance
    // ========================================
    console.log('\n📊 Step 3: Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_user_mode 
      ON games(user_id, game_mode)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_leaderboard 
      ON games(game_mode, score DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_stats_global 
      ON user_stats(total_audiofy_score DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_stats_solo 
      ON user_stats(solo_total_score DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_stats_multi 
      ON user_stats(multi_total_score DESC)
    `);
    
    console.log('✅ Indexes created');

    // ========================================
    // STEP 4: Populate user_stats from existing games
    // ========================================
    console.log('\n📊 Step 4: Populating user_stats from existing games...');
    
    // Insert or update user_stats for all users with games
    await client.query(`
      INSERT INTO user_stats (
        user_id, 
        username,
        solo_total_score,
        solo_games_played,
        solo_avg_score,
        solo_best_score,
        total_audiofy_score,
        total_games_played
      )
      SELECT 
        u.id,
        u.username,
        COALESCE(SUM(CASE WHEN g.game_mode = 'solo' THEN g.score ELSE 0 END), 0) as solo_total,
        COUNT(CASE WHEN g.game_mode = 'solo' THEN 1 END) as solo_games,
        COALESCE(AVG(CASE WHEN g.game_mode = 'solo' THEN g.score END), 0) as solo_avg,
        COALESCE(MAX(CASE WHEN g.game_mode = 'solo' THEN g.score END), 0) as solo_best,
        COALESCE(SUM(g.score), 0) as total_score,
        COUNT(*) as total_games
      FROM users u
      LEFT JOIN games g ON u.id = g.user_id
      GROUP BY u.id, u.username
      ON CONFLICT (user_id) 
      DO UPDATE SET
        solo_total_score = EXCLUDED.solo_total_score,
        solo_games_played = EXCLUDED.solo_games_played,
        solo_avg_score = EXCLUDED.solo_avg_score,
        solo_best_score = EXCLUDED.solo_best_score,
        total_audiofy_score = EXCLUDED.total_audiofy_score,
        total_games_played = EXCLUDED.total_games_played,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    console.log('✅ user_stats populated');

    // ========================================
    // STEP 5: Create trigger for auto-updating user_stats
    // ========================================
    console.log('\n📊 Step 5: Creating trigger for auto-updates...');
    
    // Drop existing trigger if it exists
    await client.query(`
      DROP TRIGGER IF EXISTS update_user_stats_trigger ON games
    `);
    
    await client.query(`
      DROP FUNCTION IF EXISTS update_user_stats()
    `);
    
    // Create function to update user_stats
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_stats()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Insert or update user_stats
        INSERT INTO user_stats (user_id, username)
        SELECT NEW.user_id, u.username
        FROM users u
        WHERE u.id = NEW.user_id
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Recalculate stats for this user
        UPDATE user_stats
        SET
          solo_total_score = (
            SELECT COALESCE(SUM(score), 0)
            FROM games
            WHERE user_id = NEW.user_id AND game_mode = 'solo'
          ),
          solo_games_played = (
            SELECT COUNT(*)
            FROM games
            WHERE user_id = NEW.user_id AND game_mode = 'solo'
          ),
          solo_avg_score = (
            SELECT COALESCE(AVG(score), 0)
            FROM games
            WHERE user_id = NEW.user_id AND game_mode = 'solo'
          ),
          solo_best_score = (
            SELECT COALESCE(MAX(score), 0)
            FROM games
            WHERE user_id = NEW.user_id AND game_mode = 'solo'
          ),
          multi_total_score = (
            SELECT COALESCE(SUM(score), 0)
            FROM games
            WHERE user_id = NEW.user_id AND game_mode = 'multiplayer'
          ),
          multi_games_played = (
            SELECT COUNT(*)
            FROM games
            WHERE user_id = NEW.user_id AND game_mode = 'multiplayer'
          ),
          multi_avg_score = (
            SELECT COALESCE(AVG(score), 0)
            FROM games
            WHERE user_id = NEW.user_id AND game_mode = 'multiplayer'
          ),
          multi_best_score = (
            SELECT COALESCE(MAX(score), 0)
            FROM games
            WHERE user_id = NEW.user_id AND game_mode = 'multiplayer'
          ),
          multi_wins = (
            SELECT COUNT(*)
            FROM games
            WHERE user_id = NEW.user_id AND game_mode = 'multiplayer' AND placement = 1
          ),
          total_audiofy_score = (
            SELECT COALESCE(SUM(score), 0)
            FROM games
            WHERE user_id = NEW.user_id
          ),
          total_games_played = (
            SELECT COUNT(*)
            FROM games
            WHERE user_id = NEW.user_id
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = NEW.user_id;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create trigger
    await client.query(`
      CREATE TRIGGER update_user_stats_trigger
      AFTER INSERT ON games
      FOR EACH ROW
      EXECUTE FUNCTION update_user_stats()
    `);
    
    console.log('✅ Trigger created');

    await client.query('COMMIT');
    
    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Summary:');
    console.log('✅ Games table updated with multiplayer support');
    console.log('✅ user_stats table created');
    console.log('✅ Performance indexes added');
    console.log('✅ Existing data migrated');
    console.log('✅ Auto-update trigger installed');
    console.log('\n🚀 Your leaderboard system is ready!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };

