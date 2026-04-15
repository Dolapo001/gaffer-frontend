'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isStandalone } from '@/lib/pwa'

/**
 * Returns true immediately (synchronously) for routes that never need the
 * PWA-standalone check, so no blocking overlay is ever painted on them.
 */
function isAlwaysAllowed(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/onboarding/') ||
    // Public invite + recruitment routes — must work in a regular browser
    // without the PWA being installed (shared links, email links, etc.)
    pathname.startsWith('/recruit/') ||
    pathname.startsWith('/player/onboarding') ||
    pathname.startsWith('/organization/onboarding')
  )
}

export function BrowserProtection({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // Initialise as `true` for public / onboarding routes so we never block
  // them with the full-screen overlay (which prevented button clicks).
  const [isReady, setIsReady] = useState(() => isAlwaysAllowed(pathname))

  useEffect(() => {
    // Public / onboarding routes are always allowed — nothing to check.
    if (isAlwaysAllowed(pathname)) {
      setIsReady(true)
      return
    }

    // For protected routes: require PWA standalone mode in production.
    if (!isStandalone() && process.env.NODE_ENV !== 'development') {
      router.replace('/')
    } else {
      setIsReady(true)
    }
  }, [pathname, router])

  // Only show the black overlay for protected routes while the check is pending.
  if (!isReady) {
    return <div className="fixed inset-0 bg-[#181928] z-[9999]" />
  }

  return <>{children}</>
}
