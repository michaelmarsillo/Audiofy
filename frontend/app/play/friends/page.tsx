'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';

export default function FriendsLobby() {
  const router = useRouter();
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get username from AuthContext (logged in user)
    if (user?.username) {
      setUsername(user.username);
    } else {
      // Fallback: try localStorage
      const storedUser = localStorage.getItem('audiofy_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUsername(userData.username || 'Guest_' + Math.floor(Math.random() * 1000));
        } catch {
          setUsername('Guest_' + Math.floor(Math.random() * 1000));
        }
      } else {
        setUsername('Guest_' + Math.floor(Math.random() * 1000));
      }
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server');
    });

    newSocket.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleCreateRoom = () => {
    if (!socket) return;

    // Generate a room code and navigate to the room page
    // The room page will handle the actual room creation
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('🎮 Navigating to create room:', roomCode);
    sessionStorage.setItem('createRoom', 'true');
    sessionStorage.setItem('roomCreator', username);
    
    router.push(`/play/friends/room?code=${roomCode}`);
  };

  const handleJoinRoom = () => {
    if (!socket || !roomCode) return;

    socket.emit('join-room', { roomCode: roomCode.toUpperCase(), username });

    socket.once('player-joined', () => {
      console.log('✅ Joined room:', roomCode);
      router.push(`/play/friends/room?code=${roomCode.toUpperCase()}`);
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white p-8">
      {/* Vibrant background gradient (same as about page) */}
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--music-pink)] rounded-full blur-[150px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <Link 
            href="/play"
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </Link>

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Play with Friends
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">
              Playing as: <span className="text-[var(--text-primary)] font-semibold">{username}</span>
            </p>
          </div>

          <div className="w-20"></div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Main Options */}
        <div className="max-w-2xl mx-auto space-y-6">
        {/* Create Room */}
        <button
          onClick={handleCreateRoom}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                     text-white font-bold py-8 px-8 rounded-2xl transition-all duration-300 
                     transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50
                     flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold">Create Room</div>
              <div className="text-sm text-white/80">Host a new multiplayer game</div>
            </div>
          </div>
          <svg className="w-8 h-8 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Join Room */}
        <button
          onClick={() => setShowJoinModal(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 
                     text-white font-bold py-8 px-8 rounded-2xl transition-all duration-300 
                     transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50
                     flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold">Join with Code</div>
              <div className="text-sm text-white/80">Enter a friend&apos;s room code</div>
            </div>
          </div>
          <svg className="w-8 h-8 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

        {/* Join Room Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 max-w-md w-full border border-[var(--bg-accent)] shadow-2xl">
              <h2 className="text-3xl font-bold mb-6 text-center text-[var(--text-primary)]">Enter Room Code</h2>
              
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-[var(--bg-primary)] border-2 border-[var(--bg-accent)] rounded-xl px-6 py-4 text-3xl 
                         text-center font-bold tracking-widest focus:outline-none focus:border-blue-500 
                         transition-colors mb-6 text-[var(--text-primary)]"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setRoomCode('');
                  }}
                  className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-accent)] text-white font-bold py-3 px-6 
                           rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={roomCode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 
                           hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="max-w-2xl mx-auto mt-12 p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-accent)]">
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-[var(--text-primary)]">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How it works
          </h3>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">1.</span>
              <span>Create a room or join with a friend&apos;s code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">2.</span>
              <span>Wait for players to join (up to 8 players)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">3.</span>
              <span>Host selects genre and starts the game</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">4.</span>
              <span>Compete in 7 rounds - guess the artist!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">5.</span>
              <span>Earn points for correct answers and streaks</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
