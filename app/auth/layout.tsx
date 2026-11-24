'use client'

import { useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'
import { afterAuthPath, inviteInProgress } from '@/lib/afterAuth'

// useAuthListener is mounted once at root via AuthProvider — not needed here.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, role } = useAuthStore()
  const pathname = usePathname()
  // These open in a normal browser tab and must not be sent to the landing page:
  //  - password links, which arrive from email
  //  - sign in / sign up for someone who opened a coach or staff invite link (they finish the invite in the browser)
  const allowBrowser = useCallback(
    () => pathname.startsWith('/auth/reset-password') || inviteInProgress(),
    [pathname],
  )
  const isReady = useStandaloneGuard(allowBrowser)

  // If user is already authenticated, send them to the right place (an invite they were in the middle of comes first)
  useEffect(() => {
    if (isReady && !isLoading && isAuthenticated) {
      router.replace(afterAuthPath(role))
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
