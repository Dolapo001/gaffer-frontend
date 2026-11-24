'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isStandalone } from '@/lib/pwa'
import { inviteInProgress } from '@/lib/afterAuth'

// The app's own top-level sections (same list as middleware.ts). Any other first segment is the
// /[competition]/[team] player sign-up link, which players open from WhatsApp in an ordinary browser.
const APP_SECTIONS = ['auth', 'admin', 'app', 'onboarding', 'organization', 'player', 'recruit', 'hq', 'coach']

/**
 * Returns true immediately (synchronously) for routes that never need the
 * PWA-standalone check, so no blocking overlay is ever painted on them.
 */
export function isAlwaysAllowed(pathname: string): boolean {
  const first = pathname.split('/').filter(Boolean)[0]
  if (first && !APP_SECTIONS.includes(first)) return true
  // Someone who opened a coach invite in their browser signs in or creates an account here, then goes back to the
  // invite: coaching happens in the browser, so they must not be sent away to install the app first
  if (pathname.startsWith('/auth') && hasPendingCoachInvite()) return true
  return (
    pathname === '/' ||
    pathname.startsWith('/onboarding/') ||
    // Gaffer HQ is used in an ordinary browser tab
    pathname.startsWith('/hq') ||
    // Coach mode is used in an ordinary browser tab too, even when the app is installed
    pathname.startsWith('/coach') ||
    // Password links (forgot password, organisation invites) are opened from email in a browser
    pathname.startsWith('/auth/reset-password') ||
    // Public invite + recruitment routes — must work in a regular browser
    // without the PWA being installed (shared links, email links, etc.)
    pathname.startsWith('/recruit/') ||
    // Staff invite links are shared on WhatsApp etc. and opened in a browser
    pathname.startsWith('/join/') ||
    pathname.startsWith('/invite/accept') ||
    pathname.startsWith('/player/onboarding') ||
    pathname.startsWith('/organization/onboarding')
  )
}

function hasPendingCoachInvite(): boolean {
  if (typeof window === 'undefined') return false
  // The address (?next=/coach/join/…) is checked as well as storage: iOS Safari can lose storage between pages
  return inviteInProgress()
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
