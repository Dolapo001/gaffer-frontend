'use client'

import { useEffect } from 'react'
import { registerServiceWorker, setDeferredPrompt } from '@/lib/pwa'

export function usePWASetup() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker()

    // Capture the beforeinstallprompt event globally
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
}
