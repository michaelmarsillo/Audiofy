'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Playlist configurations
const PLAYLISTS = {
  'popular-songs': {
    id: 'popular-songs',
    name: 'Popular Songs',
    emoji: '🔥',
    description: 'Guess these popular songs that are dominating the charts! Test your music knowledge with the biggest hits from Taylor Swift, Ariana Grande, Justin Bieber, Harry Styles, Beyonce, Billie Eilish, The Weeknd, Ed Sheeran and more chart-topping artists across all genres.',
    subtext: 'Perfect for parties and casual music quiz gameplay - these are the songs everyone knows.',
    artists: ['Taylor Swift', 'Ariana Grande', 'Justin Bieber', 'Harry Styles', 'Beyonce', 'Billie Eilish', 'The Weeknd', 'Ed Sheeran', 'Drake', 'Dua Lipa', 'Post Malone', 'Olivia Rodrigo'],
    playlists: [
      { id: 'top-charts', name: 'Top Charts', songCount: 5056, description: 'The biggest hits right now' },
      { id: 'all-time-hits', name: 'All Time Hits', songCount: 533, description: 'Timeless classics everyone knows' }
    ],
    color: 'from-[#ff6b6b] to-[#feca57]',
    iconBg: 'bg-gradient-to-br from-[#ff6b6b] to-[#feca57]'
  },
  'pop': {
    id: 'pop',
    name: 'Pop',
    emoji: '☀️',
    description: 'Test your knowledge of pop music! From classic hits to modern chart-toppers.',
    subtext: 'Catchy melodies and unforgettable hooks.',
    artists: ['Taylor Swift', 'Ariana Grande', 'Ed Sheeran', 'Dua Lipa', 'The Weeknd', 'Harry Styles', 'Olivia Rodrigo', 'Billie Eilish'],
    playlists: [
      { id: 'pop-2020', name: "Pop Hits '2020", songCount: 90, description: '2020s biggest pop songs' },
      { id: 'forever-pop', name: 'Forever Pop Stars', songCount: 356, description: 'Iconic pop legends' }
    ],
    color: 'from-[#a8e6cf] to-[#3eecac]',
    iconBg: 'bg-gradient-to-br from-[#a8e6cf] to-[#3eecac]'
  },
  'hip-hop-rap': {
    id: 'hip-hop-rap',
    name: 'Hip Hop & Rap',
    emoji: '🎤',
    description: 'Can you identify the hottest hip hop and rap tracks? Test your knowledge of beats, bars, and bangers.',
    subtext: 'From old school classics to modern trap and Gen-Z hits.',
    artists: ['Drake', 'Kendrick Lamar', 'J. Cole', 'Travis Scott', 'Kanye West', 'Eminem', 'Jay-Z', 'Lil Baby', 'Future', 'Juice WRLD', 'Polo G'],
    playlists: [
      { id: 'rap-hits', name: 'Rap Hits', songCount: 420, description: 'The biggest rap anthems' },
      { id: 'old-school-hip-hop', name: 'Old School Hip Hop', songCount: 200, description: '90s & early 2000s classics' },
      { id: 'best-of-gen-z', name: 'Best of Gen-Z', songCount: 180, description: 'Juice WRLD, Polo G, Lil Tjay, Gunna, Playboi Carti, Travis Scott, 21 Savage, XXXTentacion' }
    ],
    color: 'from-[#667eea] to-[#764ba2]',
    iconBg: 'bg-gradient-to-br from-[#667eea] to-[#764ba2]'
  },
  'rock': {
    id: 'rock',
    name: 'Rock',
    emoji: '🎸',
    description: 'Guess the rock songs from legendary bands to modern rock stars! Our rock music quizzes feature timeless anthems from Queen, Led Zeppelin, Scorpions, Red Hot Chilli Peppers & more rock legends.',
    subtext: 'Can you identify iconic guitar riffs, powerful vocals, and unforgettable rock songs that shaped music history?',
    artists: ['Queen', 'Led Zeppelin', 'The Beatles', 'AC/DC', 'Guns N Roses', 'Red Hot Chili Peppers', 'Foo Fighters', 'Nirvana', 'Green Day', 'Blink-182', 'Sum 41'],
    playlists: [
      { id: 'rock-classics', name: 'Rock Classics', songCount: 300, description: 'Legendary rock anthems' },
      { id: 'divorced-dad-rock', name: 'Divorced Dad Rock', songCount: 150, description: 'Metallica, Deftones, Green Day, Blink-182, MCR, Sum 41' }
    ],
    color: 'from-[#f093fb] to-[#f5576c]',
    iconBg: 'bg-gradient-to-br from-[#f093fb] to-[#f5576c]'
  },
  'metal': {
    id: 'metal',
    name: 'Metal',
    emoji: '🤘',
    description: 'Heavy metal anthems from the legends! Test your knowledge of the most iconic metal bands and their crushing riffs.',
    subtext: 'Can you identify the heaviest hits from metal\'s greatest artists?',
    artists: ['Metallica', 'Iron Maiden', 'Black Sabbath', 'Slayer', 'Megadeth', 'Pantera', 'Nirvana', 'Three Days Grace', 'Ozzy Osbourne'],
    playlists: [
      { id: 'metal-classics', name: 'Metal Classics', songCount: 204, description: 'Heavy metal legends' },
      { id: 'metal-bangers', name: 'Metal Bangers', songCount: 120, description: 'Iron Maiden, Metallica, Nirvana, Three Days Grace, Ozzy' }
    ],
    color: 'from-[#fa709a] to-[#fee140]',
    iconBg: 'bg-gradient-to-br from-[#fa709a] to-[#fee140]'
  },
  'country': {
    id: 'country',
    name: 'Country',
    emoji: '🤠',
    description: 'Test your country music knowledge! From classic country to modern Nashville hits.',
    subtext: 'Boots, trucks, and heartfelt lyrics.',
    artists: ['Luke Combs', 'Morgan Wallen', 'Carrie Underwood', 'Blake Shelton', 'Keith Urban', 'Miranda Lambert', 'Chris Stapleton', 'Dolly Parton'],
    playlists: [
      { id: 'country-hits', name: 'Country Hits', songCount: 250, description: 'Modern country favorites' },
      { id: 'classic-country', name: 'Classic Country', songCount: 180, description: 'Timeless country legends' }
    ],
    color: 'from-[#ffeaa7] to-[#fdcb6e]',
    iconBg: 'bg-gradient-to-br from-[#ffeaa7] to-[#fdcb6e]'
  },
  'decades': {
    id: 'decades',
    name: 'Decades',
    emoji: '📼',
    description: 'Travel back in time with the greatest hits from the 80s and 90s! Relive the golden era of pop, rock, and hip hop.',
    subtext: 'Nostalgia overload with timeless classics.',
    artists: ['Michael Jackson', 'Madonna', 'Prince', 'Queen', 'Nirvana', 'Mariah Carey', 'Tupac', 'Britney Spears'],
    playlists: [
      { id: '80s-hits', name: 'Best of 80s', songCount: 500, description: 'Neon lights and synth-pop anthems' },
      { id: '90s-hits', name: 'Best of 90s', songCount: 450, description: 'Grunge, boy bands, and golden age hip hop' }
    ],
    color: 'from-[#ff9ff3] to-[#feca57]',
    iconBg: 'bg-gradient-to-br from-[#ff9ff3] to-[#feca57]'
  }
};

export default function SoloPlayPage() {
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState<string>('popular-songs');

  const currentGenre = PLAYLISTS[selectedGenre as keyof typeof PLAYLISTS];

  const startQuiz = (playlistId: string) => {
    router.push(`/quiz?playlist=${playlistId}&genre=${selectedGenre}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-8 px-4">
      {/* Vibrant background gradient */}
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Back button */}
        <Link
          href="/play"
          className="inline-flex items-center gap-2 mb-6 p-2 px-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg border border-[var(--bg-accent)] transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          <span className="lowercase">back to modes</span>
        </Link>

        {/* Genre Navigation Pills */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {Object.values(PLAYLISTS).map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenre(genre.id)}
              className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
                selectedGenre === genre.id
                  ? 'bg-white text-[var(--bg-primary)] shadow-lg scale-105'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--bg-accent)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {genre.emoji} {genre.name}
            </button>
          ))}
        </div>

        {/* Genre Hero Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--bg-accent)] rounded-2xl p-8 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Genre Icon/Image */}
            <div className={`w-full lg:w-80 h-80 ${currentGenre.iconBg} rounded-2xl flex items-center justify-center text-[180px] shadow-2xl flex-shrink-0`}>
              {currentGenre.emoji}
            </div>

            {/* Genre Info */}
            <div className="flex-1">
              <h2 className="text-5xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-3">
                {currentGenre.name} {currentGenre.emoji}
              </h2>
              <p className="text-[var(--text-secondary)] text-lg mb-4 leading-relaxed">
                {currentGenre.description}
              </p>
              <p className="text-[var(--text-muted)] text-sm mb-6 italic">
                {currentGenre.subtext}
              </p>

              {/* Library Stats */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] rounded-lg">
                  <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <span className="text-[var(--text-secondary)] text-sm font-medium">{currentGenre.playlists.length} playlists</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--bg-accent)] rounded-lg">
                  <svg className="w-5 h-5 text-[var(--music-purple)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span className="text-[var(--text-secondary)] text-sm font-medium">{currentGenre.artists.length} artists</span>
                </div>
              </div>

              {/* Featured Artists */}
              <div className="mb-4">
                <p className="text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider mb-2">featured artists</p>
                <p className="text-[var(--text-secondary)] text-sm">
                  {currentGenre.artists.slice(0, 6).join(', ')} and more.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist Selection Cards */}
        <div className={`grid ${currentGenre.playlists.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-8`}>
          {currentGenre.playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => startQuiz(playlist.id)}
              className="group relative bg-[var(--bg-secondary)] border-2 border-[var(--bg-accent)] hover:border-transparent rounded-2xl p-8 text-left transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl"
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 40px ${currentGenre.color.includes('from-[#') ? 'rgba(88, 101, 242, 0.6)' : 'rgba(168, 85, 247, 0.6)'}, 0 0 80px ${currentGenre.color.includes('from-[#') ? 'rgba(88, 101, 242, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {playlist.name}
                </h3>
                <svg className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-all group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mb-4">{playlist.description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--accent-success)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <span className="text-[var(--text-muted)] text-xs font-semibold">{playlist.songCount} songs</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--music-pink)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  <span className="text-[var(--text-muted)] text-xs font-semibold">7 questions</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

