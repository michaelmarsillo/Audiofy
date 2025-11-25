'use client';

import { useState, useEffect, useRef } from 'react';
import { useVolume } from '@/components/VolumeControl';

interface Question {
  id: number;
  preview_url: string;
  options: string[];
  correct_answer: string;
  artist: string;
  genre: string;
  image?: string;
}

interface QuizQuestionProps {
  question: Question;
  onAnswerSelect: (answer: string, isCorrect: boolean) => void;
  timeLeft: number;
  isPaused?: boolean;
}

export function QuizQuestion({ question, onAnswerSelect, timeLeft, isPaused = false }: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasPlayingBeforePause, setWasPlayingBeforePause] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { siteVolume } = useVolume();

  // Reset selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(null);
  }, [question.id]);

  // Update audio volume when siteVolume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = siteVolume;
    }
  }, [siteVolume]);

  // Auto-play audio when question loads and stop at 7 seconds
  useEffect(() => {
    if (audioRef.current && question.preview_url && question.preview_url !== 'https://example.com/preview1.mp3') {
      audioRef.current.currentTime = 0;
      audioRef.current.volume = siteVolume; // Set initial volume
      audioRef.current.play().catch(() => {
        // Handle autoplay restrictions
        console.log('Autoplay prevented');
      });
      setIsPlaying(true);
      
      // Hard stop at 7.0 seconds
      const checkTime = setInterval(() => {
        if (audioRef.current && audioRef.current.currentTime >= 7.0) {
          audioRef.current.pause();
          audioRef.current.currentTime = 7.0;
          setIsPlaying(false);
          clearInterval(checkTime);
        }
      }, 100);
      
      return () => clearInterval(checkTime);
    }
  }, [question]);

  // Stop audio when time runs out
  useEffect(() => {
    if (timeLeft <= 0 && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [timeLeft]);

  // Pause/resume audio when isPaused changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        // Save the current playing state before pausing
        setWasPlayingBeforePause(isPlaying);
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Resume playing if it was playing before pause
        if (wasPlayingBeforePause && audioRef.current.currentTime < 7.0) {
          audioRef.current.play().catch(() => {
            console.log('Resume playback failed');
          });
          setIsPlaying(true);
        }
      }
    }
  }, [isPaused]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        console.log('Playback failed');
      });
      setIsPlaying(true);
    }
  };

  const handleAnswerClick = (answer: string) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks
    
    setSelectedAnswer(answer);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Check if answer is correct (case-insensitive, trimmed)
    const isCorrect = answer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
    onAnswerSelect(answer, isCorrect);
  };

  return (
    <div className="glass rounded-3xl p-8 max-w-5xl mx-auto scale-in">
      {/* Cover Art & Audio Section */}
      <div className="text-center mb-10">
        <div className="text-[var(--text-primary)] text-2xl font-semibold mb-8 slide-in-down">
          🎵 Listen and identify the song
        </div>
        
        {/* Large Cover Art with Progress Ring */}
        <div className="relative inline-block mb-8">
          {/* Progress Ring */}
          <div className="absolute inset-0 w-80 h-80 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="var(--bg-accent)"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="var(--accent-success)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(timeLeft / 7) * 289} 289`}
                className="transition-all duration-1000 ease-linear"
                style={{
                  stroke: timeLeft > 4 ? 'var(--accent-success)' : timeLeft > 2 ? 'var(--accent-warning)' : 'var(--accent-danger)'
                }}
              />
            </svg>
          </div>
          
          {/* Cover Art */}
          <div className="relative w-80 h-80 mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-[var(--bg-accent)]">
            {question.image ? (
              <img 
                src={question.image} 
                alt="Album Cover"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.currentTarget.src = '/api/placeholder/300/300';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--music-purple)] to-[var(--music-pink)] flex items-center justify-center">
                <svg className="w-32 h-32 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v9.28l-4.47-1.79L6 11.38v8.24l4.5-1.8L15 19.62V11.38l-1.53-.89L12 3z"/>
                </svg>
              </div>
            )}
            
            {/* Play/Pause Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors duration-300">
              {question.preview_url && !question.preview_url.includes('example.com') ? (
                <>
                  <audio
                    ref={audioRef}
                    src={question.preview_url}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <button
                    onClick={handlePlayPause}
                    className="group bg-[var(--bg-primary)]/80 hover:bg-[var(--bg-primary)]/90 border-2 border-[var(--accent-primary)] text-white p-8 rounded-full transition-all duration-300 transform hover:scale-110 shadow-2xl pulse-glow"
                  >
                    {isPlaying ? (
                      <svg className="w-16 h-16 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                      </svg>
                    ) : (
                      <svg className="w-16 h-16 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                </>
              ) : (
                <div className="bg-[var(--bg-primary)]/80 border-2 border-[var(--bg-accent)] text-[var(--text-muted)] p-8 rounded-full">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          {/* Timer Display */}
          <div className="absolute -top-2 -right-2 bg-[var(--bg-primary)] border-2 border-[var(--accent-primary)] text-[var(--text-primary)] px-4 py-2 rounded-2xl text-xl font-bold shadow-lg">
            {timeLeft}s
          </div>
        </div>

        {/* Track Info */}
        <div className="space-y-2 slide-in-up">
          <div className="text-[var(--text-primary)] text-xl font-medium">
            Artist: <span className="text-[var(--accent-primary)]">{question.artist}</span>
          </div>
          <div className="inline-flex items-center px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--bg-accent)] rounded-full text-[var(--text-secondary)] text-sm">
            <svg className="w-4 h-4 mr-2 text-[var(--music-purple)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v9.28l-4.47-1.79L6 11.38v8.24l4.5-1.8L15 19.62V11.38l-1.53-.89L12 3z"/>
            </svg>
            {question.genre}
          </div>
        </div>
      </div>

      {/* Answer Options */}
      <div className="grid gap-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerClick(option)}
            disabled={selectedAnswer !== null}
            className={`group relative p-6 text-left rounded-2xl transition-all duration-300 transform slide-in-up ${
              selectedAnswer === option
                ? 'bg-[var(--accent-success)] text-white scale-105 shadow-2xl border-2 border-[var(--accent-success)] pulse-glow'
                : selectedAnswer
                ? 'bg-[var(--bg-accent)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--bg-accent)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:scale-102 hover:shadow-xl border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/50'
            }`}
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className="flex items-center">
              <span className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-6 font-bold text-xl transition-all duration-300 ${
                selectedAnswer === option
                  ? 'bg-white/20 text-white'
                  : selectedAnswer
                  ? 'bg-[var(--bg-primary)] text-[var(--text-muted)]'
                  : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)]/30 group-hover:scale-110'
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-lg font-medium flex-1">{option}</span>
            </div>
            
            {/* Selection indicator */}
            {selectedAnswer === option && (
              <div className="absolute top-6 right-6 scale-in">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            )}
            
            {/* Hover effect */}
            {!selectedAnswer && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)]/0 via-[var(--accent-primary)]/5 to-[var(--accent-primary)]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
        ))}
      </div>

      {/* Demo message for mock data */}
      {question.preview_url.includes('example.com') && (
        <div className="mt-10 text-center slide-in-up">
          <div className="inline-flex items-center px-6 py-3 bg-[var(--accent-warning)]/20 border border-[var(--accent-warning)]/30 rounded-2xl text-[var(--accent-warning)] text-sm backdrop-blur-sm">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            Demo mode - Real audio previews available with iTunes integration
          </div>
        </div>
      )}
    </div>
  );
} 