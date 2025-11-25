const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

class AuthService {
  /**
   * Register a new user
   */
  async signup(email, password, username) {
    try {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Check if username is taken
      const existingUsername = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (existingUsername.rows.length > 0) {
        throw new Error('Username is already taken');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert user into database
      const result = await pool.query(
        `INSERT INTO users (email, username, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, email, username, created_at`,
        [email, username, passwordHash]
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.created_at
        }
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Login existing user
   */
  async login(email, password) {
    try {
      // Find user by email
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = result.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.created_at
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token and return user
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from database
      const result = await pool.query(
        'SELECT id, email, username, created_at FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Save game result to database
   * @param {number} userId - User ID
   * @param {number} score - Quiz score
   * @param {string} gameMode - 'solo' or 'multiplayer'
   * @param {object} gameData - Additional game data
   */
  async saveGame(userId, score, gameMode = 'solo', gameData = {}) {
    try {
      const {
        playlist = null,
        correctAnswers = null,
        totalQuestions = 7,
        durationMs = 0,
        roomCode = null,
        placement = null,
        totalPlayers = null
      } = gameData;

      // Calculate accuracy
      const accuracy = correctAnswers && totalQuestions 
        ? ((correctAnswers / totalQuestions) * 100).toFixed(2)
        : null;

      const result = await pool.query(
        `INSERT INTO games (
          user_id, score, game_mode, playlist, 
          correct_answers, total_questions, accuracy,
          duration_ms, room_code, placement, total_players
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *`,
        [
          userId, score, gameMode, playlist,
          correctAnswers, totalQuestions, accuracy,
          durationMs, roomCode, placement, totalPlayers
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Save game error:', error);
      throw error;
    }
  }

  /**
   * Get global leaderboard (combined solo + multiplayer)
   */
  async getGlobalLeaderboard(limit = 100) {
    try {
      const result = await pool.query(
        `SELECT 
          user_id,
          username,
          total_audiofy_score,
          total_games_played,
          solo_total_score,
          solo_games_played,
          multi_total_score,
          multi_games_played,
          multi_wins,
          ROW_NUMBER() OVER (ORDER BY total_audiofy_score DESC) as rank
        FROM user_stats
        WHERE total_games_played > 0
        ORDER BY total_audiofy_score DESC
        LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Get global leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Get solo play leaderboard
   */
  async getSoloLeaderboard(limit = 100) {
    try {
      const result = await pool.query(
        `SELECT 
          user_id,
          username,
          solo_total_score,
          solo_games_played,
          solo_avg_score,
          solo_best_score,
          ROW_NUMBER() OVER (ORDER BY solo_total_score DESC) as rank
        FROM user_stats
        WHERE solo_games_played > 0
        ORDER BY solo_total_score DESC
        LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Get solo leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Get multiplayer leaderboard
   */
  async getMultiplayerLeaderboard(limit = 100) {
    try {
      const result = await pool.query(
        `SELECT 
          user_id,
          username,
          multi_total_score,
          multi_games_played,
          multi_wins,
          multi_avg_score,
          multi_best_score,
          ROW_NUMBER() OVER (ORDER BY multi_total_score DESC) as rank
        FROM user_stats
        WHERE multi_games_played > 0
        ORDER BY multi_total_score DESC
        LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Get multiplayer leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Get user's rank and stats
   */
  async getUserStats(userId) {
    try {
      const result = await pool.query(
        `SELECT 
          us.*,
          (SELECT COUNT(*) + 1 FROM user_stats WHERE total_audiofy_score > us.total_audiofy_score) as global_rank,
          (SELECT COUNT(*) + 1 FROM user_stats WHERE solo_total_score > us.solo_total_score) as solo_rank,
          (SELECT COUNT(*) + 1 FROM user_stats WHERE multi_total_score > us.multi_total_score) as multi_rank
        FROM user_stats us
        WHERE us.user_id = $1`,
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Get user's game history
   */
  async getUserGames(userId, limit = 10) {
    try {
      const result = await pool.query(
        `SELECT * FROM games 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Get user games error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();

