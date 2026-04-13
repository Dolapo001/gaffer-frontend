'use client'

import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Returns a goBack() function that calls router.back() when there is
 * history to go back to, or router.replace(fallback) when the page was
 * opened cold (direct link, PWA launch, share target, etc.).
 *
 * Supports an optional 'returnTo' query parameter to override behavior.
 */
export function useGoBack(fallback: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  return () => {
    if (returnTo) {
      router.push(returnTo)
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.replace(fallback)
    }
  }
}
