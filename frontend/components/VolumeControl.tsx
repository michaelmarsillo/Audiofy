'use client';

import { useState, createContext, useContext, ReactNode } from 'react';

// Create a context for volume control
interface VolumeContextType {
  siteVolume: number;
  setSiteVolume: (volume: number) => void;
}

const VolumeContext = createContext<VolumeContextType>({
  siteVolume: 0.1,
  setSiteVolume: () => {},
});

export const useVolume = () => useContext(VolumeContext);

// Provider component
export function VolumeProvider({ children }: { children: ReactNode }) {
  const [siteVolume, setSiteVolume] = useState(0.1); // Default 10%

  return (
    <VolumeContext.Provider value={{ siteVolume, setSiteVolume }}>
      {children}
    </VolumeContext.Provider>
  );
}

// Volume Control Button Component
export function VolumeControl() {
  const { siteVolume, setSiteVolume } = useVolume();
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setSiteVolume(newVolume);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Volume Control Popup */}
      {showVolumeControl && (
        <div className="absolute bottom-16 right-0 w-72 bg-[var(--bg-secondary)] border border-[var(--bg-accent)] rounded-xl shadow-2xl p-6 mb-2 slide-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--text-primary)] font-bold text-lg">site volume</h3>
            <button
              onClick={() => setShowVolumeControl(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Volume Slider */}
            <div className="flex items-center gap-4">
              <svg className="w-5 h-5 text-[var(--text-muted)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={siteVolume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-[var(--bg-accent)] rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-[var(--text-primary)] font-semibold text-sm min-w-[3rem] text-right">
                {Math.round(siteVolume * 100)}%
              </span>
            </div>
            
            <p className="text-[var(--text-muted)] text-xs">
              controls all audio playback on the site
            </p>
          </div>
        </div>
      )}

      {/* Settings Button */}
      <button
        onClick={() => setShowVolumeControl(!showVolumeControl)}
        className="w-14 h-14 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--music-purple)] rounded-full flex items-center justify-center shadow-lg hover:shadow-[0_0_30px_rgba(88,101,242,0.6)] transition-all hover:scale-110"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}

