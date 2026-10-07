'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'

// useAuthListener is mounted once at root via AuthProvider — not needed here.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, role } = useAuthStore()
  const pathname = usePathname()
  // Password links arrive from email and must open in a normal browser tab.
  const isReady = useStandaloneGuard(pathname.startsWith('/auth/reset-password'))

  // If user is already authenticated, send them to the right place
  useEffect(() => {
    if (isReady && !isLoading && isAuthenticated) {
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
    }
  }, [isReady, isAuthenticated, isLoading, role, router])

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
