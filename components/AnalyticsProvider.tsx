'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { track, trackPageview } from '@/lib/analytics'

/** Counts page views (the landing page included) and the moment the app gets installed. */
export function AnalyticsProvider() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) trackPageview(pathname)
  }, [pathname])

  useEffect(() => {
    const onInstalled = () => track('app_installed')
    window.addEventListener('appinstalled', onInstalled)
    return () => window.removeEventListener('appinstalled', onInstalled)
  }, [])

  return null
}
