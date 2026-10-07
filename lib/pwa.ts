/**
 * PWA Utilities for GAFFER
 * Detects standalone mode and manages install prompts
 */

// Detect if running as installed PWA (standalone mode)
export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false

  // Standard: CSS display-mode media query
  const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches

  // iOS Safari: navigator.standalone
  const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true

  // Android Chrome: referrer check
  const isAndroidStandalone = document.referrer.includes('android-app://')

  return isStandaloneMode || isIOSStandalone || isAndroidStandalone
}

// Detect iOS device for specific install instructions
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

// Detect Android device
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false
  return /android/i.test(window.navigator.userAgent)
}

// Detect Chrome browser (for install prompt API)
export const isChrome = (): boolean => {
  if (typeof window === 'undefined') return false
  return /chrome/i.test(window.navigator.userAgent) && !/edg/i.test(window.navigator.userAgent)
}

// Check if PWA is installable
export const isPWAInstallable = (): boolean => {
  return typeof window !== 'undefined' && 'BeforeInstallPromptEvent' in window
}

// Store for deferred install prompt
let deferredInstallPrompt: Event | null = null

export const setDeferredPrompt = (prompt: Event): void => {
  deferredInstallPrompt = prompt
}

export const getDeferredPrompt = (): Event | null => deferredInstallPrompt

export const clearDeferredPrompt = (): void => {
  deferredInstallPrompt = null
}

// Trigger native install prompt
export const triggerInstallPrompt = async (): Promise<boolean> => {
  if (!deferredInstallPrompt) return false

  const prompt = deferredInstallPrompt as Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }

  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  clearDeferredPrompt()
  return outcome === 'accepted'
}

// Register service worker
export const registerServiceWorker = async (): Promise<void> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('[GAFFER SW] Registered:', registration.scope)
  } catch (error) {
    console.error('[GAFFER SW] Registration failed:', error)
  }
}





