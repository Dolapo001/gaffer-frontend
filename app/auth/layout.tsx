'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, role } = useAuthStore()
  useAuthListener()

  // If user is already authenticated, send them to the right place
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
    }
  }, [isAuthenticated, isLoading, role, router])

  return <>{children}</>
}
