'use client'

import { useEffect, type ReactNode } from 'react'
import { setDeferredPrompt } from '@/lib/pwa'

export function PWAProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // next-pwa (register: true) handles SW registration automatically.
    // We only need to capture the install prompt here.
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  return <>{children}</>
}
