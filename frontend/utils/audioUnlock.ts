/**
 * iOS Safari Audio Unlock Utility
 * 
 * iOS Safari requires user interaction to unlock audio playback.
 * This utility creates a global audio unlock mechanism that persists
 * across all game rounds and components.
 */

let audioUnlocked = false;
let unlockAudioElement: HTMLAudioElement | null = null;

/**
 * Unlocks audio playback for iOS Safari
 * Must be called in response to a user interaction (click, touch, etc.)
 */
export function unlockAudio(): void {
  if (audioUnlocked) return;

  try {
    // Create a silent audio element to unlock autoplay
    unlockAudioElement = new Audio();
    unlockAudioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    unlockAudioElement.volume = 0.01; // Very quiet but not silent
    unlockAudioElement.play()
      .then(() => {
        audioUnlocked = true;
        console.log('✅ Audio unlocked for iOS');
      })
      .catch((error) => {
        console.warn('⚠️ Audio unlock failed:', error);
      });
  } catch (error) {
    console.warn('⚠️ Audio unlock error:', error);
  }
}

/**
 * Ensures audio is unlocked before playing
 * Call this before any audio.play() on iOS
 */
export async function ensureAudioUnlocked(audio: HTMLAudioElement): Promise<void> {
  if (!audioUnlocked) {
    unlockAudio();
    // Wait a bit for unlock to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Check if audio is currently unlocked
 */
export function isAudioUnlocked(): boolean {
  return audioUnlocked;
}

/**
 * Reset unlock state (useful for testing)
 */
export function resetAudioUnlock(): void {
  audioUnlocked = false;
  if (unlockAudioElement) {
    unlockAudioElement.pause();
    unlockAudioElement = null;
  }
}

