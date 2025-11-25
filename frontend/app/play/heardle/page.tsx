'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useVolume } from '@/components/VolumeControl';

// Constants
const UNLOCK_SECONDS = [1, 2, 4, 7, 11, 16];
const TOTAL_DURATION = 16;
const TOTAL_ATTEMPTS = 6;

interface Song {
  id: number;
  name: string;
  artist: string;
  album: string;
  image: string;
  preview_url: string;
}

interface GameState {
  date: string;
  guesses: { answer: string; status: 'skipped' | 'wrong' | 'correct' | 'empty' }[];
  currentAttempt: number;
  gameStatus: 'playing' | 'won' | 'lost';
  unlockedIndex: number;
}

export default function HeardlePage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { siteVolume } = useVolume();
  
  // Game State
  const [dailySong, setDailySong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // User Progress
  const [guesses, setGuesses] = useState<{ answer: string; status: 'skipped' | 'wrong' | 'correct' | 'empty' }[]>(
    Array(TOTAL_ATTEMPTS).fill({ answer: '', status: 'empty' })
  );
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [unlockedIndex, setUnlockedIndex] = useState(0); // 0 = 1s, 1 = 2s, etc.
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [nextHeardleTime, setNextHeardleTime] = useState<string>('');

  // Initialize Game
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Load persisted state
    const savedState = localStorage.getItem(`audiofy_heardle_${today}`);
    if (savedState) {
      const parsed: GameState = JSON.parse(savedState);
      setGuesses(parsed.guesses);
      setCurrentAttempt(parsed.currentAttempt);
      setGameStatus(parsed.gameStatus);
      setUnlockedIndex(parsed.unlockedIndex);
    }

    // Fetch Daily Song
    fetch(`/api/heardle/daily?date=${today}`)
      .then(res => res.json())
      .then(data => {
        setDailySong(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch daily heardle', err);
        setLoading(false);
      });

    // Update countdown
    const timer = setInterval(updateNextHeardleTimer, 1000);
    updateNextHeardleTimer();
    
    return () => clearInterval(timer);
  }, []);

  // Persist State on Change
  useEffect(() => {
    if (!dailySong) return;
    const today = new Date().toISOString().split('T')[0];
    const state: GameState = {
      date: today,
      guesses,
      currentAttempt,
      gameStatus,
      unlockedIndex
    };
    localStorage.setItem(`audiofy_heardle_${today}`, JSON.stringify(state));
  }, [guesses, currentAttempt, gameStatus, unlockedIndex, dailySong]);

  // Audio Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Sync Volume
    audio.volume = siteVolume;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error: unknown) => {
          // Gracefully handle aborts
          if ((error as Error).name !== 'AbortError') {
            console.error("Play error:", error);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, siteVolume]);

  // Update audio volume when siteVolume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = siteVolume;
    }
  }, [siteVolume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      setCurrentTime(curr);
      
      // Stop if we exceed unlocked time
      const maxTime = UNLOCK_SECONDS[unlockedIndex];
      if (curr >= maxTime) {
        // Instead of pausing directly, update state to trigger effect
        setIsPlaying(false);
        
        // Reset time for next play
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If we are already at the end or past, reset to 0 before playing
      if (audioRef.current.currentTime >= UNLOCK_SECONDS[unlockedIndex]) {
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(true);
    }
  };

  // Search Logic
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    if (selectedSong && `${selectedSong.artist} - ${selectedSong.name}` === searchQuery) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
          setIsSearching(false);
          setShowDropdown(true);
        })
        .catch(err => {
          console.error(err);
          setIsSearching(false);
        });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedSong]);

  // Gameplay Actions
  const handleSkip = () => {
    if (gameStatus !== 'playing') return;

    const newGuesses = [...guesses];
    newGuesses[currentAttempt] = { answer: 'Skipped', status: 'skipped' };
    setGuesses(newGuesses);

    const nextAttempt = currentAttempt + 1;
    setCurrentAttempt(nextAttempt);

    if (nextAttempt >= TOTAL_ATTEMPTS) {
      setGameStatus('lost');
      setUnlockedIndex(UNLOCK_SECONDS.length - 1); // Reveal all
    } else {
      setUnlockedIndex(Math.min(unlockedIndex + 1, UNLOCK_SECONDS.length - 1));
    }
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setSearchQuery(`${song.artist} - ${song.name}`);
    setShowDropdown(false);
  };

  const handleSubmit = () => {
    if (gameStatus !== 'playing' || !selectedSong) return;

    const song = selectedSong;
    const isCorrect = dailySong && 
      (song.id === dailySong.id || 
       (song.name.toLowerCase() === dailySong.name.toLowerCase() && 
        song.artist.toLowerCase() === dailySong.artist.toLowerCase()));

    const newGuesses = [...guesses];
    newGuesses[currentAttempt] = { 
      answer: `${song.artist} - ${song.name}`, 
      status: isCorrect ? 'correct' : 'wrong' 
    };
    setGuesses(newGuesses);

    if (isCorrect) {
      setGameStatus('won');
      setUnlockedIndex(UNLOCK_SECONDS.length - 1); // Reveal all
    } else {
      const nextAttempt = currentAttempt + 1;
      setCurrentAttempt(nextAttempt);
      
      if (nextAttempt >= TOTAL_ATTEMPTS) {
        setGameStatus('lost');
        setUnlockedIndex(UNLOCK_SECONDS.length - 1); // Reveal all
      } else {
        setUnlockedIndex(Math.min(unlockedIndex + 1, UNLOCK_SECONDS.length - 1));
      }
    }
    
    setSelectedSong(null);
    setSearchQuery('');
  };

  const updateNextHeardleTimer = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setNextHeardleTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20 relative overflow-hidden">
      {/* Vibrant background gradient */}
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--music-green)] rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-blue)] rounded-full blur-[150px]"></div>
      </div>

      {/* Audio Element */}
      {dailySong && (
        <audio
          ref={audioRef}
          src={dailySong.preview_url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 max-w-4xl mx-auto">
        <Link 
          href="/play" 
          className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--bg-accent)] transition-all"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </Link>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--music-green)] to-[#059669] rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
            </svg>
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] lowercase tracking-wide">heardle</h1>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="relative z-10 max-w-2xl mx-auto p-4 flex flex-col gap-6 mt-4">
        
        {/* Status Message */}
        {gameStatus === 'playing' && (
          <div className="text-center text-sm text-[var(--text-secondary)] lowercase bg-[var(--bg-secondary)]/50 py-2 px-4 rounded-full border border-[var(--bg-accent)] self-center backdrop-blur-sm">
            guess the song in <span className="text-[var(--accent-primary)] font-bold">{TOTAL_ATTEMPTS}</span> attempts
          </div>
        )}

        {/* Guesses Grid */}
        <div className="flex flex-col gap-2">
          {guesses.map((guess, i) => (
            <div 
              key={i}
              className={`h-12 w-full border rounded-xl flex items-center px-4 text-sm transition-all duration-300 lowercase font-medium
                ${guess.status === 'empty' ? 'bg-[var(--bg-secondary)]/30 border-[var(--bg-accent)] text-transparent' : ''}
                ${guess.status === 'skipped' ? 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--bg-accent)]' : ''}
                ${guess.status === 'wrong' ? 'bg-red-500/10 text-red-200 border-red-500/30' : ''}
                ${guess.status === 'correct' ? 'bg-green-500/10 text-green-200 border-green-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : ''}
              `}
            >
              {guess.answer}
            </div>
          ))}
        </div>

        {/* Game Over / Success Modal Overlay */}
        {(gameStatus === 'won' || gameStatus === 'lost') && dailySong && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 max-w-sm w-full border border-[var(--bg-accent)] shadow-2xl relative animate-[scaleIn_0.3s_ease-out] overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[var(--accent-primary)]/20 blur-[50px]"></div>

              <button 
                onClick={() => router.push('/play')}
                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center relative z-10">
                <div className="relative w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden shadow-2xl border-2 border-[var(--bg-accent)] group">
                  <Image 
                    src={dailySong.image} 
                    alt={dailySong.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                <h2 className="text-2xl font-bold mb-2 lowercase text-[var(--text-primary)]">
                  {gameStatus === 'won' ? 'you got it!' : 'better luck next time'}
                </h2>
                
                <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 mb-6 border border-[var(--bg-accent)]">
                  <p className="text-lg font-bold text-[var(--text-primary)] mb-1 lowercase">{dailySong.artist}</p>
                  <p className="text-[var(--text-secondary)] lowercase">{dailySong.name}</p>
                </div>

                <div className="border-t border-[var(--bg-accent)] pt-6">
                  <p className="text-sm text-[var(--text-muted)] mb-2 lowercase">next heardle in</p>
                  <p className="text-3xl font-mono font-bold tracking-widest text-[var(--music-green)] glow-green">
                    {nextHeardleTime}
                  </p>
                </div>

                <button
                  onClick={() => router.push('/play')}
                  className="mt-6 w-full py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(88,101,242,0.4)] lowercase"
                >
                  back to games
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Player Controls */}
        <div className="mt-auto bg-[var(--bg-secondary)]/60 backdrop-blur-md rounded-2xl p-6 border border-[var(--bg-accent)] shadow-xl">
          {/* Progress Bar */}
          <div className="relative h-4 mb-6 select-none cursor-pointer group" onClick={(e) => {
             // Seeking logic can be added here
          }}>
            <div className="absolute inset-0 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--bg-accent)]">
              {/* Unlocked Sections Background */}
              {UNLOCK_SECONDS.map((sec, i) => (
                <div 
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-[var(--bg-primary)] z-10 pointer-events-none opacity-30"
                  style={{ left: `${(sec / TOTAL_DURATION) * 100}%` }}
                />
              ))}
              
              {/* Current Progress */}
              <div 
                className="absolute top-0 left-0 h-full bg-[var(--music-green)] transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
              />
              
              {/* Unlocked Limit Marker */}
              <div 
                className="absolute top-0 left-0 h-full border-r-2 border-[var(--text-primary)] z-20 transition-all duration-300 box-content"
                style={{ width: `${(UNLOCK_SECONDS[unlockedIndex] / TOTAL_DURATION) * 100}%` }}
              />
            </div>
          </div>

          {/* Time & Play Button */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-mono text-[var(--text-muted)] w-12">00:00</span>
            
            <button 
              onClick={togglePlay}
              className="w-16 h-16 flex items-center justify-center bg-[var(--text-primary)] rounded-full text-[var(--bg-primary)] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            <span className="text-sm font-mono text-[var(--text-muted)] w-12 text-right">00:16</span>
          </div>

          {/* Input / Skip */}
          {gameStatus === 'playing' && (
            <div className="space-y-3 relative">
              <div className="relative z-20">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all lowercase shadow-inner"
                    placeholder={currentAttempt === TOTAL_ATTEMPTS - 1 ? "last chance..." : "know it? search for the artist / song"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Dropdown Results */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute bottom-full mb-2 w-full bg-[var(--bg-secondary)] border border-[var(--bg-accent)] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-30 custom-scrollbar">
                    {searchResults.map((song) => (
                      <button
                        key={song.id}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left border-b border-[var(--bg-accent)] last:border-0 group"
                        onClick={() => handleSelectSong(song)}
                      >
                        <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-lg overflow-hidden relative flex-shrink-0 border border-[var(--bg-accent)]">
                          <Image src={song.image} alt={song.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate lowercase">{song.name}</p>
                          <p className="text-sm text-[var(--text-muted)] truncate lowercase">{song.artist}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center gap-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--bg-accent)] rounded-xl font-medium transition-all lowercase hover:translate-y-[-1px]"
                >
                  {currentAttempt === TOTAL_ATTEMPTS - 1 ? "give up" : `skip (+${UNLOCK_SECONDS[unlockedIndex + 1] - UNLOCK_SECONDS[unlockedIndex]}s)`}
                </button>
                <button
                  onClick={handleSubmit}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all lowercase shadow-lg
                    ${selectedSong 
                      ? 'bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white cursor-pointer hover:shadow-[0_0_20px_rgba(88,101,242,0.4)] hover:translate-y-[-1px]' 
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--bg-accent)] cursor-not-allowed opacity-50'}`}
                  disabled={!selectedSong}
                >
                  submit
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
