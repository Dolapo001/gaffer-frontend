'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isStandalone } from '@/lib/pwa'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // All onboarding screens require standalone PWA mode
    if (!isStandalone()) {
      router.replace('/')
    }
  }, [router])

  return <>{children}</>
}
