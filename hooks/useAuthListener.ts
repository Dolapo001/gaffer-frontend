'use client'

import { useEffect } from 'react'
import { onAuthChange } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'

export function useAuthListener() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [setUser, setLoading])
}
