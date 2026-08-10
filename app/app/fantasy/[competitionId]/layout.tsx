'use client'

import { useEffect } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { useFantasyStore } from '@/store/fantasyStore'
import { getCompetition } from '@/lib/services/competition.service'
import { getMyFantasyTeam, getFantasySeason } from '@/lib/services/fantasy.service'
import { listFixtures } from '@/lib/services/fixture.service'
import { mapApiTeamToSquad } from '@/lib/converters'
import { CreateTeamScreen } from '@/components/fantasy/CreateTeamScreen'
import { TeamNamingScreen } from '@/components/fantasy/TeamNamingScreen'
import { PickTeamOnboarding } from '@/components/fantasy/PickTeamOnboarding'
import { ChevronLeft } from 'lucide-react'

import { useShallow } from 'zustand/react/shallow'

const TABS = [
  { href: '', label: 'Home' },
  { href: '/team', label: 'My Team' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/stats', label: 'Stats' },
]

export default function FantasyCompetitionLayout({ children }: { children: React.ReactNode }) {
  const { competitionId } = useParams<{ competitionId: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const base = `/app/fantasy/${competitionId}`

  const { setActiveCompetition, hideNavbar, showNavbar } = useUIStore()
  const {
    setCompetitionId,
    hasCreatedTeam,
    hasNamedTeam,
    hasOrganizedBench,
    setHasCreatedTeam,
    setHasNamedTeam,
    setHasOrganizedBench,
    setTeamName,
    setPlayers,
    teamName,
    setSquadBudget,
  } = useFantasyStore(
    useShallow((s) => ({
      setCompetitionId: s.setCompetitionId,
      hasCreatedTeam: s.hasCreatedTeam,
      hasNamedTeam: s.hasNamedTeam,
      hasOrganizedBench: s.hasOrganizedBench,
      setHasCreatedTeam: s.setHasCreatedTeam,
      setHasNamedTeam: s.setHasNamedTeam,
      setHasOrganizedBench: s.setHasOrganizedBench,
      setTeamName: s.setTeamName,
      setPlayers: s.setPlayers,
      teamName: s.teamName,
      setSquadBudget: s.setSquadBudget,
    }))
  )

  const { data: competition } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => getCompetition(competitionId),
  })

  const realCompId = competition?._id || competitionId

  const { data: season } = useQuery({
    queryKey: ['fantasy-season', realCompId],
    queryFn: () => getFantasySeason(realCompId),
  })

  const { data: myTeam, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['fantasy-team-me', realCompId],
    queryFn: () => getMyFantasyTeam(realCompId),
    retry: false,
  })

  const { data: fixtures } = useQuery({
    queryKey: ['fantasy-fixtures', realCompId],
    queryFn: () => listFixtures(realCompId),
  })

  useEffect(() => {
    setCompetitionId(competitionId)
  }, [competitionId])

  useEffect(() => {
    if (competition?.orgId) setActiveCompetition(competitionId, competition.orgId)
  }, [competitionId, competition?.orgId])

  useEffect(() => {
    if (season?.squadBudget != null) setSquadBudget(season.squadBudget)
  }, [season?.squadBudget])

  const setBaseBankBalance = useFantasyStore((s) => s.setBaseBankBalance)

  useEffect(() => {
    if (!myTeam) return
    const hasSquad = (myTeam.startingXI?.length ?? 0) > 0
    if (hasSquad) {
      if (!hasCreatedTeam) setHasCreatedTeam(true)
      if (!hasOrganizedBench) setHasOrganizedBench(true)
    }
    if (!hasNamedTeam) setHasNamedTeam(true)
    const mappedSquad = mapApiTeamToSquad(myTeam, fixtures || [])
    if (mappedSquad.length > 0) setPlayers(mappedSquad)
    if (myTeam.teamName !== teamName) setTeamName(myTeam.teamName)
    if (myTeam.bankBalance != null) setBaseBankBalance(myTeam.bankBalance)
  }, [myTeam, fixtures])

  // The onboarding wizard (Create Team → Name Team → Pick Team) renders as a
  // full-screen takeover, but never hid the global bottom nav — it stayed
  // mounted at z-100 and covered the bottom of every onboarding screen,
  // including the Pick Team step's Save button. Hide it for the duration.
  const isOnboarding = !myTeam && !(hasCreatedTeam && hasNamedTeam && hasOrganizedBench)
  useEffect(() => {
    if (!isOnboarding) return
    hideNavbar()
    return () => showNavbar()
  }, [isOnboarding])

  if (isLoadingTeam) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-gaffer-orange border-t-transparent animate-spin" />
      </div>
    )
  }

  // Gate: no saved squad yet → run the one-time onboarding wizard full-screen.
  if (!myTeam && !(hasCreatedTeam && hasNamedTeam && hasOrganizedBench)) {
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
    return (
      <PickTeamOnboarding
        onBack={() => setHasNamedTeam(false)}
        onComplete={() => setHasOrganizedBench(true)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#181928] pb-24">
      <div className="sticky top-0 z-20 bg-[#181928]/95 backdrop-blur-md border-b border-gaffer-border">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button
            onClick={() => router.push('/app/fantasy')}
            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <h1 className="text-white font-display font-bold text-lg truncate uppercase tracking-wide">
            {competition?.name ?? 'Fantasy'}
          </h1>
        </div>

        <div className="flex overflow-x-auto no-scrollbar px-4 gap-4 w-full snap-x snap-mandatory scroll-smooth">
          {TABS.map((tab) => {
            const href = `${base}${tab.href}`
            const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href)
            return (
              <Link
                key={tab.label}
                href={href}
                className={`flex-shrink-0 px-2 py-3 text-xs font-display font-bold uppercase tracking-wider border-b-2 transition-colors snap-start ${
                  isActive
                    ? 'text-gaffer-orange border-gaffer-orange'
                    : 'text-gaffer-muted border-transparent hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      {children}
    </div>
  )
}
