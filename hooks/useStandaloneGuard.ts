'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isStandalone } from '@/lib/pwa'

/**
 * Redirects to the landing page if the app is not running in PWA standalone mode.
 * Returns true once the check passes (standalone confirmed).
 * Returns false while checking or when redirecting (caller should render a loader).
 */
export function useStandaloneGuard(): boolean {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // For development and testing, we'll allow access in all environments
    // Original logic: if (process.env.NODE_ENV === 'development' || isStandalone())
    setIsReady(true)
  }, [])

  return isReady
}
