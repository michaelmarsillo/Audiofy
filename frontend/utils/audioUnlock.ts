/**
 * iOS Safari Audio Unlock Utility
 * 
 * iOS Safari requires user interaction to unlock audio playback.
 * The key insight: iOS requires unlock on the SAME audio element that will play.
 * This utility unlocks audio on the actual element that will be used.
 */

let globalUnlocked = false;
let unlockAudioElement: HTMLAudioElement | null = null;

// Track which audio elements have been unlocked
const unlockedElements = new WeakSet<HTMLAudioElement>();

/**
 * Unlocks audio playback globally (for initial user interaction)
 * Must be called in response to a user interaction (click, touch, etc.)
 */
export function unlockAudio(): void {
  if (globalUnlocked) return;

  try {
    // Create a silent audio element to unlock autoplay
    unlockAudioElement = new Audio();
    unlockAudioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    unlockAudioElement.volume = 0.01; // Very quiet but not silent
    unlockAudioElement.play()
      .then(() => {
        globalUnlocked = true;
        console.log('✅ Global audio unlocked for iOS');
      })
      .catch((error) => {
        console.warn('⚠️ Global audio unlock failed:', error);
      });
  } catch (error) {
    console.warn('⚠️ Global audio unlock error:', error);
  }
}

/**
 * Unlocks a specific audio element by playing a silent sound on it
 * This is the key fix for iOS - unlock must happen on the SAME element
 */
async function unlockSpecificElement(audio: HTMLAudioElement): Promise<void> {
  if (unlockedElements.has(audio)) {
    return; // Already unlocked
  }

  try {
    // Save current state
    const originalSrc = audio.src || '';
    const originalVolume = audio.volume;
    const hadSrc = originalSrc.length > 0;

    // Play silent sound to unlock this specific element
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    audio.volume = 0.01;
    
    await audio.play();
    
    // Restore original state
    audio.pause();
    audio.currentTime = 0;
    if (hadSrc) {
      audio.src = originalSrc;
    } else {
      audio.src = ''; // Clear if it was empty
    }
    audio.volume = originalVolume;
    
    // Mark as unlocked
    unlockedElements.add(audio);
    
    console.log('✅ Audio element unlocked for iOS');
  } catch (error) {
    console.warn('⚠️ Audio element unlock failed:', error);
    // If unlock fails, try to restore anyway
    if (audio.src.includes('data:audio')) {
      audio.src = '';
    }
  }
}

/**
 * Ensures audio is unlocked before playing
 * This unlocks the specific audio element (iOS requirement)
 * Call this before any audio.play() on iOS
 */
export async function ensureAudioUnlocked(audio: HTMLAudioElement): Promise<void> {
  // First ensure global unlock (for initial user interaction)
  if (!globalUnlocked) {
    unlockAudio();
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Then unlock this specific element (iOS requirement)
  if (!unlockedElements.has(audio)) {
    await unlockSpecificElement(audio);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Check if audio is currently unlocked globally
 */
export function isAudioUnlocked(): boolean {
  return globalUnlocked;
}

/**
 * Check if a specific audio element is unlocked
 */
export function isElementUnlocked(audio: HTMLAudioElement): boolean {
  return unlockedElements.has(audio);
}

/**
 * Reset unlock state (useful for testing)
 */
export function resetAudioUnlock(): void {
  globalUnlocked = false;
  if (unlockAudioElement) {
    unlockAudioElement.pause();
    unlockAudioElement = null;
  }
  // Note: Can't clear WeakSet, but that's okay for testing
}

