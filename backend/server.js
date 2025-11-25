const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import services
const audioService = require('./services/audioService');
const authService = require('./services/authService');
const { authenticateToken, optionalAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
// Configure allowed origins (support multiple for dev/prod)
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    transports: ['websocket', 'polling']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      console.warn(`   Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Audiofy API is running!' });
});

// ========================================
// AUTH ROUTES
// ========================================

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validation
    if (!email || !password || !username) {
      return res.status(400).json({ 
        error: 'Email, password, and username are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        error: 'Username must be at least 3 characters' 
      });
    }

    const result = await authService.signup(email, password, username);
    
    console.log(`✅ New user registered: ${username} (${email})`);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to create account' 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log(`🔐 Login request received from origin: ${req.get('origin') || 'no origin'}`);
    console.log(`   Headers:`, req.headers);
    
    const { email, password } = req.body;

    console.log(`🔐 Login attempt for email: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const result = await authService.login(email, password);
    
    console.log(`✅ User logged in: ${result.user.username} (${email})`);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(401).json({ 
      error: error.message || 'Invalid credentials' 
    });
  }
});

// Get current user (verify token)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// ========================================
// QUIZ ROUTES
// ========================================

// Get available playlists
app.get('/api/playlists', async (req, res) => {
  try {
    const playlists = audioService.getAvailablePlaylists();
    res.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

// Get Daily Heardle
app.get('/api/heardle/daily', async (req, res) => {
  try {
    // Use user's timezone date if provided, otherwise server date
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const song = await audioService.getDailyHeardle(date);
    res.json(song);
  } catch (error) {
    console.error('Error fetching daily heardle:', error);
    res.status(500).json({ error: 'Failed to fetch daily heardle' });
  }
});

// Search songs (for Heardle guessing)
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    // Call searchItunes with strictMode = false for general search
    const tracks = await audioService.searchItunes(q, 10, false);
    res.json(tracks);
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

// Get a new quiz with iTunes/audio service tracks (auth optional)
app.get('/api/quiz/new', optionalAuth, async (req, res) => {
  try {
    const { playlist, genre } = req.query;
    
    if (!playlist) {
      return res.status(400).json({ 
        error: 'Playlist parameter is required' 
      });
    }
    
    console.log(`🎵 Generating quiz for playlist: ${playlist}`);
    
    // Fetch tracks from playlist
    const tracks = await audioService.getTracksByPlaylist(playlist, 30); // Get 30 for variety
    
    if (tracks.length < 7) {
      return res.status(400).json({ 
        error: `Not enough tracks found for playlist: ${playlist}. Found ${tracks.length}, need at least 7.` 
      });
    }
    
    // Generate quiz questions (7-7 rule: 7 questions, 7 seconds each)
    const questions = audioService.generateQuizQuestions(tracks, 7);
    
    const quizId = Date.now().toString();
    
    // Store questions temporarily BEFORE sending response (in production, use Redis or database)
    global.quizQuestions = global.quizQuestions || {};
    global.quizQuestions[quizId] = questions;
    
    console.log(`✅ Quiz ${quizId} stored with ${questions.length} questions`);
    
    res.json({
      quiz_id: quizId,
      playlist: playlist,
      genre: genre || 'unknown',
      total_questions: questions.length,
      questions: questions.map(q => ({
        id: q.id,
        preview_url: q.preview_url,
        options: q.options,
        correct_answer: q.correct_answer, // Artist name for solo play
        artist: q.artist,
        album: q.album,
        image: q.image,
        genre: q.genre,
        provider: q.provider,
        song_name: q.song_name // Song name for reveal phase
      }))
    });
    
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      details: error.message 
    });
  }
});

// Submit quiz answers (auth optional, but saves to DB if logged in)
app.post('/api/quiz/submit', optionalAuth, async (req, res) => {
  try {
    const { quiz_id, answers, playlist, genre, duration_ms } = req.body;
    
    console.log(`📝 Quiz submission received:`, { quiz_id, answerCount: answers?.length, playlist, genre });
    
    if (!quiz_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    // Get stored questions for this quiz
    const storedQuestions = global.quizQuestions?.[quiz_id];
    if (!storedQuestions) {
      console.error(`❌ Quiz ${quiz_id} not found in stored questions`);
      return res.status(400).json({ error: 'Quiz not found or expired' });
    }
    
    let score = 0;
    const results = [];
    
    // Validate answers against stored correct answers
    for (const answer of answers) {
      const question = storedQuestions.find(q => q.id === answer.question_id);
      const isCorrect = question && answer.selected_answer === question.correct_answer;
      
      console.log(`Question ${answer.question_id}: Selected "${answer.selected_answer}" | Correct: "${question?.correct_answer}" | Match: ${isCorrect}`);
      
      if (isCorrect) {
        score++;
      }
      
      results.push({
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        correct: isCorrect,
        correct_answer: question?.correct_answer || 'Unknown'
      });
    }
    
    const percentage = answers.length > 0 ? Math.round((score / answers.length) * 100) : 0;
    
    console.log(`✅ Quiz scored: ${score}/${answers.length} (${percentage}%)`);
    
    // Save to database if user is logged in
    let savedGame = null;
    console.log(`🔍 Quiz submit - req.user:`, req.user ? `User ID: ${req.user.id}, Username: ${req.user.username}` : 'No user (guest)');
    if (req.user) {
      try {
        // Calculate points (100 per correct answer for solo play)
        const points = score * 100;
        
        console.log(`💾 Attempting to save solo game - User: ${req.user.id}, Points: ${points}, Score: ${score}/${answers.length}, Playlist: ${playlist || genre || 'unknown'}`);
        
        savedGame = await authService.saveGame(
          req.user.id,
          points,
          'solo',
          {
            playlist: playlist || genre || 'unknown',
            correctAnswers: score,
            totalQuestions: answers.length,
            durationMs: duration_ms || 0
          }
        );
        console.log(`✅ Solo game saved successfully for user: ${req.user.username} - Score: ${points} pts (${score}/${answers.length}) - Playlist: ${playlist || genre || 'unknown'}`);
      } catch (dbError) {
        console.error('❌ Failed to save game to database:', dbError);
        console.error('Error details:', dbError.message);
        // Don't fail the request if DB save fails
      }
    } else {
      console.log('⚠️ Quiz submitted by guest user - not saving to database');
    }
    
    // Clean up stored questions after use
    if (global.quizQuestions?.[quiz_id]) {
      delete global.quizQuestions[quiz_id];
    }
    
    res.json({
      quiz_id,
      score,
      total_questions: answers.length,
      percentage,
      results,
      saved: !!savedGame,
      game_id: savedGame?.id
    });
    
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// ========================================
// LEADERBOARD ROUTES
// ========================================

// Get global leaderboard (combined solo + multiplayer)
app.get('/api/leaderboard/global', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const leaderboard = await authService.getGlobalLeaderboard(parseInt(limit));
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching global leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get solo play leaderboard
app.get('/api/leaderboard/solo', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const leaderboard = await authService.getSoloLeaderboard(parseInt(limit));
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching solo leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get multiplayer leaderboard
app.get('/api/leaderboard/multiplayer', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const leaderboard = await authService.getMultiplayerLeaderboard(parseInt(limit));
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching multiplayer leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user's stats and rank (requires auth)
app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await authService.getUserStats(req.user.id);
    res.json(stats || {
      message: 'No stats yet. Play some games to get started!'
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Get user's game history
app.get('/api/user/games', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const games = await authService.getUserGames(
      req.user.id,
      parseInt(limit)
    );
    
    res.json(games);
  } catch (error) {
    console.error('Error fetching user games:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

// Test audio service connection
app.get('/api/audio/test', async (req, res) => {
  try {
    const testResult = await audioService.testConnection();
    res.json(testResult);
  } catch (error) {
    console.error('Audio service test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Audio service connection failed',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========================================
// SOCKET.IO - MULTIPLAYER GAME ROOMS
// ========================================

// In-memory storage for game rooms (use Redis in production)
const gameRooms = new Map();

// Generate 6-digit room code
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Create a new game room
  socket.on('create-room', async ({ username, userId, settings, roomCode: providedRoomCode }) => {
    // Use provided room code or generate a new one
    const roomCode = providedRoomCode || generateRoomCode();
    
    // Check if room already exists
    if (gameRooms.has(roomCode)) {
      console.log(`⚠️ Room ${roomCode} already exists`);
      socket.emit('error', { message: 'Room already exists' });
      return;
    }
    
    const room = {
      code: roomCode,
      host: socket.id,
      players: [{
        id: socket.id,
        username: username || 'Guest',
        userId: userId || null,
        score: 0,
        streak: 0,
        correctAnswers: 0,
        ready: false
      }],
      settings: settings || { genre: 'best-of-gen-z', rounds: 7 },
      gameState: 'waiting', // waiting, playing, finished
      currentRound: 0,
      songs: [],
      roundAnswers: new Map() // Track answers per round
    };

    gameRooms.set(roomCode, room);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    console.log(`🎮 Room ${roomCode} created by ${username}`);
    
    socket.emit('room-created', { roomCode, room });
  });

  // Join existing room
  socket.on('join-room', ({ roomCode, username }) => {
    const room = gameRooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    if (room.gameState !== 'waiting') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    if (room.players.length >= 8) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    // Add player to room
    room.players.push({
      id: socket.id,
      username: username || 'Guest',
      userId: userId || null,
      score: 0,
      streak: 0,
      correctAnswers: 0,
      ready: false
    });

    socket.join(roomCode);
    socket.roomCode = roomCode;

    console.log(`👤 ${username} joined room ${roomCode}`);

    // Notify all players in room
    io.to(roomCode).emit('player-joined', { room });
  });

  // Rejoin existing room (when navigating to room page with new socket connection)
  socket.on('rejoin-room', ({ roomCode, username }) => {
    const room = gameRooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if player already exists in room (by username)
    const existingPlayer = room.players.find(p => p.username === username);
    
    if (existingPlayer) {
      // Update their socket ID
      existingPlayer.id = socket.id;
      
      // If they were the host, update host ID
      if (room.host === existingPlayer.id) {
        room.host = socket.id;
      }
    } else {
      // New player joining
      room.players.push({
        id: socket.id,
        username: username || 'Guest',
        userId: userId || null,
        score: 0,
        streak: 0,
        correctAnswers: 0,
        ready: false
      });
    }

    socket.join(roomCode);
    socket.roomCode = roomCode;

    console.log(`🔄 ${username} rejoined room ${roomCode}`);

    // Send room state to this player
    socket.emit('room-rejoined', { room });
    
    // Notify all other players
    socket.to(roomCode).emit('player-joined', { room });
  });

  // Update room settings (host only)
  socket.on('update-settings', ({ roomCode, settings }) => {
    const room = gameRooms.get(roomCode);
    
    if (!room || room.host !== socket.id) {
      socket.emit('error', { message: 'Not authorized' });
      return;
    }

    room.settings = settings;
    io.to(roomCode).emit('settings-updated', { settings });
  });

  // Start game (host only)
  socket.on('start-game', async ({ roomCode }) => {
    const room = gameRooms.get(roomCode);
    
    if (!room || room.host !== socket.id) {
      socket.emit('error', { message: 'Not authorized' });
      return;
    }

    if (room.players.length < 1) {
      socket.emit('error', { message: 'Need at least 1 player' });
      return;
    }

    try {
      // Fetch songs based on settings
      const tracks = await audioService.getTracksByPlaylist(room.settings.genre, 30);
      room.songs = audioService.generateQuizQuestions(tracks, room.settings.rounds);
      room.gameState = 'playing';
      room.currentRound = 0;

      console.log(`🎵 Game starting in room ${roomCode} with ${room.songs.length} songs`);

      io.to(roomCode).emit('game-started', { 
        totalRounds: room.songs.length,
        settings: room.settings 
      });
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Request next round data
  socket.on('request-round', ({ roomCode, roundIndex }) => {
    const room = gameRooms.get(roomCode);
    
    if (!room || room.gameState !== 'playing') {
      return;
    }

    if (roundIndex >= room.songs.length) {
      // Game over - save games to database
      room.gameState = 'finished';
      const rankings = room.players
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({ ...p, rank: idx + 1 }));
      
      // Save each player's game to database (only for logged-in users)
      const savePromises = rankings.map(async (player, index) => {
        if (player.userId) {
          try {
            await authService.saveGame(
              player.userId,
              player.score,
              'multiplayer',
              {
                playlist: room.settings.genre,
                correctAnswers: player.correctAnswers || 0,
                totalQuestions: room.songs.length,
                roomCode: roomCode,
                placement: index + 1,
                totalPlayers: room.players.length
              }
            );
            console.log(`💾 Multiplayer game saved for user ${player.username}: ${player.score} pts (Rank #${index + 1})`);
          } catch (error) {
            console.error(`Failed to save game for ${player.username}:`, error);
          }
        }
      });

      // Wait for all saves to complete (but don't block the response)
      Promise.all(savePromises).catch(err => console.error('Error saving multiplayer games:', err));
      
      io.to(roomCode).emit('game-over', { rankings });
      return;
    }

    const song = room.songs[roundIndex];
    room.currentRound = roundIndex;
    room.roundAnswers.set(roundIndex, new Map());

    // Send round data to all players
    io.to(roomCode).emit('round-data', {
      roundIndex,
      totalRounds: room.songs.length,
      previewUrl: song.preview_url,
      options: song.options,
      songName: song.song_name,
      artist: song.artist,
      image: song.image,
      correctAnswer: song.correct_answer
    });
  });

  // Submit answer for current round
  socket.on('submit-answer', ({ roomCode, roundIndex, answer, timeRemaining }) => {
    const room = gameRooms.get(roomCode);
    
    if (!room || room.gameState !== 'playing') {
      return;
    }

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const song = room.songs[roundIndex];
    const isCorrect = answer === song.correct_answer;

    // Calculate points (base + time bonus + streak bonus)
    let points = 0;
    if (isCorrect) {
      const basePoints = 250;
      const timeBonus = Math.floor(timeRemaining * 10); // Up to 70 points for 7 seconds
      player.streak++;
      const streakBonus = player.streak > 1 ? (player.streak - 1) * 50 : 0;
      
      points = basePoints + timeBonus + streakBonus;
      player.score += points;
      
      // Track correct answers for database
      player.correctAnswers = (player.correctAnswers || 0) + 1;
    } else {
      player.streak = 0;
    }

    // Store answer
    const roundAnswers = room.roundAnswers.get(roundIndex);
    roundAnswers.set(socket.id, {
      answer,
      isCorrect,
      points,
      timeRemaining
    });

    console.log(`📝 ${player.username} answered round ${roundIndex}: ${isCorrect ? '✅' : '❌'} (+${points} pts)`);

    // Notify player of their result
    socket.emit('answer-result', {
      isCorrect,
      points,
      streak: player.streak,
      totalScore: player.score
    });

    // Broadcast updated scores to all players
    io.to(roomCode).emit('scores-updated', {
      players: room.players.map(p => ({
        id: p.id,
        username: p.username,
        score: p.score,
        streak: p.streak
      }))
    });
  });

  // Leave room
  socket.on('leave-room', () => {
    if (socket.roomCode) {
      const room = gameRooms.get(socket.roomCode);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        // If host left, assign new host or delete room
        if (room.host === socket.id) {
          if (room.players.length > 0) {
            room.host = room.players[0].id;
            io.to(socket.roomCode).emit('host-changed', { newHostId: room.host });
          } else {
            gameRooms.delete(socket.roomCode);
            console.log(`🗑️ Room ${socket.roomCode} deleted (empty)`);
          }
        }

        io.to(socket.roomCode).emit('player-left', { room });
      }
      socket.leave(socket.roomCode);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    if (socket.roomCode) {
      const room = gameRooms.get(socket.roomCode);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.host === socket.id) {
          if (room.players.length > 0) {
            room.host = room.players[0].id;
            io.to(socket.roomCode).emit('host-changed', { newHostId: room.host });
          } else {
            gameRooms.delete(socket.roomCode);
            console.log(`🗑️ Room ${socket.roomCode} deleted (empty)`);
          }
        }

        io.to(socket.roomCode).emit('player-left', { room });
      }
    }
  });
});

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    const pool = require('./db');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log(`   Current time: ${result.rows[0].current_time}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Make sure DATABASE_URL is set correctly in environment variables');
  }
}

server.listen(PORT, async () => {
  console.log(`🚀 Audiofy Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('✅ Routes loaded: /api/heardle/daily, /api/search');
  console.log('🎮 Socket.IO multiplayer enabled');
  
  // Test database connection
  await testDatabaseConnection();
}); 