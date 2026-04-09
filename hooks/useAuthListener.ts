'use client'

import { useEffect } from 'react'
import { refreshToken } from '@/lib/services/auth.service'
import { useAuthStore } from '@/store/authStore'

/**
 * On every app mount, silently restores the session via the rt HttpOnly cookie.
 *
 * WHY we always call refreshToken() — even when Zustand says isAuthenticated:
 *   The access token persisted in localStorage is a short-lived JWT that will
 *   be expired the next time the app opens. Skipping the refresh just to avoid
 *   one network call guarantees stale state and forces the 401 interceptor to
 *   pick up the slack — which only works if the very first API call returns 401.
 *   Pages that use cached React Query data may never trigger a 401, leaving the
 *   user with a dead token until they hit a live endpoint.
 *
 *   Always refreshing on startup means:
 *     rt cookie valid   → fresh access token  → user stays logged in ✅
 *     rt cookie missing → setUser(null)       → clean redirect to /auth/login ✅
 */
export function useAuthListener() {
  const { setUser, setLoading, setRole } = useAuthStore()

  useEffect(() => {
    // Hydrate role from cookie immediately as a fast initial hint.
    // It will be overwritten by the authoritative value returned from /auth/refresh.
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/gaffer-user-role=([^;]+)/)
      if (match?.[1]) {
        setRole(match[1] as 'personal' | 'organization')
      }
    }

    let cancelled = false
    setLoading(true)

    refreshToken()
      .then((res) => {
        if (cancelled) return
        // Use the role returned by the server — it is the ground truth.
        if (res.user?.lastRole) {
          setRole(res.user.lastRole as 'personal' | 'organization')
        }
        setUser(res.user, res.accessToken)
      })
      .catch(() => {
        if (cancelled) return
        // rt cookie missing or expired — session is dead, clear local state.
        // IMPORTANT: only clear if the user hasn't authenticated through another
        // path (e.g. login form) while this startup refresh was in-flight.
        // If we clear unconditionally, a fresh login gets immediately reverted
        // when this stale 401 response lands — causing a permanent loading deadlock.
        const { isAuthenticated: alreadyAuthed } = useAuthStore.getState()
        if (!alreadyAuthed) {
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
