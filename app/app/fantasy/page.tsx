'use client'

import { useState } from 'react'
import FantasyDashboard from '@/components/fantasy/FantasyDashboard'
import { FantasyWelcome } from '@/components/fantasy/FantasyWelcome'
import { CreateTeamScreen } from '@/components/fantasy/CreateTeamScreen'
import { PickTeamOnboarding } from '@/components/fantasy/PickTeamOnboarding'
import { TeamNamingScreen } from '@/components/fantasy/TeamNamingScreen'
import { useFantasyStore } from '@/store/fantasyStore'

export default function FantasyPage() {
  const { 
    hasSeenWelcome, 
    hasCreatedTeam, 
    hasOrganizedBench, 
    hasNamedTeam,
    setHasSeenWelcome, 
    setHasCreatedTeam,
    setHasOrganizedBench,
    setHasNamedTeam,
    setTeamName
  } = useFantasyStore()

  if (!hasSeenWelcome) {
    return <FantasyWelcome onGetStarted={() => setHasSeenWelcome(true)} />
  }

  if (!hasCreatedTeam) {
    return <CreateTeamScreen onComplete={() => setHasCreatedTeam(true)} />
  }

  if (!hasOrganizedBench) {
    return (
      <PickTeamOnboarding 
        onBack={() => setHasCreatedTeam(false)}
        onComplete={() => setHasOrganizedBench(true)}
      />
    )
  }

  if (!hasNamedTeam) {
    return (
      <TeamNamingScreen 
        onComplete={(name) => {
          setTeamName(name)
          setHasNamedTeam(true)
        }} 
      />
    )
  }

  return <FantasyDashboard />
}
