'use client'

import { useEffect, type ReactNode } from 'react'
import { registerServiceWorker, setDeferredPrompt } from '@/lib/pwa'

export function PWAProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker()

    // Capture Chrome's install prompt globally
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  return <>{children}</>
}
