'use client';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center">
        {/* Clean spinner */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-[var(--bg-accent)] rounded-full"></div>
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-[var(--accent-primary)] rounded-full animate-[spin_1s_linear_infinite]"></div>
          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Loading Quiz
        </h2>
        <p className="text-[var(--text-secondary)]">
          Preparing your music challenge<span className="animate-pulse">...</span>
        </p>
      </div>
    </div>
  );
}
