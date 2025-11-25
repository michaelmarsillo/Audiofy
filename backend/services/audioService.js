const axios = require('axios');

class AudioService {
  constructor() {
    // Recently played tracks cache (per playlist)
    this.recentlyPlayed = new Map(); // Map<playlistId, Set<trackId>>
    this.CACHE_SIZE = 50; // Remember last 50 tracks per playlist
    
    // Playlist-based artist configurations (matches frontend PLAYLISTS)
    this.playlistArtists = {
      // Popular Songs playlists
      'top-charts': ['Taylor Swift', 'Ariana Grande', 'Justin Bieber', 'Harry Styles', 'Beyonce', 'Billie Eilish', 'The Weeknd', 'Ed Sheeran', 'Drake', 'Dua Lipa', 'Post Malone', 'Olivia Rodrigo'],
      'all-time-hits': ['Queen', 'Michael Jackson', 'The Beatles', 'Madonna', 'Prince', 'Whitney Houston', 'Elton John', 'ABBA', 'Stevie Wonder', 'David Bowie'],
      
      // Pop playlists
      'pop-2020': ['Dua Lipa', 'The Weeknd', 'Harry Styles', 'Olivia Rodrigo', 'Billie Eilish', 'Ariana Grande', 'Taylor Swift', 'Ed Sheeran'],
      'forever-pop': ['Madonna', 'Michael Jackson', 'Britney Spears', 'Christina Aguilera', 'Justin Timberlake', 'Mariah Carey', 'Whitney Houston', 'Backstreet Boys'],
      
      // Hip Hop & Rap playlists
      'rap-hits': ['Drake', 'Kendrick Lamar', 'J. Cole', 'Travis Scott', 'Kanye West', 'Lil Baby', 'Future', 'Megan Thee Stallion', 'Cardi B', 'Post Malone'],
      'old-school-hip-hop': ['2Pac', 'The Notorious B.I.G.', 'Nas', 'Wu-Tang Clan', 'Snoop Dogg', 'Dr. Dre', 'Eminem', 'Jay-Z', 'OutKast', 'A Tribe Called Quest'],
      'best-of-gen-z': [
        // Core Gen-Z
        'Juice WRLD', 'Polo G', 'Lil Tjay', 'Gunna', 'Playboi Carti', 'Travis Scott', '21 Savage', 'XXXTentacion', 'Lil Uzi Vert', 'Trippie Redd',
        // Expanded Gen-Z
        'Lil Baby', 'DaBaby', 'Rod Wave', 'Lil Durk', 'NBA YoungBoy', 'Roddy Ricch', 'Pop Smoke', 'Lil Tecca', 'Iann Dior', 'The Kid LAROI',
        // More variety
        'Jack Harlow', 'Cordae', 'Ski Mask The Slump God', 'Denzel Curry', 'JID', 'Amine'
      ],
      
      // Rock playlists
      'rock-classics': ['Queen', 'Led Zeppelin', 'The Beatles', 'AC/DC', "Guns N' Roses", 'Red Hot Chili Peppers', 'Pink Floyd', 'The Rolling Stones', 'Aerosmith', 'Van Halen'],
      'divorced-dad-rock': ['Metallica', 'Deftones', 'Green Day', 'Blink-182', 'My Chemical Romance', 'System of a Down', 'Tool', 'Rage Against the Machine', 'Linkin Park', 'Sum 41'],
      
      // Metal playlists
      'metal-classics': ['Metallica', 'Iron Maiden', 'Black Sabbath', 'Slayer', 'Megadeth', 'Pantera', 'Judas Priest', 'Motorhead', 'Anthrax', 'Dio'],
      'metal-bangers': ['Iron Maiden', 'Metallica', 'Nirvana', 'Three Days Grace', 'Ozzy Osbourne', 'Black Sabbath', 'Slayer', 'Megadeth'],
      
      // Country playlists
      'country-hits': ['Luke Combs', 'Morgan Wallen', 'Carrie Underwood', 'Blake Shelton', 'Keith Urban', 'Miranda Lambert', 'Chris Stapleton', 'Thomas Rhett'],
      'classic-country': ['Dolly Parton', 'Johnny Cash', 'Willie Nelson', 'Garth Brooks', 'Shania Twain', 'Alan Jackson', 'George Strait', 'Reba McEntire'],

      // Decade playlists - SUPERCHARGED with deep cuts and one-hit wonders!
      '80s-hits': [
        // Superstars
        'Michael Jackson', 'Madonna', 'Prince', 'Queen', 'Whitney Houston', 'George Michael', 'Bon Jovi', 'U2', 'The Police', 'Guns N\' Roses', 'Phil Collins', 'Janet Jackson', 'Cyndi Lauper', 'Bruce Springsteen', 'Duran Duran',
        // One-hit wonders & iconic tracks
        'A-ha', 'Toto', 'Soft Cell', 'Men Without Hats', 'The Buggles', 'Kajagoogoo', 'Flock of Seagulls', 'Berlin', 'Cutting Crew', 'Tommy Tutone', 'Dexys Midnight Runners', 'Nena', 'Frankie Goes to Hollywood', 'Dead or Alive', 'Wang Chung',
        // New Wave & Synth Pop
        'Tears for Fears', 'The Cure', 'Depeche Mode', 'New Order', 'Simple Minds', 'Eurythmics', 'Pet Shop Boys', 'Bananarama', 'Culture Club', 'Wham!', 'Human League', 'Yazoo', 'OMD', 'Thompson Twins', 'Howard Jones',
        // Rock & Pop Rock
        'Journey', 'Foreigner', 'Toto', 'REO Speedwagon', 'Survivor', 'Starship', 'Heart', 'Pat Benatar', 'Joan Jett', 'The Bangles', 'Go-Gos', 'Blondie', 'Talking Heads', 'The Cars', 'INXS',
        // Power Ballads & Soft Rock
        'Rick Astley', 'Belinda Carlisle', 'Tiffany', 'Debbie Gibson', 'Kim Wilde', 'Laura Branigan', 'Irene Cara', 'Kenny Loggins', 'Christopher Cross', 'Air Supply',
        // Dance & Disco
        'Donna Summer', 'Kool & The Gang', 'Earth Wind & Fire', 'Chic', 'Sister Sledge', 'Lipps Inc', 'Rick James', 'Cameo'
      ],
      '90s-hits': [
        // Superstars
        'Nirvana', 'Mariah Carey', 'Celine Dion', 'Tupac', 'Notorious B.I.G.', 'Britney Spears', 'Backstreet Boys', 'Spice Girls', 'Radiohead', 'Red Hot Chili Peppers', 'Green Day', 'Pearl Jam', 'Destiny\'s Child', 'TLC', 'Boyz II Men',
        // One-hit wonders & iconic tracks
        'Chumbawamba', 'Len', 'Semisonic', 'Harvey Danger', 'Natalie Imbruglia', 'Spacehog', 'Fastball', 'New Radicals', 'Primitive Radio Gods', 'Deep Blue Something', 'Marcy Playground', 'Eagle-Eye Cherry', 'Tal Bachman', 'Blessid Union of Souls',
        // Alternative & Grunge
        'Smash Mouth', 'Third Eye Blind', 'Matchbox Twenty', 'Goo Goo Dolls', 'Everclear', 'Bush', 'Stone Temple Pilots', 'Alice in Chains', 'Soundgarden', 'The Cranberries', 'No Doubt', 'Garbage', 'Weezer', 'Oasis', 'Blur',
        // Pop & Dance
        'Ace of Base', 'Aqua', 'Vengaboys', 'Haddaway', 'Corona', 'Snap!', 'Real McCoy', '2 Unlimited', 'La Bouche', 'Amber', 'C+C Music Factory', 'Technotronic',
        // R&B & Hip Hop
        'Montell Jordan', 'Blackstreet', 'Ginuwine', 'Aaliyah', 'Usher', 'Brandy', 'Monica', 'En Vogue', 'SWV', 'Coolio', 'Naughty by Nature', 'Salt-N-Pepa', 'MC Hammer', 'Vanilla Ice', 'Sir Mix-a-Lot',
        // Pop Rock & Boy Bands
        '*NSYNC', '98 Degrees', 'O-Town', 'LFO', 'Hanson', 'Savage Garden', 'Sixpence None the Richer', 'Natalie Merchant', 'Sheryl Crow', 'Alanis Morissette', 'Jewel', 'Sarah McLachlan'
      ]
    };

  }

  // Helper to normalize strings (remove accents, lowercase)
  normalizeString(str) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Get tracks by playlist ID (optimized for specific playlists with anti-duplicate logic)
  async getTracksByPlaylist(playlistId, limit = 30) {
    try {
      console.log(`🎵 Getting tracks for playlist: ${playlistId}`);
      
      const artists = this.playlistArtists[playlistId];
      if (!artists || artists.length === 0) {
        throw new Error(`Unknown playlist: ${playlistId}`);
      }

      // Get recently played tracks for this playlist
      if (!this.recentlyPlayed.has(playlistId)) {
        this.recentlyPlayed.set(playlistId, new Set());
      }
      const recentTracks = this.recentlyPlayed.get(playlistId);

      // STRATEGY: Randomly select a subset of artists for variety
      // For large playlists (80s/90s), pick 15 random artists per request
      // For smaller playlists, shuffle ALL artists to vary the order
      const artistsToUse = artists.length > 20 
        ? this.shuffleArray([...artists]).slice(0, 15) // Pick 15 random artists
        : this.shuffleArray([...artists]); // Shuffle all artists for variety

      console.log(`📋 Selected ${artistsToUse.length} artists from ${artists.length} total`);

      const tracks = [];
      
      // Fetch MORE songs per artist for better variety
      const songsPerArtist = Math.max(5, Math.ceil(limit / artistsToUse.length) + 3);
      
      for (const artist of artistsToUse) {
        const artistTracks = await this.searchItunes(artist, songsPerArtist, true);
        tracks.push(...artistTracks);
        
        // Stop if we have enough tracks
        if (tracks.length >= limit * 3) break; // Fetch 3x limit for even better randomization
      }

      // Remove duplicates
      const uniqueTracks = this.removeDuplicateTracks(tracks);
      
      // Filter out recently played tracks
      const freshTracks = uniqueTracks.filter(track => 
        track.preview_url && 
        track.preview_url !== '' &&
        !recentTracks.has(track.id)
      );

      // If we filtered out too many, fall back to all unique tracks
      const tracksToUse = freshTracks.length >= limit ? freshTracks : uniqueTracks.filter(track => track.preview_url && track.preview_url !== '');

      // Randomize with Fisher-Yates and take what we need
      const finalTracks = this.shuffleArray(tracksToUse).slice(0, limit);

      // Update recently played cache
      finalTracks.forEach(track => {
        recentTracks.add(track.id);
      });

      // Limit cache size (keep only last N tracks)
      if (recentTracks.size > this.CACHE_SIZE) {
        const tracksArray = Array.from(recentTracks);
        const toRemove = tracksArray.slice(0, tracksArray.length - this.CACHE_SIZE);
        toRemove.forEach(id => recentTracks.delete(id));
      }

      console.log(`✅ Found ${finalTracks.length} tracks for playlist: ${playlistId} (${recentTracks.size} in cache)`);
      return finalTracks;
      
    } catch (error) {
      console.error(`❌ Failed to get tracks for playlist ${playlistId}:`, error.message);
      throw error;
    }
  }

  // Fisher-Yates shuffle for true randomization
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }


  // Search iTunes API
  async searchItunes(searchTerm, limit = 10, strictMode = false) {
    try {
      // Fetch MORE songs for better variety (iTunes returns by popularity, so we need more to randomize)
      const fetchLimit = Math.min(limit * 5, 200);
      
      const response = await axios.get('https://itunes.apple.com/search', {
        params: {
          term: searchTerm,
          entity: 'song',
          limit: fetchLimit,
          country: 'US',
          explicit: 'Yes' // Allow explicit content for better variety
        },
        timeout: 10000 // 10 second timeout
      });

      const tracks = response.data.results
        .filter(track => {
          // Must have all required fields
          if (!track.previewUrl || !track.trackName || !track.artistName || !track.artworkUrl100) {
            return false;
          }
          
          // If strict mode is OFF (e.g. general search), we trust iTunes results more
          if (!strictMode) {
            return true;
          }
          
          // IMPORTANT: Filter out featured artists
          // Only include if the search term artist is the PRIMARY artist (not featuring)
          const artistName = this.normalizeString(track.artistName);
          const searchTermNormalized = this.normalizeString(searchTerm);
          
          // Check if it's a featured artist (has "feat.", "ft.", "&", "featuring", etc.)
          const isFeatured = artistName.includes('feat.') || 
                            artistName.includes('ft.') || 
                            artistName.includes('featuring') ||
                            artistName.includes(' & ') ||
                            artistName.includes(' x ');
          
          // If there's a featuring artist situation, only include if our artist is FIRST
          if (isFeatured) {
            // Split by common delimiters and check if search term is the first artist
            const firstArtist = artistName.split(/feat\.|ft\.|featuring|&|x/i)[0].trim();
            return firstArtist.includes(searchTermNormalized) || searchTermNormalized.includes(firstArtist);
          }
          
          // STRICT CHECK: The artist name MUST contain the search term
          // This prevents fetching songs named "Juice WRLD" by "Random Artist"
          return artistName.includes(searchTermNormalized) || searchTermNormalized.includes(artistName);
        })
        .map(track => ({
          id: track.trackId,
          name: track.trackName,
          artist: track.artistName,
          preview_url: track.previewUrl,
          album: track.collectionName || track.trackName,
          image: track.artworkUrl100?.replace('100x100', '300x300') || track.artworkUrl100, // Higher res artwork
          itunes_url: track.trackViewUrl,
          genre: track.primaryGenreName || 'Unknown',
          release_date: track.releaseDate,
          provider: 'itunes'
        }));

      console.log(`🎼 iTunes search for "${searchTerm}": found ${tracks.length} tracks with previews`);
      return tracks.slice(0, limit);
      
    } catch (error) {
      console.error(`❌ iTunes search failed for "${searchTerm}":`, error.message);
      return [];
    }
  }

  // Remove duplicate tracks based on artist + title similarity
  removeDuplicateTracks(tracks) {
    const seen = new Set();
    return tracks.filter(track => {
      const key = `${track.artist.toLowerCase()}-${track.name.toLowerCase()}`.replace(/[^a-z0-9]/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Generate quiz questions from tracks (ARTIST guessing for solo play)
  generateQuizQuestions(tracks, questionCount = 10) {
    if (tracks.length < questionCount) {
      throw new Error(`Not enough tracks found. Need ${questionCount}, got ${tracks.length}`);
    }

    // Fisher-Yates shuffle for better randomization
    const shuffled = [...tracks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const selectedTracks = shuffled.slice(0, questionCount);
    
    return selectedTracks.map((track, index) => {
      // Generate wrong ARTIST answers from other tracks
      const wrongArtists = tracks
        .filter(t => t.id !== track.id && t.artist !== track.artist)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(t => t.artist);

      // Remove duplicates
      const uniqueWrongArtists = [...new Set(wrongArtists)];

      // If not enough unique wrong artists, add more from the pool
      while (uniqueWrongArtists.length < 3) {
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        if (randomTrack.artist !== track.artist && !uniqueWrongArtists.includes(randomTrack.artist)) {
          uniqueWrongArtists.push(randomTrack.artist);
        }
      }

      // Combine and shuffle options (ARTIST NAMES)
      const options = [track.artist, ...uniqueWrongArtists.slice(0, 3)].sort(() => Math.random() - 0.5);

      return {
        id: index + 1,
        track_id: track.id,
        preview_url: track.preview_url,
        correct_answer: track.artist, // ARTIST is the correct answer now!
        options: options, // ARTIST options
        artist: track.artist,
        album: track.album,
        image: track.image,
        genre: track.genre,
        provider: track.provider,
        song_name: track.name // Keep song name for reveal phase
      };
    });
  }

  // Get Daily Heardle (deterministic based on date)
  async getDailyHeardle(dateStr) {
    try {
      // 1. Seed generation from date string (YYYY-MM-DD)
      const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // 2. Select a playlist deterministically
      const playlists = ['top-charts', 'all-time-hits', 'pop-2020', 'rap-hits', 'rock-classics', 'country-hits'];
      const playlistIndex = seed % playlists.length;
      const selectedPlaylist = playlists[playlistIndex];
      
      // 3. Select an artist deterministically
      const artists = this.playlistArtists[selectedPlaylist];
      const artistIndex = (seed * 7) % artists.length; // Multiply by prime for variance
      const selectedArtist = artists[artistIndex];
      
      console.log(`📅 Daily Heardle (${dateStr}): Playlist=${selectedPlaylist}, Artist=${selectedArtist}`);

      // 4. Fetch songs for that artist
      // We fetch 20 to have a good pool, then pick one
      const tracks = await this.searchItunes(selectedArtist, 20, true);
      
      if (!tracks || tracks.length === 0) {
        throw new Error('No tracks found for daily artist');
      }
      
      // 5. Pick a specific song deterministically
      // We use the day of the month and other factors to rotate songs
      const dayOfMonth = parseInt(dateStr.split('-')[2]) || 1;
      const songIndex = (seed + dayOfMonth) % tracks.length;
      
      return tracks[songIndex];
      
    } catch (error) {
      console.error('❌ Failed to get daily heardle:', error);
      // Fallback to a safe default if everything fails
      const fallback = await this.searchItunes('The Weeknd', 5);
      return fallback[0];
    }
  }

  // Get available playlists
  getAvailablePlaylists() {
    return Object.keys(this.playlistArtists);
  }

  // Test the service
  async testConnection() {
    try {
      const testTracks = await this.searchItunes('pop music', 5);
      return {
        status: 'success',
        message: 'iTunes API connection successful!',
        sample_tracks: testTracks.length,
        tracks: testTracks
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'iTunes API connection failed',
        error: error.message
      };
    }
  }
}

module.exports = new AudioService();
