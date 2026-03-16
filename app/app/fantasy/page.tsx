'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FantasyPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/app/fantasy/team')
  }, [router])
  return (
    <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
    </div>
  )
}
