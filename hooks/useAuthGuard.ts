'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'
import { useToastStore } from '@/store/toastStore'

/**
 * Ensures the user is authenticated and optionally enforces a specific role.
 * Automatically displays a toast and redirects if validation fails.
 *
 * @param requiredRole Option to limit access to 'personal' or 'organization'
 * @returns boolean `isReady` flag indicating checks are fully complete and successful
 */
export function useAuthGuard(requiredRole?: 'personal' | 'organization') {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, role } = useAuthStore()
  const isStandaloneReady = useStandaloneGuard()

  // Track if we've shown the warning to prevent strict-mode double toasts
  const hasWarnedRef = useRef(false)

  // Wait for both PWA standalone checks and auth rehydration to settle
  const isReady = isStandaloneReady && !isLoading

  // Safety net: if a user is authenticated but has role=null (stale persisted
  // localStorage state from an old app version, or a race during registration),
  // default to 'personal' so the guard doesn't block indefinitely.
  useEffect(() => {
    if (isAuthenticated && !isLoading && !role) {
      useAuthStore.getState().setRole('personal')
    }
  }, [isAuthenticated, isLoading, role])

  useEffect(() => {
    if (!isReady) return


    if (!isAuthenticated) {
      if (!hasWarnedRef.current && pathname !== '/auth/login') {
        useToastStore.getState().addToast({
          message: 'Please log in to access this page.',
          type: 'error',
          duration: 4000
        })
        hasWarnedRef.current = true
      }

      if (typeof document !== 'undefined') {
        document.cookie = 'gaffer-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
        document.cookie = 'gaffer-user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
      }
      
      router.replace('/auth/login')
      return
    }

    if (requiredRole && role !== requiredRole) {
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
      return
    }
  }, [isReady, isAuthenticated, isLoading, role, requiredRole, pathname, router])

  return { isReady: isReady && isAuthenticated && (!requiredRole || role === requiredRole) }
}
