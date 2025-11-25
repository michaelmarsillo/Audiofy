'use client';

import { useState, useEffect } from 'react';
import { useVolume } from '@/components/VolumeControl';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const { siteVolume } = useVolume();
  const [hoverAudio, setHoverAudio] = useState<HTMLAudioElement | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [cachedTracks, setCachedTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Fetch and play specific Juice WRLD songs on hover
  const handlePlayHover = async () => {
    if (isLoadingPreview || hoverAudio) return;
    
    setIsHovering(true);
    
    // Use cached tracks if available, otherwise fetch
    let tracksToUse = cachedTracks;
    
    if (cachedTracks.length === 0) {
      setIsLoadingPreview(true);
      try {
        // Specific Juice WRLD songs to fetch
        const songsToFetch = [
          'Maze juice wrld',
          'Yacht Club juice wrld',
          'Righteous juice wrld',
          'Robbery juice wrld',
          'Empty Out Your Pockets juice wrld',
          '6 Kiss Trippie Redd juice wrld',
          'PTSD juice wrld',
          'Cigarettes juice wrld',
          'Flaws And Sins juice wrld',
          'I\'ll Be Fine juice wrld',
          'From My Window juice wrld',
          'Glo\'d Up juice wrld',
          'Ring Ring juice wrld',
          'Who Shot Cupid? juice wrld'
        ];
        
        // Fetch all songs in parallel
        const fetchPromises = songsToFetch.map(song =>
          fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(song)}&entity=song&limit=5`)
            .then(res => res.json())
        );
        
        const results = await Promise.all(fetchPromises);
        
        // Extract tracks with previews AND verify artist is Juice WRLD (including collabs)
        const tracks = results
          .map(data => {
            // Find the first result where artist name OR track name contains "Juice WRLD"
            return data.results?.find((track: any) => {
              if (!track || !track.previewUrl) return false;
              
              const artistName = (track.artistName || '').toLowerCase();
              const trackName = (track.trackName || '').toLowerCase();
              
              // Check if Juice WRLD is in artist name (primary or collab)
              // OR if track name contains "juice wrld" in any format
              return artistName.includes('juice wrld') || 
                     trackName.includes('juice wrld');
            });
          })
          .filter((track: any) => track);
        
        if (tracks.length > 0) {
          setCachedTracks(tracks);
          tracksToUse = tracks; // Use the freshly fetched tracks immediately
        } else {
          setIsLoadingPreview(false);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch preview:', error);
        setIsLoadingPreview(false);
        return;
      } finally {
        setIsLoadingPreview(false);
      }
    }
    
    // Pick a random track from cached tracks
    if (tracksToUse.length > 0) {
      const randomTrack = tracksToUse[Math.floor(Math.random() * tracksToUse.length)];
      
      // Store the current track info
      setCurrentTrack(randomTrack);
      
      // Create and play audio
      const audio = new Audio(randomTrack.previewUrl);
      audio.volume = siteVolume;
      audio.play().catch(err => console.log('Playback failed:', err));
      setHoverAudio(audio);
    }
  };

  // Update playing audio volume when global volume changes
  useEffect(() => {
    if (hoverAudio) {
      hoverAudio.volume = siteVolume;
    }
  }, [siteVolume, hoverAudio]);

  const handleStopHover = () => {
    setIsHovering(false);
    setCurrentTrack(null);
    if (hoverAudio) {
      hoverAudio.pause();
      hoverAudio.currentTime = 0;
      setHoverAudio(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Vibrant background gradient */}
      <div className="fixed inset-0 opacity-[0.08] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[var(--accent-primary)] rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[var(--music-purple)] rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">Audiofy</h1>
          </Link>

          <Link
            href="/"
            className="px-5 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/30 transition-all font-medium text-sm"
          >
            Back to Home
          </Link>
        </header>

        {/* About Content */}
        <div className="space-y-8 mb-12">
          {/* Top Section: Image + Text Side by Side */}
          <div className="grid lg:grid-cols-[320px_1fr] gap-8 lg:gap-12 items-start">
            {/* Left: Image - Shifted down to align with body text on desktop, normal on mobile/tablet */}
            <div 
              className="relative group lg:mt-[80px] w-full max-w-[280px] lg:max-w-none mx-auto lg:mx-0 cursor-pointer"
              onClick={() => setShowImageModal(true)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative w-full aspect-square rounded-3xl border-2 border-[var(--bg-accent)] group-hover:border-[var(--accent-primary)] overflow-hidden transition-all duration-300">
                <Image
                  src="/images/mebuildingaudiofy7.jpg"
                  alt="picture of me"
                  fill
                  sizes="(max-width: 1024px) 280px, 320px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority
                />
                {/* Click hint overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: About Text */}
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] leading-tight mb-3 md:mb-4">
                  About the Creator
                </h2>
                <div className="h-1 w-20 md:w-24 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--music-purple)] rounded-full"></div>
              </div>

              <div className="space-y-3 md:space-y-4 text-[var(--text-secondary)] text-base md:text-lg leading-relaxed">
                <p>
                  hey there! i'm <span className="text-[var(--accent-primary)] font-semibold">michael marsillo</span>, 
                  the creator of audiofy. i built this app because i love music and wanted to create a fun way 
                  to test your music knowledge with friends and family.
                </p>
                <p>
                  audiofy is a fullstack web application built with <span className="text-[var(--music-purple)] font-semibold">next.js</span>, 
                  <span className="text-[var(--music-purple)] font-semibold"> tailwind</span>, 
                  <span className="text-[var(--music-purple)] font-semibold"> express.js</span>, and 
                  <span className="text-[var(--music-purple)] font-semibold"> postgresql</span>. 
                  it features real-time scoring, a global leaderboard, and web sockets for multiplayer functionality.
                </p>
                <p>
                  when i'm not coding, you can find me at the gym working out, researching about pharmacology, or chilling listening to music. if you want to contribute, i'm leaving this project open source, feel free to make a pr here{' '}
                  <a href="https://github.com/michaelmarsillo/audiofy" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors">→ audiofy</a> also, if you'd like to learn more about me you can checkout my blog here{' '}
                  <a href="https://michaelmarsillo.ca/blog" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors">→ my blog</a>
                </p>
              </div>
            </div>
          </div>

          {/* Music Platforms Section */}
          <div className="flex items-center justify-center gap-3 -mt-4">
            <span className="text-[var(--text-muted)] text-xs font-medium">
              find what i'm listening to <span className="text-[var(--accent-primary)]">→</span>
            </span>
            <div className="flex items-center gap-3">
              {/* Spotify Button */}
              <a
                href="https://open.spotify.com/user/zzzmichaelzzz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-white rounded-full transition-all duration-300 hover:scale-105 shadow-md hover:shadow-[#1DB954]/50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span className="font-semibold text-xs">spotify</span>
              </a>

              {/* SoundCloud Button */}
              <a
                href="https://soundcloud.com/michaelmarsillo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff5500] hover:bg-[#ff6619] text-white rounded-full transition-all duration-300 hover:scale-105 shadow-md hover:shadow-[#ff5500]/50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.5 9c-.8 0-1.5.2-2.1.6C15.6 6.3 12.9 4 9.7 4 5.9 4 2.7 7.1 2.7 11c0 .1 0 .3.1.4C1.1 12.2 0 13.9 0 15.8 0 18.7 2.3 21 5.2 21h13.3c2.5 0 4.5-2 4.5-4.5S21 12 18.5 9z"/>
                </svg>
                <span className="font-semibold text-xs">soundcloud</span>
              </a>
            </div>
          </div>

          {/* Hint message above */}
          <div className={`flex items-center justify-center gap-2 mb-3 transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-70 animate-pulse'}`}>
            <span className="text-[var(--text-muted)] text-xs md:text-sm font-medium tracking-wide">
              psst... hover over the vinyl <span className="text-[var(--accent-primary)]">↓</span>
            </span>
          </div>

          {/* Bottom Section: Centered Vinyl Player with Hint Above */}
          <div className="flex flex-col items-center pt-4">
          

            {/* Vinyl Record Player Container - Responsive Width */}
            <div 
              onMouseEnter={handlePlayHover}
              onMouseLeave={handleStopHover}
              className="relative group cursor-pointer w-full max-w-[480px] px-4 md:px-0"
            >
              {/* Glowing background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] via-[var(--music-purple)] to-[var(--music-pink)] rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              
              {/* Main container */}
              <div className="relative bg-[var(--bg-secondary)] border-2 border-[var(--bg-accent)] group-hover:border-[var(--music-purple)] rounded-2xl p-4 md:p-6 transition-all duration-300">
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Vinyl Record */}
                  <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                    {/* Outer glow ring */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-[var(--accent-primary)] via-[var(--music-purple)] to-[var(--music-pink)] blur-md opacity-0 ${isHovering ? 'opacity-60 animate-pulse' : ''} transition-opacity duration-300`}></div>
                    
                    {/* Vinyl disc */}
                    <div className={`relative w-full h-full rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-black border-4 border-[var(--bg-accent)] shadow-2xl ${isHovering ? 'animate-spin-slow' : ''} transition-all duration-500`}>
                      {/* Grooves */}
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute inset-0 rounded-full border border-gray-700/30"
                          style={{
                            margin: `${6 + i * 4}px`,
                          }}
                        />
                      ))}
                      
                      {/* Center label */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] flex items-center justify-center shadow-lg ${isHovering ? 'scale-110' : ''} transition-transform duration-300`}>
                          <div className="w-2 h-2 rounded-full bg-black"></div>
                        </div>
                      </div>
                      
                      {/* Reflection effect */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-transparent"></div>
                    </div>
                    
                    {/* Tonearm */}
                    <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-16 h-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full origin-right ${isHovering ? 'rotate-[-25deg]' : 'rotate-[-45deg]'} transition-transform duration-500 shadow-lg`}>
                      <div className="absolute right-0 w-3 h-3 bg-gradient-to-br from-[var(--music-purple)] to-[var(--music-pink)] rounded-full shadow-lg"></div>
                    </div>
                  </div>
                  
                  {/* Info Section - Responsive Width */}
                  <div className="flex-1 min-w-0 space-y-1.5 md:space-y-2">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <div className={`w-2 h-2 flex-shrink-0 rounded-full ${isHovering ? 'bg-[var(--music-green)] animate-pulse' : 'bg-gray-600'} transition-colors duration-300`}></div>
                      <span className="text-[var(--text-muted)] text-xs font-semibold tracking-wider uppercase truncate">
                        {isHovering && currentTrack ? `now playing: ${currentTrack.trackName}` : 'ready to play'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-1">
                      {isHovering ? 'juice wrld' : 'my music taste'}
                    </h3>
                    
                    <p className="text-[var(--text-secondary)] text-xs md:text-sm leading-relaxed">
                      {isHovering 
                        ? 'my #1 artist on spotify for 5 years straight' 
                        : 'hover to hear what i listen to'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

        {/* Footer */}
        <Footer />
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-3xl w-full animate-[scaleIn_0.3s_ease-out]">
            {/* Close button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-[var(--accent-primary)] transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            
            {/* Image */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[var(--accent-primary)] shadow-2xl bg-black">
              <Image
                src="/images/mebuildingaudiofy5.jpg"
                alt="picture of me building audiofy"
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
            
            {/* Caption */}
            <p className="text-center text-[var(--text-secondary)] mt-4 text-sm">
              building audiofy 🎵
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


