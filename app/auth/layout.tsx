'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, role } = useAuthStore()
  const isReady = useStandaloneGuard()
  useAuthListener()

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
