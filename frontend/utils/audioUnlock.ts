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
 * 
 * IMPORTANT: On iOS, this must be called synchronously or in direct response
 * to user interaction. Async delays can break the unlock chain.
 */
export async function ensureAudioUnlocked(audio: HTMLAudioElement): Promise<void> {
  // Check if already unlocked
  if (unlockedElements.has(audio)) {
    return;
  }

  // First ensure global unlock (for initial user interaction)
  if (!globalUnlocked) {
    unlockAudio();
  }
  
  // Unlock this specific element immediately (iOS requirement)
  // We do this synchronously to maintain the user interaction chain
  return new Promise((resolve) => {
    try {
      // Save current state
      const originalSrc = audio.src || '';
      const originalVolume = audio.volume;
      const hadSrc = originalSrc.length > 0;

      // Play silent sound to unlock this specific element
      // This MUST happen synchronously for iOS
      audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      audio.volume = 0.01;
      
      // Try to play immediately
      const playPromise = audio.play();
      
      // Handle play promise
      if (playPromise) {
        playPromise
          .then(() => {
            // Success - pause and restore
            audio.pause();
            audio.currentTime = 0;
            if (hadSrc) {
              audio.src = originalSrc;
            } else {
              audio.src = '';
            }
            audio.volume = originalVolume;
            unlockedElements.add(audio);
            console.log('✅ Audio element unlocked for iOS');
            resolve();
          })
          .catch(() => {
            // If play fails, restore anyway and mark as attempted
            audio.pause();
            audio.currentTime = 0;
            if (hadSrc) {
              audio.src = originalSrc;
            } else {
              audio.src = '';
            }
            audio.volume = originalVolume;
            // Still mark as unlocked attempt - might work on next try
            unlockedElements.add(audio);
            console.warn('⚠️ Audio unlock play failed, but element marked as attempted');
            resolve();
          });
      } else {
        // No promise returned - restore immediately
        if (hadSrc) {
          audio.src = originalSrc;
        } else {
          audio.src = '';
        }
        audio.volume = originalVolume;
        unlockedElements.add(audio);
        resolve();
      }
    } catch (error) {
      console.warn('⚠️ Audio element unlock failed:', error);
      // If unlock fails, try to restore anyway
      if (audio.src.includes('data:audio')) {
        audio.src = '';
      }
      resolve(); // Resolve anyway to not block
    }
  });
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

