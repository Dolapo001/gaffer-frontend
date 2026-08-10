'use client'

import { useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useUIStore } from '@/store/uiStore'
import { getCompetition } from '@/lib/services/competition.service'
import { LeagueTabHeader } from '@/components/league/LeagueTabHeader'

export default function LeagueCompetitionLayout({ children }: { children: React.ReactNode }) {
  const { leagueId } = useParams<{ leagueId: string }>()
  const pathname = usePathname()
  const base = `/app/league/${leagueId}`

  const { setActiveCompetition, hideNavbar, showNavbar } = useUIStore()

  const { data: competition } = useQuery({
    queryKey: ['competition', leagueId],
    queryFn: () => getCompetition(leagueId),
  })

  useEffect(() => {
    if (!competition) return
    const orgId = typeof competition.orgId === 'object' ? (competition.orgId as any)._id : competition.orgId
    setActiveCompetition(leagueId, orgId)
  }, [competition, leagueId, setActiveCompetition])

  // Navigation happens via the top tab strip here — hide the bottom nav for
  // the whole section, restore it automatically on navigating away.
  useEffect(() => {
    hideNavbar()
    return () => showNavbar()
  }, [])

  const hasKnockout = competition?.stages?.some((s) => s.type === 'knockout') ?? false

  const tabs = [
    { href: '', label: 'Overview' },
    { href: '/matches', label: 'Matches' },
    { href: '/standings', label: 'Standings' },
    ...(hasKnockout ? [{ href: '/knockout', label: 'Knockout' }] : []),
    { href: '/stats', label: 'Stats' },
  ]

  return (
    <div className="min-h-screen bg-[#181928]">
      <div className="sticky top-0 z-20 bg-[#181928]/95 backdrop-blur-md border-b border-gaffer-border">
        <LeagueTabHeader competitionId={leagueId} name={competition?.name} bannerUrl={competition?.bannerUrl} />

        <div className="flex overflow-x-auto no-scrollbar px-4 gap-1">
          {tabs.map((tab) => {
            const href = `${base}${tab.href}`
            const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href)
            return (
              <Link
                key={tab.label}
                href={href}
                className={`flex-shrink-0 px-4 py-3 text-xs font-display font-bold uppercase tracking-wider border-b-2 transition-colors ${
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
