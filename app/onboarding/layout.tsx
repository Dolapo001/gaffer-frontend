'use client'

import { useStandaloneGuard } from '@/hooks/useStandaloneGuard'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const isReady = useStandaloneGuard()

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
