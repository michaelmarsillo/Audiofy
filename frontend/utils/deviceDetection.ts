/**
 * Device Detection Utilities
 */

/**
 * Detects if the user is on iOS (iPhone, iPad, iPod)
 * ULTRA strict - ONLY returns true for actual iOS devices
 * Desktop browsers (Windows/Mac/Linux) will NEVER return true
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  
  // Must have iPhone, iPad, or iPod in user agent
  const hasIOSDevice = /iphone|ipad|ipod/.test(ua);
  
  // Must NOT be a desktop OS (Windows, Mac, Linux)
  const isDesktop = /windows|macintosh|linux|x11/.test(ua) && !/iphone|ipad|ipod/.test(ua);
  
  // Only return true if it's an iOS device AND not desktop
  return hasIOSDevice && !isDesktop;
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

