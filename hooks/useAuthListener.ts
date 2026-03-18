'use client'

import { useEffect } from 'react'
import { refreshToken } from '@/lib/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { tokenStore } from '@/lib/api'

/**
 * On mount, attempts to silently restore the session via the rt HttpOnly cookie.
 * If the refresh succeeds the access token is stored and the user is set.
 * If it fails (no cookie / expired) the user remains unauthenticated.
 */
export function useAuthListener() {
  const { setUser, setLoading, isAuthenticated, accessToken } = useAuthStore()

  useEffect(() => {
    // If we already have a valid token in memory, no need to refresh
    if (isAuthenticated && tokenStore.get()) {
      return
    }

    let cancelled = false
    setLoading(true)

    refreshToken()
      .then((res) => {
        if (cancelled) return
        setUser(res.user, res.accessToken)
      })
      .catch(() => {
        // No valid refresh cookie — user must log in
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
