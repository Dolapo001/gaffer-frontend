'use client'

import { useState } from 'react'
import FantasyDashboard from '@/components/fantasy/FantasyDashboard'
import { FantasyWelcome } from '@/components/fantasy/FantasyWelcome'

export default function FantasyPage() {
  const [showWelcome, setShowWelcome] = useState(true)

  if (showWelcome) {
    return <FantasyWelcome onGetStarted={() => setShowWelcome(false)} />
  }

  return <FantasyDashboard />
}
