'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useVolume } from '@/components/VolumeControl';
import { ensureAudioUnlocked } from '@/utils/audioUnlock';
import { io, Socket } from 'socket.io-client';
import Image from 'next/image';

// Circular Timer Component with smooth animations (from Arcade)
function CircularTimer({ 
  timer, 
  maxTime, 
  size = 200, 
  strokeWidth = 8, 
  color = '#fbbf24' 
}: { 
  timer: number; 
  maxTime: number; 
  size?: number; 
  strokeWidth?: number; 
  color?: string;
}) {
  const [smoothProgress, setSmoothProgress] = useState(1);
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Smooth progress animation (60fps)
  useEffect(() => {
    if (timer <= 0) {
      setSmoothProgress(0);
      return;
    }

    startTimeRef.current = Date.now();
    setSmoothProgress(1);

    const animate = () => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const progress = Math.max(0, 1 - elapsed / 1000);
      
      setSmoothProgress(progress);

      if (progress > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [timer]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressValue = ((timer - 1 + smoothProgress) / maxTime);
  const offset = circumference - (progressValue * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl font-bold">{timer}</span>
      </div>
    </div>
  );
}

type GamePhase = 'waiting' | 'countdown' | 'listening' | 'reveal' | 'intermission' | 'gameover';

interface Player {
  id: string;
  username: string;
  score: number;
  streak: number;
}

interface RoundData {
  roundIndex: number;
  totalRounds: number;
  previewUrl: string;
  options: string[];
  songName: string;
  artist: string;
  image: string;
  correctAnswer: string;
}

function MultiplayerRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('code');
  const { user } = useAuth();
  const { siteVolume } = useVolume();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState({ genre: 'best-of-gen-z', rounds: 7 });
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Game state
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(7);
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  interface AnswerResult {
    correct: boolean;
    isCorrect: boolean;
    points: number;
    message?: string;
  }
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [roundHistory, setRoundHistory] = useState<boolean[]>([]);
  const [timer, setTimer] = useState(0);
  const [rankings, setRankings] = useState<Player[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Genre options (only available playlists)
  const genreOptions = [
    { value: 'best-of-gen-z', label: 'Gen-Z Hip-Hop' },
    { value: '80s-hits', label: '80s Hits' },
    { value: '90s-hits', label: '90s Hits' }
  ];

  useEffect(() => {
    if (!roomCode) {
      router.push('/play/friends');
      return;
    }

    // Get username from AuthContext or localStorage
    let username = user?.username || 'Guest';
    if (!user) {
      try {
        const storedUser = localStorage.getItem('audiofy_user');
        if (storedUser) {
          username = JSON.parse(storedUser).username || 'Guest';
        }
      } catch (e) {
        console.error('Error getting username:', e);
      }
    }

    // Initialize socket with environment-aware URL
    const getSocketUrl = () => {
      if (typeof window === 'undefined') return 'http://localhost:5000';
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    };

    const newSocket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server, socket ID:', newSocket.id);
      
      // Check if we're creating a new room
      const shouldCreateRoom = sessionStorage.getItem('createRoom') === 'true';
      const roomCreator = sessionStorage.getItem('roomCreator');
      
      if (shouldCreateRoom && roomCreator) {
        // We're creating a new room
        console.log('🎮 Creating new room:', roomCode);
        sessionStorage.removeItem('createRoom');
        sessionStorage.removeItem('roomCreator');
        
        newSocket.emit('create-room', { 
          username: roomCreator,
          userId: user?.id || null,
          settings: { genre: 'best-of-gen-z', rounds: 7 },
          roomCode: roomCode // Pass the room code we want to use
        });
      } else {
        // We're joining an existing room
        console.log('🔄 Joining existing room:', roomCode);
        newSocket.emit('rejoin-room', { 
          roomCode, 
          username,
          userId: user?.id || null
        });
      }
    });

    // Room events
    newSocket.on('room-created', ({ room }) => {
      console.log('Room created event received:', room);
      setPlayers(room.players);
      setIsHost(true);
      setSettings(room.settings);
    });

    newSocket.on('room-rejoined', ({ room }) => {
      console.log('Room rejoined event received:', room);
      setPlayers(room.players);
      setIsHost(room.host === newSocket.id);
      setSettings(room.settings);
    });

    newSocket.on('player-joined', ({ room }) => {
      console.log('Player joined event received:', room);
      setPlayers(room.players);
    });

    newSocket.on('player-left', ({ room }) => {
      setPlayers(room.players);
    });

    newSocket.on('host-changed', ({ newHostId }) => {
      setIsHost(newSocket.id === newHostId);
    });

    newSocket.on('settings-updated', ({ settings: newSettings }) => {
      setSettings(newSettings);
    });

    // Game events
    newSocket.on('game-started', ({ totalRounds: total }) => {
      setTotalRounds(total);
      setPhase('countdown');
      setTimer(5);
      setCurrentRound(0);
      setRoundHistory([]);
    });

    newSocket.on('round-data', (data: RoundData) => {
      setRoundData(data);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnswerResult(null);
    });

    newSocket.on('answer-result', (result) => {
      setAnswerResult(result);
      setHasAnswered(true);
      setRoundHistory(prev => [...prev, result.isCorrect]);
    });

    newSocket.on('scores-updated', ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on('game-over', ({ rankings: finalRankings }) => {
      setRankings(finalRankings);
      setPhase('gameover');
      if (audioRef.current) {
        audioRef.current.pause();
      }
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data.message);
      alert(data.message);
    });

    setSocket(newSocket);

    return () => {
      const timer = timerRef.current;
      if (timer) clearInterval(timer);
      if (audioRef.current) audioRef.current.pause();
      newSocket.emit('leave-room');
      newSocket.close();
    };
  }, [roomCode, router, user]);

  const handlePhaseTransition = useCallback(() => {
    if (!socket) return;

    switch (phase) {
      case 'countdown':
        // Start listening phase
        setPhase('listening');
        setTimer(7);
        socket.emit('request-round', { roomCode, roundIndex: currentRound });
        break;

      case 'listening':
        // Move to reveal (keep audio playing!)
        setPhase('reveal');
        setTimer(5);
        // Don't pause audio - let it keep playing during reveal
        break;

      case 'reveal':
        // Move to intermission and pause audio
        setPhase('intermission');
        setTimer(5);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        break;

      case 'intermission':
        // Move to next round
        const nextRound = currentRound + 1;
        
        // Check if game is over
        if (nextRound >= totalRounds) {
          // Request game over from server
          socket.emit('request-round', { roomCode, roundIndex: nextRound });
          return;
        }
        
        // Start next round
        setCurrentRound(nextRound);
        setPhase('countdown');
        setTimer(5);
        // Audio already paused from reveal phase
        break;

      default:
        break;
    }
  }, [socket, phase, roomCode, currentRound, totalRounds]);

  // Game timer logic (clean version like Arcade)
  useEffect(() => {
    if (phase === 'waiting' || phase === 'gameover') return;

    let interval: NodeJS.Timeout;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handlePhaseTransition();
    }

    return () => clearInterval(interval);
  }, [timer, phase, handlePhaseTransition]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = siteVolume;
    }
  }, [siteVolume]);

  // Play audio when round data is received
  useEffect(() => {
    if (phase === 'listening' && roundData?.previewUrl) {
      // Properly clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      
      // Create and play new audio
      const audio = new Audio(roundData.previewUrl);
      audio.volume = siteVolume;
      audioRef.current = audio;
      
      // Ensure audio is unlocked before playing (iOS Safari fix)
      // This works on both desktop and mobile
      ensureAudioUnlocked(audio).then(() => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error('Audio play error:', err);
          });
        }
      });
    }
  }, [phase, roundData, siteVolume]);

  const handleStartGame = () => {
    if (!socket || !isHost) return;
    socket.emit('start-game', { roomCode });
  };

  const handleUpdateSettings = (newGenre: string) => {
    if (!socket || !isHost) return;
    const newSettings = { ...settings, genre: newGenre };
    setSettings(newSettings);
    socket.emit('update-settings', { roomCode, settings: newSettings });
    setShowSettings(false);
  };

  const handleAnswerSelect = (answer: string) => {
    if (!socket || hasAnswered || phase !== 'listening') return;
    
    setSelectedAnswer(answer);
    socket.emit('submit-answer', {
      roomCode,
      roundIndex: currentRound,
      answer,
      timeRemaining: timer
    });
  };

  const handleCopyCode = () => {
    const url = `${window.location.origin}/play/friends/room?code=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave-room');
    }
    router.push('/play/friends');
  };

  // Waiting Room UI
  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-white p-4 sm:p-8">
        {/* Vibrant background gradient */}
        <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--music-pink)] rounded-full blur-[150px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Leave</span>
            </button>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Waiting Room</h1>
            <div className="w-20"></div>
          </header>

          {/* Room Code */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-[var(--bg-secondary)] backdrop-blur-md rounded-2xl p-6 border border-[var(--bg-accent)]">
              <div className="text-center mb-4">
                <p className="text-[var(--text-secondary)] mb-2">Room Code</p>
                <div className="text-6xl font-bold tracking-widest mb-4 text-[var(--text-primary)]">{roomCode}</div>
                <button
                  onClick={handleCopyCode}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105"
                >
                  {copied ? 'Copied!' : 'Share Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Players List */}
          <div className="max-w-4xl mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Players ({players.length}/8)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className="bg-[var(--bg-secondary)] backdrop-blur-md rounded-xl p-4 border border-[var(--bg-accent)] flex items-center gap-3"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold">
                    {player.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[var(--text-primary)]">{player.username}</div>
                    {player.id === socket?.id && <span className="text-xs text-purple-400">(You)</span>}
                    {idx === 0 && <span className="text-xs text-yellow-400 ml-2">👑 Host</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings & Start */}
          {isHost && (
            <div className="max-w-4xl mx-auto space-y-4">
              <button
                onClick={() => setShowSettings(true)}
                className="w-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] text-white font-bold py-4 px-6 rounded-xl transition-colors"
              >
                Settings: {genreOptions.find(g => g.value === settings.genre)?.label || 'Gen-Z Hip-Hop'}
              </button>
              <button
                onClick={handleStartGame}
                disabled={players.length < 1}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                         text-white font-bold py-6 px-6 rounded-xl transition-all transform hover:scale-105
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-2xl shadow-lg shadow-green-500/30"
              >
                Start Game
              </button>
            </div>
          )}

          {!isHost && (
            <div className="max-w-4xl mx-auto text-center text-[var(--text-secondary)]">
              <p>Waiting for host to start the game...</p>
            </div>
          )}

          {/* Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 max-w-md w-full border border-[var(--bg-accent)]">
                <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">Game Settings</h2>
                <div className="space-y-3">
                  {genreOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleUpdateSettings(option.value)}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                        settings.genre === option.value
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-accent)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-6 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-accent)] text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game Over UI
  if (phase === 'gameover') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-white p-4 sm:p-8 flex items-center justify-center">
        {/* Vibrant background gradient */}
        <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--music-pink)] rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl w-full">
          <h1 className="text-6xl font-bold text-center mb-12 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Game Over!
          </h1>

          {/* Top 3 Podium */}
          <div className="flex items-end justify-center gap-4 mb-12">
            {rankings.slice(0, 3).map((player, idx) => {
              const heights = ['h-48', 'h-64', 'h-40'];
              const colors = ['from-gray-400 to-gray-600', 'from-yellow-400 to-yellow-600', 'from-orange-400 to-orange-600'];
              const positions = [1, 0, 2];
              const actualIdx = positions[idx];
              const actualPlayer = rankings[actualIdx];
              
              if (!actualPlayer) return null;

              return (
                <div key={actualPlayer.id} className={`flex-1 max-w-xs ${heights[actualIdx]} bg-gradient-to-br ${colors[actualIdx]} rounded-t-2xl flex flex-col items-center justify-center p-4 relative`}>
                  <div className="absolute -top-8 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white">
                    {actualPlayer.username[0].toUpperCase()}
                  </div>
                  <div className="text-4xl font-bold mb-2">#{actualIdx + 1}</div>
                  <div className="text-xl font-semibold mb-1">{actualPlayer.username}</div>
                  <div className="text-3xl font-bold">{actualPlayer.score}</div>
                  <div className="text-sm text-white/80">points</div>
                </div>
              );
            })}
          </div>

          {/* Full Rankings */}
          <div className="bg-[var(--bg-secondary)] backdrop-blur-md rounded-2xl p-6 border border-[var(--bg-accent)] mb-8">
            <h2 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Final Scores</h2>
            <div className="space-y-2">
              {rankings.map((player, idx) => (
                <div
                  key={player.id}
                  className="flex items-center gap-4 bg-[var(--bg-tertiary)] rounded-lg p-3"
                >
                  <div className="text-2xl font-bold w-8 text-[var(--text-primary)]">{idx + 1}</div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold">
                    {player.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 font-semibold text-[var(--text-primary)]">{player.username}</div>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{player.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleLeaveRoom}
              className="flex-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] text-white font-bold py-4 px-6 rounded-xl transition-colors"
            >
              Leave Room
            </button>
            {isHost && (
              <button
                onClick={handleStartGame}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                         text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-green-500/30"
              >
                Play Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Countdown Phase
  if (phase === 'countdown') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-white flex items-center justify-center p-4">
        {/* Vibrant background gradient */}
        <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--music-pink)] rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10 text-center flex flex-col items-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-[var(--text-primary)]">Round {currentRound + 1}/{totalRounds}</h2>
          <CircularTimer timer={timer} maxTime={5} size={200} color="#fbbf24" />
          <p className="text-xl text-[var(--text-secondary)] mt-8">Get ready...</p>
        </div>

        {/* Players Sidebar */}
        <div className="fixed left-4 top-4 bg-[var(--bg-secondary)] backdrop-blur-md rounded-xl p-4 border border-[var(--bg-accent)] max-w-xs z-20">
          <h3 className="font-bold mb-3 text-[var(--text-primary)]">Players</h3>
          <div className="space-y-2">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <span className="truncate">{player.username}</span>
                <span className="font-bold ml-2 text-[var(--text-primary)]">{player.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Listening Phase
  if (phase === 'listening' && roundData) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-white p-4">
        {/* Vibrant background gradient */}
        <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--music-pink)] rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10">
          {/* Round Indicators */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {Array.from({ length: totalRounds }).map((_, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                  idx < currentRound
                    ? roundHistory[idx]
                      ? 'bg-green-500 border-green-400'
                      : 'bg-red-500 border-red-400'
                    : idx === currentRound
                    ? 'bg-blue-500 border-blue-400 animate-pulse'
                    : 'bg-[var(--bg-tertiary)] border-[var(--bg-accent)]'
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Timer */}
          <div className="flex justify-center mb-8">
            <CircularTimer timer={timer} maxTime={7} size={150} color="#3b82f6" />
          </div>

          {/* Question */}
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-[var(--text-primary)]">Who is the artist?</h2>

          {/* Answer Result */}
          {hasAnswered && answerResult && (
            <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-xl text-center font-bold text-xl ${
              answerResult.isCorrect ? 'bg-green-500/20 border-2 border-green-500' : 'bg-red-500/20 border-2 border-red-500'
            }`}>
              {answerResult.isCorrect ? 'Awesome!' : 'Wrong'}
              <div className="text-sm mt-1">+{answerResult.points} points</div>
            </div>
          )}

          {/* Options */}
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {roundData.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(option)}
                disabled={hasAnswered}
                className={`py-6 px-6 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                  selectedAnswer === option
                    ? answerResult?.isCorrect
                      ? 'bg-green-600 border-2 border-green-400'
                      : 'bg-red-600 border-2 border-red-400'
                    : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border-2 border-[var(--bg-accent)]'
                } ${hasAnswered ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Players Sidebar */}
          <div className="fixed left-4 top-4 bg-[var(--bg-secondary)] backdrop-blur-md rounded-xl p-4 border border-[var(--bg-accent)] max-w-xs z-20">
            <h3 className="font-bold mb-3 text-[var(--text-primary)]">Scores</h3>
            <div className="space-y-2">
              {players.map(player => (
                <div key={player.id} className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{player.username}</span>
                    {player.streak > 1 && <span className="text-xs text-orange-400">🔥{player.streak}</span>}
                  </div>
                  <span className="font-bold ml-2 text-[var(--text-primary)]">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reveal Phase
  if (phase === 'reveal' && roundData) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-white p-4 flex items-center justify-center">
        {/* Vibrant background gradient */}
        <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--music-pink)] rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10 max-w-2xl w-full">
          {/* Round Indicators */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {Array.from({ length: totalRounds }).map((_, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                  idx < currentRound
                    ? roundHistory[idx]
                      ? 'bg-green-500 border-green-400'
                      : 'bg-red-500 border-red-400'
                    : idx === currentRound
                    ? answerResult?.isCorrect
                      ? 'bg-green-500 border-green-400'
                      : 'bg-red-500 border-red-400'
                    : 'bg-[var(--bg-tertiary)] border-[var(--bg-accent)]'
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-center mb-8 text-[var(--text-primary)]">
            {answerResult?.isCorrect ? 'Awesome!' : 'The answer was:'}
          </h1>

          {/* Album Art */}
          {roundData.image && (
            <div className="flex justify-center mb-6">
              <Image
                src={roundData.image}
                alt={roundData.songName}
                width={200}
                height={200}
                className="rounded-xl shadow-2xl"
              />
            </div>
          )}

          {/* Song Info */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">{roundData.songName}</h2>
            <p className="text-2xl text-[var(--text-secondary)]">{roundData.artist}</p>
          </div>

          {/* Timer - Centered */}
          <div className="flex justify-center items-center">
            <CircularTimer timer={timer} maxTime={5} size={120} color="#fbbf24" />
          </div>
        </div>

        {/* Players Sidebar */}
        <div className="fixed left-4 top-4 bg-[var(--bg-secondary)] backdrop-blur-md rounded-xl p-4 border border-[var(--bg-accent)] max-w-xs z-20">
          <h3 className="font-bold mb-3 text-[var(--text-primary)]">Scores</h3>
          <div className="space-y-2">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <span className="truncate">{player.username}</span>
                  {player.streak > 1 && <span className="text-xs text-orange-400">🔥{player.streak}</span>}
                </div>
                <span className="font-bold ml-2 text-[var(--text-primary)]">{player.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Intermission Phase
  if (phase === 'intermission') {
    // Find current player
    const currentPlayer = players.find(p => p.id === socket?.id);
    const basePoints = 250;
    const streakBonus = currentPlayer && currentPlayer.streak > 0 ? currentPlayer.streak * 50 : 0;
    
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-white flex items-center justify-center p-4">
        {/* Vibrant background gradient */}
        <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--music-pink)] rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10 text-center max-w-2xl w-full px-4">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-[var(--text-primary)]">Next Round Starting...</h2>
          
          {/* Centered Timer */}
          <div className="flex justify-center mb-8">
            <CircularTimer timer={timer} maxTime={5} size={200} color="#10b981" />
          </div>
          
          {/* Current Player Stats */}
          {currentPlayer && (
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--bg-accent)]">
              <h3 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Your Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Current Score</p>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">{currentPlayer.score}</p>
                </div>
                <div className="bg-[var(--bg-tertiary)] rounded-xl p-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-400">{currentPlayer.streak > 0 ? `🔥 ${currentPlayer.streak}` : '0'}</p>
                </div>
              </div>
              
              {/* Next Round Bonus */}
              <div className="mt-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-4">
                <p className="text-sm text-[var(--text-secondary)] mb-2">Next Round Potential</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)]">Base</p>
                    <p className="text-xl font-bold text-green-400">{basePoints}</p>
                  </div>
                  <span className="text-2xl text-[var(--text-secondary)]">+</span>
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)]">Time Bonus</p>
                    <p className="text-xl font-bold text-blue-400">up to 70</p>
                  </div>
                  {streakBonus > 0 && (
                    <>
                      <span className="text-2xl text-[var(--text-secondary)]">+</span>
                      <div className="text-center">
                        <p className="text-xs text-[var(--text-muted)]">Streak Bonus</p>
                        <p className="text-xl font-bold text-orange-400">{streakBonus}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Players Sidebar */}
        <div className="fixed left-4 top-4 bg-[var(--bg-secondary)] backdrop-blur-md rounded-xl p-4 border border-[var(--bg-accent)] max-w-xs z-20">
          <h3 className="font-bold mb-3 text-[var(--text-primary)]">Scores</h3>
          <div className="space-y-2">
            {players.map(player => (
              <div key={player.id} className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <span className="truncate">{player.username}</span>
                  {player.streak > 1 && <span className="text-xs text-orange-400">🔥{player.streak}</span>}
                </div>
                <span className="font-bold ml-2 text-[var(--text-primary)]">{player.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function MultiplayerRoom() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    }>
      <MultiplayerRoomContent />
    </Suspense>
  );
}

