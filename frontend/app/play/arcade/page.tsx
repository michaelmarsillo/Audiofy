'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useVolume } from '@/components/VolumeControl';

// Game Phases
type GamePhase = 'welcome' | 'countdown' | 'listening' | 'discussion' | 'reveal' | 'gameover';

interface Song {
  id: number;
  name: string;
  artist: string;
  album: string;
  image: string;
  preview_url: string;
}

export default function ArcadePage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { siteVolume } = useVolume();

  // Game State
  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [currentRound, setCurrentRound] = useState(1);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('80s-hits');
  const [smoothProgress, setSmoothProgress] = useState(1);

  const TOTAL_ROUNDS = 7;

  // Audio Control Ref
  const isPlayingRef = useRef(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  // Reusable Timer Component
  const CircularTimer = ({ time, maxTime, size = 'large', color = 'blue' }: { time: number; maxTime: number; size?: 'small' | 'medium' | 'large'; color?: 'blue' | 'red' | 'yellow' }) => {
    const sizes = {
      small: { container: 'w-24 h-24', text: 'text-4xl', radius: 44, cx: 48, cy: 48 },
      medium: { container: 'w-32 h-32', text: 'text-6xl', radius: 60, cx: 64, cy: 64 },
      large: { container: 'w-48 h-48', text: 'text-8xl', radius: 92, cx: 96, cy: 96 }
    };
    
    const colors = {
      blue: 'text-[var(--music-blue)]',
      red: 'text-[var(--accent-danger)]',
      yellow: 'text-[var(--accent-warning)]'
    };

    const { container, text, radius, cx, cy } = sizes[size];
    const circumference = 2 * Math.PI * radius;
    // Combine discrete time with smooth progress for perfect sync
    const totalProgress = (time - 1 + smoothProgress) / maxTime;
    
    return (
      <div className={`relative ${container} flex items-center justify-center`}>
        <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-[var(--bg-tertiary)]"
            strokeDasharray={circumference}
          />
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className={colors[color]}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - totalProgress)}
          />
        </svg>
        <span className={`${text} font-bold text-[var(--text-primary)] z-10 relative`}>{time}</span>
      </div>
    );
  };

  // Audio Management
  const playAudio = () => {
    if (audioRef.current) {
      // If starting a new song (countdown -> listening), set source
      if (phase === 'countdown') {
        audioRef.current.src = songs[currentRound - 1]?.preview_url || '';
        audioRef.current.currentTime = 0;
      }
      
      // Set volume before playing
      audioRef.current.volume = siteVolume;

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Playback prevented:", error);
        });
      }
      isPlayingRef.current = true;
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  };

  // Initial Audio Unlock & Start
  const startGame = async () => {
    setLoading(true);
    
    // Unlock audio context immediately on user interaction
    if (audioRef.current) {
      audioRef.current.load();
      // Force a silent play to unlock autoplay policies
      const unlockPlay = audioRef.current.play();
      if (unlockPlay !== undefined) {
        unlockPlay.then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
        }).catch(e => console.log("Audio warmup:", e));
      }
    }

    try {
      // Fetch songs from our API
      console.log(`Fetching arcade songs for ${selectedGenre}...`);
      const res = await fetch(`/api/quiz/new?playlist=${selectedGenre}&genre=arcade`);
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      console.log("Arcade songs fetched:", data);
      
      if (data.questions && data.questions.length > 0) {
        // Transform quiz questions to Song format
        interface Question {
          id: number;
          song_name?: string;
          artist: string;
          preview_url: string;
          image?: string;
        }
        const gameSongs = data.questions.slice(0, TOTAL_ROUNDS).map((q: Question) => ({
          id: q.id,
          name: q.song_name || 'Unknown',
          artist: q.artist,
          album: q.album || 'Unknown Album',
          image: q.image,
          preview_url: q.preview_url
        }));
        
        if (gameSongs.length < TOTAL_ROUNDS) {
            console.warn("Not enough songs returned for full game");
        }

        setSongs(gameSongs);
        
        // Wait a moment for state to settle then start
        setTimeout(() => {
            setPhase('countdown');
            setTimer(5);
            // Pre-load the first song
            if (audioRef.current && gameSongs[0]?.preview_url) {
                audioRef.current.src = gameSongs[0].preview_url;
                audioRef.current.load();
            }
        }, 100);
        
      } else {
        console.error("No songs found in response");
        // Show error UI state?
      }
    } catch (error) {
      console.error("Failed to start arcade game:", error);
    } finally {
      setLoading(false);
    }
  };

  // Smooth Progress Animation
  useEffect(() => {
    if (timer <= 0) return;

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

  // Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      handlePhaseTransition();
    }

    return () => clearInterval(interval);
  }, [timer, phase]);

  // Phase Transition Logic
  const handlePhaseTransition = () => {
    switch (phase) {
      case 'countdown':
        setPhase('listening');
        setTimer(10);
        playAudio();
        break;
      case 'listening':
        setPhase('discussion');
        setTimer(7);
        // Pause audio during discussion
        pauseAudio(); 
        break;
      case 'discussion':
        setPhase('reveal');
        setTimer(7);
        playAudio(); // Resume for victory lap
        break;
      case 'reveal':
        if (currentRound < TOTAL_ROUNDS) {
          setCurrentRound((prev) => prev + 1);
          setPhase('countdown');
          setTimer(5);
          pauseAudio(); // Stop previous song
        } else {
          setPhase('gameover');
          pauseAudio();
        }
        break;
      default:
        break;
    }
  };

  // Volume Sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = siteVolume;
    }
  }, [siteVolume]);

  // Render Functions
  const renderContent = () => {
    switch (phase) {
      case 'welcome':
        return (
          <div className="text-center max-w-2xl mx-auto animate-fadeIn px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[var(--music-purple)] to-[var(--music-pink)] bg-clip-text text-transparent">
              arcade mode
            </h1>
            
            <div className="bg-[var(--bg-secondary)]/80 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-3xl border border-[var(--bg-accent)] shadow-2xl mb-8 text-left">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[var(--text-primary)]">welcome</h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-6 leading-relaxed">
                enjoy a hands-free music quiz experience! perfect for parties and group settings, arcade
                automatically plays songs while everyone guesses along, no clicking required. stream it on
                a tv and let the music bring the fun!
              </p>

              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[var(--text-primary)]">points</h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-6 leading-relaxed">
                want to make it competitive? grab a piece of paper and keep track of the points for each
                song guessed correctly amongst your guests.
              </p>
              
              <div className="bg-[var(--bg-tertiary)] p-4 sm:p-5 rounded-xl mb-2 border border-[var(--bg-accent)]">
                <p className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">recommended points system</p>
                <ul className="space-y-2 text-sm sm:text-base text-[var(--text-secondary)]">
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--music-green)]">●</span> guess the song title and artist? <span className="text-[var(--text-primary)] font-bold">3 points!</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--music-blue)]">●</span> guess only the song title? <span className="text-[var(--text-primary)] font-bold">1 point!</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[var(--music-purple)]">●</span> guess only the artist? <span className="text-[var(--text-primary)] font-bold">1 point!</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl font-bold transition-all border border-[var(--bg-accent)]"
              >
                settings
              </button>
              <button
                onClick={startGame}
                disabled={loading}
                className="px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:scale-105 text-white rounded-xl font-bold text-lg sm:text-xl transition-all shadow-[0_0_30px_rgba(88,101,242,0.4)]"
              >
                {loading ? 'loading...' : 'play arcade'}
              </button>
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-12 text-[var(--text-primary)] text-center">round {currentRound}/{TOTAL_ROUNDS}</h2>
            <CircularTimer time={timer} maxTime={5} size="large" color="blue" />
            <p className="mt-12 text-base sm:text-lg md:text-xl text-[var(--text-muted)] animate-pulse text-center">starting the next round shortly...</p>
          </div>
        );

      case 'listening':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-12 text-[var(--text-primary)] text-center">music is playing...</h2>
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--music-blue)]/20 rounded-full animate-ping"></div>
              <CircularTimer time={timer} maxTime={10} size="large" color="blue" />
            </div>
            <p className="mt-12 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-xl text-center px-4">
              make sure to pay attention!
            </p>
          </div>
        );

      case 'discussion':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn px-4">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-12 text-[var(--text-primary)] text-center">what is your guess!?</h2>
            <CircularTimer time={timer} maxTime={7} size="medium" color="red" />
            <p className="mt-12 text-base sm:text-lg md:text-xl text-[var(--text-muted)] animate-bounce text-center px-4">
              make sure to write down your scores as soon as you can!
            </p>
          </div>
        );

      case 'reveal':
        const currentSong = songs[currentRound - 1];
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 animate-slideInUp px-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-[var(--text-primary)] text-center">the answer was...</h2>
            
            <div className="bg-[var(--bg-secondary)] p-4 sm:p-6 rounded-3xl border border-[var(--bg-accent)] shadow-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-8 max-w-3xl w-full mb-8">
              <div className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                <Image src={currentSong?.image || ''} alt="Album Art" fill className="object-cover" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">{currentSong?.name}</h3>
                <p className="text-lg sm:text-xl md:text-2xl text-[var(--text-secondary)]">{currentSong?.artist}</p>
              </div>
            </div>

            <CircularTimer time={timer} maxTime={7} size="medium" color="yellow" />
            <p className="mt-12 text-base sm:text-lg md:text-xl text-[var(--text-muted)] animate-bounce text-center">
            starting the next round shortly...</p>
          </div>
        );

      case 'gameover':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn px-4">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 text-[var(--text-primary)] text-center">game over!</h2>
            <p className="text-xl sm:text-2xl text-[var(--text-secondary)] mb-12 text-center">thank you for playing!</p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <button
                onClick={() => {
                    setCurrentRound(1);
                    setPhase('countdown');
                    setTimer(5);
                    // Ideally fetch new songs here
                    startGame();
                }}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                replay
              </button>
              <Link
                href="/play"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-[var(--bg-accent)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"/></svg>
                back to menu
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 relative overflow-hidden flex flex-col">
      {/* Audio Element */}
      <audio ref={audioRef} className="hidden" />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-8 max-w-md w-full border border-[var(--bg-accent)] shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">arcade settings</h2>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">select genre/era</label>
              <div className="grid grid-cols-1 gap-3">
                <button 
                    onClick={() => setSelectedGenre('80s-hits')}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedGenre === '80s-hits' ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] border-[var(--bg-accent)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}`}
                >
                    <div className="font-bold">Best of 80s</div>
                    <div className="text-xs opacity-80">Neon lights & synth-pop</div>
                </button>
                <button 
                    onClick={() => setSelectedGenre('90s-hits')}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedGenre === '90s-hits' ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] border-[var(--bg-accent)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}`}
                >
                    <div className="font-bold">Best of 90s</div>
                    <div className="text-xs opacity-80">Grunge, hip hop & boy bands</div>
                </button>
                <button 
                    onClick={() => setSelectedGenre('top-charts')}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedGenre === 'top-charts' ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] border-[var(--bg-accent)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}`}
                >
                    <div className="font-bold">Modern Hits</div>
                    <div className="text-xs opacity-80">Today&apos;s top chart toppers</div>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="mt-8 w-full py-4 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-xl font-bold transition-all border border-[var(--bg-accent)]"
            >
              close
            </button>
          </div>
        </div>
      )}

      {/* Back Button (Only on Welcome) */}
      {phase === 'welcome' && (
        <div className="fixed top-4 left-4 z-50">
            <Link href="/play" className="p-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-xl border border-[var(--bg-accent)] text-[var(--text-secondary)] transition-all block shadow-lg backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </Link>
        </div>
      )}

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center relative z-0">
        {renderContent()}
      </div>

      {/* Background Ambient Blobs */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--music-purple)] rounded-full blur-[120px] opacity-20 animate-pulse-glow"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[var(--music-blue)] rounded-full blur-[120px] opacity-20 animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}

