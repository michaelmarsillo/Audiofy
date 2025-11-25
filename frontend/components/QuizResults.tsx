'use client';

interface QuizResultsProps {
  results: {
    quiz_id: string;
    score: number;
    total_questions: number;
    percentage: number;
    results?: Array<{
      question_id: number;
      correct: boolean;
      correct_answer: string;
      selected_answer: string;
    }>;
  };
  onPlayAgain: () => void;
}

export function QuizResults({ results, onPlayAgain }: QuizResultsProps) {
  const getScoreMessage = (percentage: number) => {
    if (percentage === 100) return 'Perfect Score! You&apos;re a music master!';
    if (percentage >= 80) return 'Excellent! You really know your music!';
    if (percentage >= 60) return 'Good job! Not bad at all!';
    if (percentage >= 40) return 'Keep practicing! You&apos;ll get better!';
    return 'Don&apos;t give up! Music knowledge takes time to build!';
  };

  const getGradient = (percentage: number) => {
    if (percentage >= 80) return 'from-[var(--accent-success)] to-[var(--music-green)]';
    if (percentage >= 60) return 'from-[var(--accent-warning)] to-[var(--music-orange)]';
    return 'from-[var(--accent-danger)] to-[var(--music-pink)]';
  };

  return (
    <div className="glass rounded-3xl p-8 max-w-6xl mx-auto scale-in">
      {/* Compact Header with Score - Horizontal Layout */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
        {/* Left: Score Display */}
        <div className="flex items-center gap-6 slide-in-left">
          <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(102,126,234,0.6)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#667eea]/20 to-transparent animate-pulse" />
            <svg className="w-12 h-12 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-1">quiz complete!</h2>
            <p className="text-base text-[var(--text-secondary)]">
              {getScoreMessage(results.percentage)}
            </p>
          </div>
        </div>

        {/* Right: Big Percentage */}
        <div className="text-center slide-in-right">
          <div 
            className="text-7xl font-bold mb-2 bg-gradient-to-r from-[#667eea] via-[#764ba2] to-[#f093fb] bg-clip-text text-transparent animate-gradient"
            style={{ 
              backgroundSize: '200% 200%'
            }}
          >
            {results.percentage || 0}%
          </div>
          <div className="text-lg text-[var(--text-primary)]">
            <span className="font-bold">{results.score || 0}</span> / {results.total_questions || 7} correct
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[var(--bg-accent)] rounded-full h-4 overflow-hidden mb-8 slide-in-up">
        <div 
          className={`h-4 rounded-full transition-all duration-2000 ease-out bg-gradient-to-r ${getGradient(results.percentage)} shadow-[0_0_20px_rgba(168,85,247,0.5)]`}
          style={{ width: `${results.percentage}%` }}
        />
      </div>

      {/* Compact Stats - Horizontal */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-[var(--bg-secondary)] border border-[var(--accent-success)]/30 rounded-xl hover:border-[var(--accent-success)]/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300 slide-in-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-success)]/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--accent-success)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--accent-success)]">{results.score || 0}</div>
              <div className="text-xs text-[var(--text-muted)]">correct</div>
            </div>
          </div>
        </div>

        <div className="text-center p-4 bg-[var(--bg-secondary)] border border-[var(--accent-danger)]/30 rounded-xl hover:border-[var(--accent-danger)]/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300 slide-in-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-danger)]/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--accent-danger)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--accent-danger)]">{(results.total_questions || 7) - (results.score || 0)}</div>
              <div className="text-xs text-[var(--text-muted)]">wrong</div>
            </div>
          </div>
        </div>

        <div className="text-center p-4 bg-[var(--bg-secondary)] border border-[var(--music-purple)]/30 rounded-xl hover:border-[var(--music-purple)]/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 slide-in-up" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-[var(--music-purple)]/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--music-purple)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--music-purple)]">{results.total_questions || 7}</div>
              <div className="text-xs text-[var(--text-muted)]">total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Results - More Compact */}
      {results.results && results.results.length > 0 && (
        <div className="mb-6 slide-in-up" style={{animationDelay: '0.4s'}}>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 text-center">question breakdown</h3>
          <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar">
            {results.results.map((result, index) => (
            <div 
              key={result.question_id}
              className={`p-3 rounded-xl border transition-all duration-300 hover:scale-102 ${
                result.correct 
                  ? 'bg-[var(--accent-success)]/10 border-[var(--accent-success)]/30 hover:border-[var(--accent-success)]/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
                  : 'bg-[var(--accent-danger)]/10 border-[var(--accent-danger)]/30 hover:border-[var(--accent-danger)]/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  result.correct ? 'bg-[var(--accent-success)]/20' : 'bg-[var(--accent-danger)]/20'
                }`}>
                  {result.correct ? (
                    <svg className="w-4 h-4 text-[var(--accent-success)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-[var(--accent-danger)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] text-sm mb-1">
                    q{index + 1}: {result.correct_answer}
                  </div>
                  {!result.correct && result.selected_answer && (
                    <div className="text-xs text-[var(--accent-danger)] truncate">
                      you: {result.selected_answer}
                    </div>
                  )}
                  {!result.correct && !result.selected_answer && (
                    <div className="text-xs text-[var(--accent-warning)]">
                      time ran out
                    </div>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-6 justify-center slide-in-up" style={{animationDelay: '0.5s'}}>
        <button
          onClick={onPlayAgain}
          className="group btn-primary px-8 py-4 text-lg font-bold rounded-2xl"
        >
          <svg className="w-5 h-5 mr-3 inline group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
          play again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="group btn-secondary px-8 py-4 text-lg font-bold rounded-2xl"
        >
          <svg className="w-5 h-5 mr-3 inline group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
          </svg>
          home
        </button>
      </div>
    </div>
  );
} 