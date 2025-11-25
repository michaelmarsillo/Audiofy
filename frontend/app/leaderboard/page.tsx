'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  total_audiofy_score: number;
  total_games_played: number;
  solo_total_score: number;
  solo_games_played: number;
  multi_total_score: number;
  multi_games_played: number;
  multi_wins: number;
}

interface UserStats {
  user_id: number;
  username: string;
  solo_total_score: number;
  solo_games_played: number;
  solo_avg_score: number;
  solo_best_score: number;
  multi_total_score: number;
  multi_games_played: number;
  multi_wins: number;
  multi_avg_score: number;
  multi_best_score: number;
  total_audiofy_score: number;
  total_games_played: number;
  global_rank: number;
  solo_rank: number;
  multi_rank: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'solo' | 'multiplayer'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    if (user) {
      fetchUserStats();
    }
  }, [activeTab, user]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/leaderboard/${activeTab}?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('audiofy_token');
      if (!token) return;

      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user stats');
      
      const data = await response.json();
      setUserStats(data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
        <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
      </div>
    );
    if (rank === 2) return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
        <div className="w-3 h-3 rounded-full bg-gray-100"></div>
      </div>
    );
    if (rank === 3) return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
        <div className="w-3 h-3 rounded-full bg-orange-200"></div>
      </div>
    );
    return null;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[var(--accent-primary)] rounded-full blur-[200px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[800px] h-[800px] bg-[var(--music-purple)] rounded-full blur-[200px]"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-20 gap-4">
          <Link href="/" className="flex items-center gap-3 group cursor-pointer self-start sm:self-auto">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-300">Audiofy</h1>
          </Link>

          <Link
            href="/"
            className="px-5 py-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/30 transition-all duration-300 font-medium text-sm"
          >
            Back to Home
          </Link>
        </header>

        {/* Hero Title */}
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-[var(--text-primary)] mb-6 leading-tight tracking-tight">
            Leaderboard
          </h2>
          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent mx-auto mb-6"></div>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto font-light">
            Compete with players worldwide and climb the ranks
          </p>
        </div>

        {/* User Stats Card (if logged in) */}
        {user && userStats && (
          <div className="mb-10 p-8 rounded-2xl bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/20 transition-all duration-500">
            <h3 className="text-xl font-semibold mb-6 text-[var(--text-primary)] tracking-tight">
              Your Statistics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="relative overflow-hidden bg-[var(--bg-tertiary)]/50 rounded-xl p-6 border border-[var(--bg-accent)] hover:border-yellow-500/30 transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-widest font-medium">Global Rank</div>
                  <div className="text-4xl font-bold text-[var(--text-primary)] mb-3">
                    #{formatNumber(userStats.global_rank)}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] font-medium">
                    {formatNumber(userStats.total_audiofy_score)} <span className="text-[var(--text-muted)] font-normal">points</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-2 font-light">
                    {formatNumber(userStats.total_games_played)} games played
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-[var(--bg-tertiary)]/50 rounded-xl p-6 border border-[var(--bg-accent)] hover:border-[var(--music-blue)]/30 transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--music-blue)]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-widest font-medium">Solo Rank</div>
                  <div className="text-4xl font-bold text-[var(--text-primary)] mb-3">
                    #{formatNumber(userStats.solo_rank)}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] font-medium">
                    {formatNumber(userStats.solo_total_score)} <span className="text-[var(--text-muted)] font-normal">points</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-2 font-light">
                    {formatNumber(userStats.solo_games_played)} games • {Math.round(userStats.solo_avg_score)} avg
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-[var(--bg-tertiary)]/50 rounded-xl p-6 border border-[var(--bg-accent)] hover:border-[var(--music-green)]/30 transition-all duration-300 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--music-green)]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="text-xs text-[var(--text-muted)] mb-3 uppercase tracking-widest font-medium">Multiplayer Rank</div>
                  <div className="text-4xl font-bold text-[var(--text-primary)] mb-3">
                    #{formatNumber(userStats.multi_rank)}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)] font-medium">
                    {formatNumber(userStats.multi_total_score)} <span className="text-[var(--text-muted)] font-normal">points</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-2 font-light">
                    {userStats.multi_wins} wins • {formatNumber(userStats.multi_games_played)} games
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guest Message */}
        {!user && (
          <div className="mb-10 p-8 rounded-2xl bg-[var(--bg-secondary)]/50 backdrop-blur-sm border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/20 transition-all duration-500 text-center">
            <p className="text-xl font-semibold text-[var(--text-primary)] mb-3">
              Sign up to track your progress
            </p>
            <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto font-light">
              Create an account to compete with players worldwide
            </p>
            <Link 
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
            >
              Sign up now
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm ${
              activeTab === 'global'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/30'
            }`}
          >
            Global
          </button>
          <button
            onClick={() => setActiveTab('solo')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm ${
              activeTab === 'solo'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/30'
            }`}
          >
            Solo Play
          </button>
          <button
            onClick={() => setActiveTab('multiplayer')}
            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap text-sm ${
              activeTab === 'multiplayer'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--bg-accent)] hover:border-[var(--accent-primary)]/30'
            }`}
          >
            Multiplayer
          </button>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-[var(--bg-secondary)]/50 backdrop-blur-sm rounded-2xl border border-[var(--bg-accent)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="relative">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent border-[var(--accent-primary)]"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-[var(--accent-danger)] text-lg font-medium">{error}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-[var(--text-secondary)] text-lg">No players yet. Be the first!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-tertiary)]/30 border-b border-[var(--bg-accent)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Player</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Games</th>
                    {activeTab === 'multiplayer' && (
                      <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Wins</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = user && entry.user_id === Number(user.id);
                    const score = activeTab === 'global' 
                      ? (entry.total_audiofy_score ?? 0)
                      : activeTab === 'solo' 
                      ? (entry.solo_total_score ?? 0)
                      : (entry.multi_total_score ?? 0);
                    const games = activeTab === 'global'
                      ? (entry.total_games_played ?? 0)
                      : activeTab === 'solo'
                      ? (entry.solo_games_played ?? 0)
                      : (entry.multi_games_played ?? 0);

                    return (
                      <tr 
                        key={entry.user_id}
                        className={`border-b border-[var(--bg-accent)]/50 transition-all duration-200 ${
                          isCurrentUser 
                            ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30' 
                            : 'hover:bg-[var(--bg-tertiary)]/20'
                        }`}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {getRankMedal(entry.rank)}
                            <span className={`font-semibold text-lg ${entry.rank <= 3 ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                              {entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                              entry.rank === 1 ? 'from-yellow-400/20 to-yellow-600/20 ring-1 ring-yellow-500/30' :
                              entry.rank === 2 ? 'from-gray-300/20 to-gray-500/20 ring-1 ring-gray-400/30' :
                              entry.rank === 3 ? 'from-orange-400/20 to-orange-600/20 ring-1 ring-orange-500/30' :
                              'from-[var(--accent-primary)]/10 to-[var(--music-purple)]/10'
                            } flex items-center justify-center flex-shrink-0 transition-all duration-300`}>
                              <span className="text-[var(--text-primary)] font-semibold text-sm">
                                {entry.username[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-base text-[var(--text-primary)]">
                                {entry.username}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs px-2 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full border border-[var(--accent-primary)]/30 w-fit mt-1">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-xl text-[var(--text-primary)]">
                              {formatNumber(score)}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] font-light">points</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-[var(--text-secondary)] font-medium">
                            {formatNumber(games)}
                          </span>
                        </td>
                        {activeTab === 'multiplayer' && (
                          <td className="px-6 py-5 text-right">
                            <span className="text-[var(--text-primary)] font-semibold">
                              {formatNumber(entry.multi_wins)}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}