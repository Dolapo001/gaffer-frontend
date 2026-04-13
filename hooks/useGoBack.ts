'use client'

import { useRouter } from 'next/navigation'

/**
 * Returns a goBack() function that calls router.back() when there is
 * history to go back to, or router.replace(fallback) when the page was
 * opened cold (direct link, PWA launch, share target, etc.).
 *
 * Supports an optional 'returnTo' query parameter to override behavior.
 *
 * NOTE: deliberately avoids useSearchParams() so no Suspense boundary is
 * required on every page that uses this hook. The returnTo param is read
 * lazily from window.location.search at call time — safe because goBack()
 * is always triggered by user interaction (after mount).
 */
export function useGoBack(fallback: string) {
  const router = useRouter()

  return () => {
    const returnTo =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('returnTo')
        : null

    if (returnTo) {
      router.push(returnTo)
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.replace(fallback)
    }
  }
}
