'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isStandalone } from '@/lib/pwa'

export function BrowserProtection({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // If we're on the landing page, we don't need to check.
    // The landing page itself handles the PWA intro.
    if (pathname === '/' || pathname.startsWith('/onboarding/')) {
      setIsReady(true)
      return
    }

    // Check if we are running in standalone PWA mode or in development.
    // If not, redirect to the landing page to enforce PWA installation.
    if (!isStandalone() && process.env.NODE_ENV !== 'development') {
      router.replace('/')
    } else {
      setIsReady(true)
    }
  }, [pathname, router])

  // While checking, show a black screen to avoid any flicker of "browser" content.
  if (!isReady && pathname !== '/') {
    return <div className="fixed inset-0 bg-[#181928] z-[9999]" />
  }

  return <>{children}</>
}
