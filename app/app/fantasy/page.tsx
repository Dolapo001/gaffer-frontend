'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FantasyDashboard from '@/components/fantasy/FantasyDashboard'
import { FantasyWelcome } from '@/components/fantasy/FantasyWelcome'
import { CreateTeamScreen } from '@/components/fantasy/CreateTeamScreen'
import { PickTeamOnboarding } from '@/components/fantasy/PickTeamOnboarding'
import { TeamNamingScreen } from '@/components/fantasy/TeamNamingScreen'
import { useFantasyStore } from '@/store/fantasyStore'
import { Trophy, Gamepad2, ChevronRight, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listJoinedCompetitions } from '@/lib/services/competition.service'
import { getMyFantasyTeam } from '@/lib/services/fantasy.service'
import { listFixtures } from '@/lib/services/fixture.service'
import { GafferLogo } from '@/components/GafferLogo'
import { mapApiTeamToSquad } from '@/lib/converters'
import { getImageUrl } from '@/lib/api'

function FantasyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    competitionId,
    setCompetitionId,
    hasSeenWelcome,
    hasCreatedTeam,
    hasOrganizedBench,
    hasNamedTeam,
    setHasSeenWelcome,
    setHasCreatedTeam,
    setHasOrganizedBench,
    setHasNamedTeam,
    setTeamName,
    setPlayers
  } = (useFantasyStore as any)()

  // If the user arrived via the in-competition Fantasy tab, auto-select that competition
  const urlCompetitionId = searchParams.get('competitionId')
  useEffect(() => {
    if (urlCompetitionId && urlCompetitionId !== competitionId) {
      setCompetitionId(urlCompetitionId)
    }
  }, [urlCompetitionId])

  const { data: joinedLeagues, isLoading } = useQuery({
    queryKey: ['joined-competitions'],
    queryFn: listJoinedCompetitions
  })

  const { data: myTeam, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['fantasy-team-me', competitionId],
    queryFn: () => getMyFantasyTeam(competitionId!),
    enabled: !!competitionId,
    retry: false
  })

  const { data: fixtures } = useQuery({
    queryKey: ['fantasy-fixtures', competitionId],
    queryFn: () => listFixtures(competitionId!),
    enabled: !!competitionId
  })

  useEffect(() => {
    if (myTeam) {
      if (!hasCreatedTeam) setHasCreatedTeam(true)
      if (!hasOrganizedBench) setHasOrganizedBench(true)
      if (!hasNamedTeam) setHasNamedTeam(true)
      
      const mappedSquad = mapApiTeamToSquad(myTeam, fixtures || [])
      setPlayers(mappedSquad)

      if (myTeam.teamName !== useFantasyStore.getState().teamName) {
        setTeamName(myTeam.teamName)
      }
    }
  }, [myTeam, fixtures, hasCreatedTeam, hasOrganizedBench, hasNamedTeam, setHasCreatedTeam, setHasOrganizedBench, setHasNamedTeam, setTeamName, setPlayers])

  // 1. Show Welcome first for every first-time user
  if (!hasSeenWelcome) {
    return <FantasyWelcome onGetStarted={() => setHasSeenWelcome(true)} />
  }

  if (isLoading || (!!competitionId && isLoadingTeam)) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-2 border-gaffer-orange border-t-transparent animate-spin" />
      </div>
    )
  }

  // 2. If no league joined, go to discovery
  if (!joinedLeagues || joinedLeagues.length === 0) {
    return (
      <div className="min-h-screen bg-[#181928] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gaffer-card border border-gaffer-border flex items-center justify-center mb-6">
          <Trophy size={40} className="text-gaffer-muted" />
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-2">No active leagues</h1>
        <p className="text-gaffer-muted font-body text-sm mb-8 transition-opacity">
          You need to join a competition before you can play fantasy.
        </p>
        <button 
          onClick={() => router.push('/app/league')}
          className="w-full bg-gaffer-orange text-white py-4 rounded-2xl font-display font-black tracking-widest uppercase shadow-lg shadow-gaffer-orange/20"
        >
          Discover Leagues
        </button>
      </div>
    )
  }

  // 2. If no competitionId selected, handle selection
  if (!competitionId) {
    // Select from list (even if only 1, so they can see 'Join New' button)
    return (
      <div className="min-h-screen bg-[#181928] p-6 pb-32">
        <div className="flex items-center gap-3 mb-8 mt-12">
           <div className="w-10 h-10 rounded-xl bg-gaffer-orange flex items-center justify-center">
              <Gamepad2 size={24} className="text-[#181928]" fill="currentColor" />
           </div>
           <div>
              <h1 className="text-2xl font-display font-bold text-white leading-none">Fantasy</h1>
              <p className="text-gaffer-muted text-[10px] font-black uppercase tracking-[3px] mt-1">Select League</p>
           </div>
        </div>

        <div className="space-y-4">
          {joinedLeagues.map((league) => (
            <button
              key={league._id}
              onClick={() => setCompetitionId(league._id)}
              className="w-full bg-gaffer-card border border-gaffer-border p-4 rounded-2xl flex items-center gap-4 text-left group hover:border-gaffer-orange/50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-gaffer-border overflow-hidden flex items-center justify-center flex-shrink-0">
                {league.bannerUrl ? (
                  <img src={getImageUrl(league.bannerUrl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Trophy size={20} className="text-gaffer-muted" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-white font-display font-bold text-[15px] truncate uppercase tracking-wide mb-1">
                   {league.name}
                 </p>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gaffer-muted font-black uppercase tracking-widest">Active League</span>
                 </div>
              </div>
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-gaffer-orange/10 group-hover:border-gaffer-orange/20 transition-colors">
                <ChevronRight size={18} className="text-white/40 group-hover:text-gaffer-orange" />
              </div>
            </button>
          ))}
          
          <button
            onClick={() => router.push('/app/league')}
            className="w-full bg-transparent border-2 border-dashed border-gaffer-border p-4 rounded-2xl flex items-center justify-center gap-3 group hover:border-gaffer-orange/50 hover:bg-gaffer-orange/5 transition-all text-gaffer-muted hover:text-white"
          >
            <Search size={18} />
            <span className="font-display font-bold text-[14px] uppercase tracking-wider">Join New League</span>
          </button>
        </div>
      </div>
    )
  }

  if (!hasCreatedTeam) {
    return <CreateTeamScreen onComplete={() => setHasCreatedTeam(true)} />
  }

  if (!hasNamedTeam) {
    return (
      <TeamNamingScreen 
        onComplete={(name: string) => {
          setTeamName(name)
          setHasNamedTeam(true)
        }} 
      />
    )
  }

  if (!hasOrganizedBench) {
    return (
      <PickTeamOnboarding 
        onBack={() => setHasNamedTeam(false)}
        onComplete={() => setHasOrganizedBench(true)} 
      />
    )
  }

  return <FantasyDashboard />
}

export default function FantasyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#181928] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-gaffer-orange border-t-transparent animate-spin" />
      </div>
    }>
      <FantasyPageContent />
    </Suspense>
  )
}
