'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PlayPage() {
  const router = useRouter();

  const gameModes = [
    {
      id: 'solo',
      title: 'soloplay',
      description: 'test your music knowledge solo',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      ),
      color: 'from-[#f472b6] to-[#ec4899]', // vibrant pink
      glowColor: 'rgba(244, 114, 182, 0.6)',
      borderGlow: '0 0 30px rgba(244, 114, 182, 0.6), 0 0 60px rgba(244, 114, 182, 0.4), inset 0 0 20px rgba(244, 114, 182, 0.1)',
      available: true,
      route: '/play/solo'
    },
    {
      id: 'friends',
      title: 'play with friends',
      description: 'challenge your friends in multiplayer',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      color: 'from-[#5865f2] to-[#4752c4]', // discord blue
      glowColor: 'rgba(88, 101, 242, 0.6)',
      borderGlow: '0 0 30px rgba(88, 101, 242, 0.6), 0 0 60px rgba(88, 101, 242, 0.4), inset 0 0 20px rgba(88, 101, 242, 0.1)',
      available: true,
      route: '/play/friends'
    },
    {
      id: 'heardle',
      title: 'heardle',
      description: 'daily music challenge',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
        </svg>
      ),
      color: 'from-[#10b981] to-[#059669]', // vibrant green
      glowColor: 'rgba(16, 185, 129, 0.6)',
      borderGlow: '0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.1)',
      available: true,
      route: '/play/heardle'
    },
    {
      id: 'arcade',
      title: 'arcade',
      description: 'party mode for friends and family',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19h0c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75h0c1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-0.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      ),
      color: 'from-[#a855f7] to-[#7c3aed]', // vibrant purple
      glowColor: 'rgba(168, 85, 247, 0.6)',
      borderGlow: '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(168, 85, 247, 0.1)',
      available: true,
      route: '/play/arcade'
    }
  ];

  const handleModeClick = (mode: typeof gameModes[0]) => {
    if (mode.available) {
      router.push(mode.route);
    }
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
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-12">
            <Link
              href="/"
              className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--bg-accent)] transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] lowercase">play audiofy</h1>
            </div>
          </div>

          {/* Description */}
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed lowercase">
              choose your favorite music quiz game and start guessing songs now! play with friends in multiplayer mode{' '}
              <span className="text-[var(--text-muted)] text-sm">(coming soon)</span>, try daily heardle games{' '}
              <span className="text-[var(--text-muted)] text-sm"></span>, or master music trivia solo.
            </p>
          </div>

          {/* Game Mode Cards - 2x2 Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {gameModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeClick(mode)}
                disabled={!mode.available}
                className={`
                  group relative p-8 rounded-2xl border-2 transition-all duration-300
                  ${mode.available 
                    ? 'bg-[var(--bg-secondary)] border-[var(--bg-accent)] hover:border-transparent hover:scale-[1.03] cursor-pointer' 
                    : 'bg-[var(--bg-secondary)]/40 border-[var(--bg-accent)]/20 cursor-not-allowed opacity-50'
                  }
                `}
                style={{
                  boxShadow: mode.available ? `0 4px 20px rgba(0,0,0,0.5)` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (mode.available) {
                    e.currentTarget.style.boxShadow = mode.borderGlow;
                  }
                }}
                onMouseLeave={(e) => {
                  if (mode.available) {
                    e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5)`;
                  }
                }}
              >
                {/* Coming Soon Badge */}
                {!mode.available && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-[var(--bg-accent)] border border-[var(--bg-accent)] rounded-full">
                    <span className="text-xs text-[var(--text-muted)] font-medium lowercase">coming soon</span>
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  {/* Icon with gradient background */}
                  <div className={`w-20 h-20 bg-gradient-to-br ${mode.color} rounded-2xl flex items-center justify-center mb-6 ${mode.available ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                    <div className="text-white">
                      {mode.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-2xl font-bold mb-3 lowercase ${mode.available ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {mode.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[var(--text-secondary)] text-sm lowercase">
                    {mode.description}
                  </p>

                  {/* Play Arrow (only for available modes) */}
                  {mode.available && (
                    <div className="mt-6 flex items-center gap-2 text-[var(--accent-primary)] group-hover:gap-3 transition-all">
                      <span className="text-sm font-semibold lowercase">play now</span>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

