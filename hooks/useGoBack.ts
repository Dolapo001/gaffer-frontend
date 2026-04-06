'use client'

import { useRouter } from 'next/navigation'

/**
 * Returns a goBack() function that calls router.back() when there is
 * history to go back to, or router.replace(fallback) when the page was
 * opened cold (direct link, PWA launch, share target, etc.).
 */
export function useGoBack(fallback: string) {
  const router = useRouter()
  return () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.replace(fallback)
    }
  }
}
