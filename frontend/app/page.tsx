'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Typing animation for rotating words
  const words = ['knowledge', 'memory', 'taste'];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (displayedText.length < currentWord.length) {
          setDisplayedText(currentWord.slice(0, displayedText.length + 1));
        } else {
          // Wait 2 seconds before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting backward
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          // Move to next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 50 : 80); // Faster when deleting

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentWordIndex, words]);

  const handleButtonClick = () => {
    router.push('/play');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Vibrant background gradient */}
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--music-pink)] rounded-full blur-[150px]"></div>
      </div>

      <main className="relative z-10">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          {/* Clean Header with Auth - Mobile Responsive */}
          <header className="flex flex-col sm:flex-row items-center justify-between mb-12 sm:mb-16 gap-4">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer self-start sm:self-auto">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">Audiofy</h1>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {/* Leaderboard button - always visible */}
              <Link
                href="/leaderboard"
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-600/20 hover:from-yellow-500/30 hover:to-orange-600/30 text-yellow-400 hover:text-yellow-300 rounded-lg border border-yellow-500/30 hover:border-yellow-500/50 transition-all text-sm font-medium"
              >
                🏆 Leaderboard
              </Link>
              
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] rounded-lg border border-[var(--bg-accent)]">
                    <div className="w-7 h-7 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">{user.username[0].toUpperCase()}</span> 
                    </div>
                    <span className="text-[var(--text-primary)] font-medium text-sm truncate max-w-[80px] sm:max-w-none">{user.username}</span>
                  </div>
                  <Link
                    href="/about"
                    className="px-3 sm:px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] rounded-lg border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/30 transition-all text-sm font-medium"
                  >
                    About
                  </Link>
                  <button
                    onClick={logout}
                    className="px-3 sm:px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-danger)] rounded-lg border border-[var(--bg-accent)] hover:border-[var(--accent-danger)]/30 transition-all text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/about"
                    className="px-3 sm:px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] rounded-lg border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/30 transition-all text-sm font-medium"
                  >
                    About
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 sm:px-5 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/30 transition-all font-medium text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 sm:px-5 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-lg transition-all font-medium text-sm shadow-lg shadow-[var(--accent-primary)]/20"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
        </header>

          {/* Hero Section - Ultra Clean */}
          <div className="text-center mb-20 mt-12">
            <h2 className="text-6xl md:text-7xl font-bold text-[var(--text-primary)] mb-6 leading-tight">
              test your music
              <br />
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--music-purple)] bg-clip-text text-transparent">
                {displayedText}
              </span>
              <span className="cursor-blink bg-gradient-to-r from-[var(--accent-primary)] to-[var(--music-purple)] bg-clip-text text-transparent">|</span>
            </h2>

            <p className="text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto">
              listen to 7-second previews and guess the song. challenge yourself with hits from your genre of choice.
            </p>

            <button
              onClick={handleButtonClick}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white text-lg font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-[0_0_30px_rgba(88,101,242,0.5)] hover:shadow-[0_0_50px_rgba(88,101,242,0.8),0_0_80px_rgba(88,101,242,0.4)]"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              start playing
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </button>

            {user && (
              <p className="text-[var(--text-muted)] text-sm mt-2 flex items-center justify-center gap-2">
                <span>logged in as <span className="text-[var(--accent-primary)] font-semibold">{user.username}</span></span>
                <span className="heartbeat text-[var(--music-green)] text-xl">•</span>
                <span>scores will be saved</span>
              </p>
            )}
          </div>


          {/* Features - Premium Vinyl Records */}
          <div className="grid md:grid-cols-3 gap-12 mb-32 px-4">
            {/* Listen Vinyl */}
            <div
              className="group relative h-64 flex items-center justify-center slide-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-3xl blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>

              {/* Vinyl Record with 3D effect */}
              <div
                className="relative w-48 h-48 rounded-full bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] shadow-2xl transition-all duration-700 group-hover:translate-x-21.5 group-hover:rotate-[360deg] group-hover:shadow-[0_0_60px_rgba(99,102,241,0.8)]"
                style={{
                  boxShadow: "inset 0 0 60px rgba(0,0,0,0.8), 0 20px 40px rgba(0,0,0,0.6)",
                  transform: "perspective(1000px) rotateY(-10deg)",
                }}
              >
                {/* Multiple groove rings */}
                <div className="absolute inset-3 rounded-full border border-[#222] opacity-60"></div>
                <div className="absolute inset-6 rounded-full border border-[#222] opacity-50"></div>
                <div className="absolute inset-9 rounded-full border border-[#222] opacity-40"></div>
                <div className="absolute inset-12 rounded-full border border-[#222] opacity-30"></div>
                <div className="absolute inset-[60px] rounded-full border border-[#222] opacity-20"></div>

                {/* Center Label with glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] flex items-center justify-center shadow-2xl">
                      <div className="w-3 h-3 rounded-full bg-[var(--bg-primary)] shadow-inner"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Sleeve */}
              <div
                className="absolute left-0 w-48 h-48 glass rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-700 group-hover:translate-x-12 shadow-2xl border-2 border-[var(--accent-primary)]/30 group-hover:border-[var(--accent-primary)] backdrop-blur-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(99,102,241,0.1)",
                }}
              >
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-[var(--accent-primary)] rounded-full blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <svg
                    className="relative w-10 h-10 text-[var(--accent-primary)] group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1 tracking-tight">listen</h3>
                <p className="text-xs text-[var(--text-muted)] text-center font-medium">7-second previews</p>
              </div>
            </div>

            {/* Guess Vinyl */}
            <div
              className="group relative h-64 flex items-center justify-center slide-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-success)] to-[var(--music-green)] rounded-3xl blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>

              {/* Vinyl Record with 3D effect */}
              <div
                className="relative w-48 h-48 rounded-full bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] shadow-2xl transition-all duration-700 group-hover:translate-x-21.5 group-hover:rotate-[360deg] group-hover:shadow-[0_0_60px_rgba(16,185,129,0.8)]"
                style={{
                  boxShadow: "inset 0 0 60px rgba(0,0,0,0.8), 0 20px 40px rgba(0,0,0,0.6)",
                  transform: "perspective(1000px) rotateY(-10deg)",
                }}
              >
                {/* Multiple groove rings */}
                <div className="absolute inset-3 rounded-full border border-[#222] opacity-60"></div>
                <div className="absolute inset-6 rounded-full border border-[#222] opacity-50"></div>
                <div className="absolute inset-9 rounded-full border border-[#222] opacity-40"></div>
                <div className="absolute inset-12 rounded-full border border-[#222] opacity-30"></div>
                <div className="absolute inset-[60px] rounded-full border border-[#222] opacity-20"></div>

                {/* Center Label with glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-success)] to-[var(--music-green)] rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-success)] to-[var(--music-green)] flex items-center justify-center shadow-2xl">
                      <div className="w-3 h-3 rounded-full bg-[var(--bg-primary)] shadow-inner"></div>
              </div>
            </div>
          </div>
        </div>

              {/* Enhanced Sleeve */}
              <div
                className="absolute left-0 w-48 h-48 glass rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-700 group-hover:translate-x-12 shadow-2xl border-2 border-[var(--accent-success)]/30 group-hover:border-[var(--accent-success)] backdrop-blur-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(52,211,153,0.1) 100%)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(16,185,129,0.1)",
                }}
              >
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-[var(--accent-success)] rounded-full blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <svg
                    className="relative w-10 h-10 text-[var(--accent-success)] group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1 tracking-tight">guess</h3>
                <p className="text-xs text-[var(--text-muted)] text-center font-medium">instant feedback</p>
              </div>
        </div>

            {/* Compete Vinyl */}
            <div
              className="group relative h-64 flex items-center justify-center slide-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--music-purple)] to-[var(--music-pink)] rounded-3xl blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>

              {/* Vinyl Record with 3D effect */}
              <div
                className="relative w-48 h-48 rounded-full bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] shadow-2xl transition-all duration-700 group-hover:translate-x-21.5 group-hover:rotate-[360deg] group-hover:shadow-[0_0_60px_rgba(168,85,247,0.8)]"
                style={{
                  boxShadow: "inset 0 0 60px rgba(0,0,0,0.8), 0 20px 40px rgba(0,0,0,0.6)",
                  transform: "perspective(1000px) rotateY(-10deg)",
                }}
              >
                {/* Multiple groove rings */}
                <div className="absolute inset-3 rounded-full border border-[#222] opacity-60"></div>
                <div className="absolute inset-6 rounded-full border border-[#222] opacity-50"></div>
                <div className="absolute inset-9 rounded-full border border-[#222] opacity-40"></div>
                <div className="absolute inset-12 rounded-full border border-[#222] opacity-30"></div>
                <div className="absolute inset-[60px] rounded-full border border-[#222] opacity-20"></div>

                {/* Center Label with glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--music-purple)] to-[var(--music-pink)] rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[var(--music-purple)] to-[var(--music-pink)] flex items-center justify-center shadow-2xl">
                      <div className="w-3 h-3 rounded-full bg-[var(--bg-primary)] shadow-inner"></div>
          </div>
          </div>
          </div>
        </div>

              {/* Enhanced Sleeve */}
              <div
                className="absolute left-0 w-48 h-48 glass rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-700 group-hover:translate-x-12 shadow-2xl border-2 border-[var(--music-purple)]/30 group-hover:border-[var(--music-purple)] backdrop-blur-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.1) 100%)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(139,92,246,0.1)",
                }}
              >
                <div className="relative mb-3">
                  <div className="absolute inset-0 bg-[var(--music-purple)] rounded-full blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <svg
                    className="relative w-10 h-10 text-[var(--music-purple)] group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
            </div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1 tracking-tight">compete</h3>
                <p className="text-xs text-[var(--text-muted)] text-center font-medium">climb leaderboard</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  </div>
  );
}
