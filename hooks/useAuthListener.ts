'use client'

import { useEffect } from 'react'
import { onAuthChange } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'

/**
 * Subscribes to Firebase onAuthStateChanged and syncs the result to Zustand.
 * Safe to call multiple times — the listener is a no-op after the first mount.
 */
export function useAuthListener() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onAuthChange((user) => {
      // Cast to the store's User type — Firebase User is a superset
      setUser(user as Parameters<typeof setUser>[0])
      setLoading(false)
    })
    return () => unsubscribe()
  }, [setUser, setLoading])
}
