'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { setDeferredPrompt } from '@/lib/pwa'
import { refreshToken } from '@/lib/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { tokenStore, ApiError } from '@/lib/api'

// Minimum gap between proactive refreshes when returning from background.
// Prevents hammering /auth/refresh on rapid tab switches.
const VISIBILITY_REFRESH_DEBOUNCE_MS = 5 * 60 * 1000

export function PWAProvider({ children }: { children: ReactNode }) {
  const { setUser, setRole } = useAuthStore()
  const lastRefreshAtRef = useRef<number>(0)

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // When the PWA returns from background the existing useAuthListener
    // useEffect (dependency array []) does NOT re-run — only mount fires it.
    // If the short-lived access token expired while in the background, the
    // first API call would 401, trigger a refresh, and succeed silently.
    // But if the rt HttpOnly cookie is also gone (iOS ITP purges cross-origin
    // cookies after inactivity), that refresh also fails and the user is
    // force-ejected mid-session. Proactively refreshing on visibility change
    // catches the dead-session case before any API call fires.
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return

      const { isAuthenticated } = useAuthStore.getState()
      if (!isAuthenticated) return

      const now = Date.now()
      if (now - lastRefreshAtRef.current < VISIBILITY_REFRESH_DEBOUNCE_MS) return
      lastRefreshAtRef.current = now

      try {
        const res = await refreshToken()
        if (res.user?.lastRole) setRole(res.user.lastRole as 'personal' | 'organization')
        setUser(res.user, res.accessToken)
      } catch (err) {
        // Only eject on a definitive auth failure (401). Network errors
        // (offline, timeout) are ignored — the 401 interceptor will retry
        // when the next real API call fires.
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear()
          setUser(null)
          if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login'
          }
        }
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [setUser, setRole])

  return <>{children}</>
}
