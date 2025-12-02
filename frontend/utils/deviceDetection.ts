/**
 * Device Detection Utilities
 */

/**
 * Detects if the user is on iOS (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+
}

/**
 * Detects if the user is on iOS Safari specifically
 */
export function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isIOSDevice = isIOS();
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  return isIOSDevice && isSafari;
}

