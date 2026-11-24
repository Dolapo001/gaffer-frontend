'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isStandalone } from '@/lib/pwa'

/**
 * Enforces PWA standalone mode in production.
 *
 * - In development: always passes so engineers can iterate in the browser.
 * - In production:  redirects to the landing page (/) if the app is not
 *   running as an installed PWA.
 *
 * Pass `allowBrowser` for the few pages that must work in an ordinary browser tab (password links from email, and
 * the sign-in pages of an invite that was opened from a shared link). It can be a function, which is asked once the
 * page is running in the browser, so it can look at the address and at storage.
 *
 * Returns `true` once the check passes (standalone confirmed, dev mode, or allowed in a browser).
 * Returns `false` while the check is pending — callers should render a loader.
 */
export function useStandaloneGuard(allowBrowser: boolean | (() => boolean) = false): boolean {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const allowed = typeof allowBrowser === 'function' ? allowBrowser() : allowBrowser
    if (allowed || process.env.NODE_ENV === 'development' || isStandalone()) {
      setIsReady(true)
    } else {
      // Not running as installed PWA in production — send to landing page
      router.replace('/')
    }
  }, [router, allowBrowser])

  return isReady
}
