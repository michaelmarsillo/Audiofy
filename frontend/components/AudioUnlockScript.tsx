'use client';

import { useEffect } from 'react';
import { unlockAudio } from '@/utils/audioUnlock';

/**
 * Simple global audio unlock - unlocks on first user interaction
 * This ensures audio works naturally on iOS Safari
 */
export function AudioUnlockScript() {
  useEffect(() => {
    const handleInteraction = () => {
      unlockAudio();
      // Remove listeners after first unlock
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction, { once: true, passive: true });
    document.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
  }, []);

  return null;
}

