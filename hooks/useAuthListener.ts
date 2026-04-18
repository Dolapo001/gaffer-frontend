'use client'

import { useEffect } from 'react'
import { refreshToken } from '@/lib/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { tokenStore } from '@/lib/api'

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
        // Guard: only clear if no concurrent login set a fresh in-memory token
        // while this refresh was in-flight. accessToken is NOT persisted to
        // localStorage, so it is null on every cold start and only becomes
        // non-null when a real login/refresh succeeds. Using isAuthenticated
        // (the old guard) was wrong because it IS persisted — it is always true
        // on cold start, which prevented setUser(null) from ever running when
        // the rt cookie was expired, leaving the user in a zombie authenticated
        // state until the first API call forced an eject.
        const { accessToken: freshToken } = useAuthStore.getState()
        if (!freshToken) {
          tokenStore.clear()
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
