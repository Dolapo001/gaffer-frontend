'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTopScorers, getTopAssists, getCleanSheets, getDisciplineStats } from '@/lib/services/stats.service'
import { TopPlayersList } from '@/components/league/TopPlayersList'
import { PlayerDetailDrawer } from '@/components/fantasy/PlayerDetailDrawer'
import type { FantasySquadPlayer } from '@/lib/fantasyMockData'

export function FantasyStatsTab({ competitionId }: { competitionId: string }) {
  const [tab, setTab] = useState<'goals' | 'assists' | 'cleanSheets' | 'discipline'>('goals')
  const [selectedPlayer, setSelectedPlayer] = useState<FantasySquadPlayer | null>(null)

  const { data: scorers } = useQuery({
    queryKey: ['top-scorers', competitionId],
    queryFn: () => getTopScorers(competitionId),
  })

  const { data: assisters } = useQuery({
    queryKey: ['top-assists', competitionId],
    queryFn: () => getTopAssists(competitionId),
  })

  const { data: cleanSheets } = useQuery({
    queryKey: ['clean-sheets', competitionId],
    queryFn: () => getCleanSheets(competitionId),
  })

  const { data: discipline } = useQuery({
    queryKey: ['discipline-stats', competitionId],
    queryFn: () => getDisciplineStats(competitionId),
  })

  const handleSelectPlayer = (_: string, rawPlayer?: any) => {
    if (!rawPlayer) return
    const pObj = rawPlayer.playerId || rawPlayer
    const tObj = rawPlayer.teamId || {}

    const name = pObj.displayName?.trim() || (pObj.firstName ? `${pObj.firstName} ${pObj.lastName}`.trim() : (pObj.name || 'Player'))
    const teamCode = tObj.shortName || tObj.name || 'TEAM'

    const playerModalData: FantasySquadPlayer = {
      id: pObj._id || rawPlayer._id,
      name,
      shortName: pObj.lastName || name,
      teamName: tObj.name || teamCode,
      teamCode,
      teamId: tObj._id,
      teamColor: '#ff5500',
      position: (pObj.position || rawPlayer.position || 'FWD').toUpperCase() as any,
      points: rawPlayer.totalPoints ?? rawPlayer.points ?? 0,
      // Stats rows carry no fantasy price: NaN → the drawer hides it (it showed a fake £5.0m)
      price: typeof rawPlayer.price === 'number' ? rawPlayer.price : Number.NaN,
      pitchRow: 0,
      isOnPitch: true,
      isCaptain: false,
      isViceCaptain: false,
      goals: rawPlayer.goals ?? (rawPlayer.stats?.goals ?? 0),
      assists: rawPlayer.assists ?? (rawPlayer.stats?.assists ?? 0),
      form: 0,
      gwHistory: [],
      avatarUrl: pObj.photoUrl,
      nextFixtures: [],
    }

    setSelectedPlayer(playerModalData)
  }

  const TABS = [
    { key: 'goals', label: 'Goals', title: 'Top scorers', statKey: 'goals', statLabel: 'Goals', data: scorers },
    { key: 'assists', label: 'Assists', title: 'Top assists', statKey: 'assists', statLabel: 'Assists', data: assisters },
    // Golden Glove: goalkeepers only (the backend credits keepers who played)
    { key: 'cleanSheets', label: 'Clean sheets', title: 'Clean sheets', statKey: 'cleanSheets', statLabel: 'GK Clean Sheets', emptyText: 'No goalkeeper clean sheets yet', data: cleanSheets },
    { key: 'discipline', label: 'Cards', title: 'Discipline', statKey: 'cards', statLabel: 'Yellow · Red', data: discipline },
  ] as const

  const currentTabInfo = TABS.find((t) => t.key === tab)!

  return (
    <div className="p-4 space-y-4">
      {/* Which list: four equal segments that always fit the screen */}
      <div className="flex gap-1 rounded-full bg-white/[0.06] p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex-auto whitespace-nowrap rounded-full px-2 py-2 font-body text-[13px] font-semibold leading-tight transition-colors ${
              tab === t.key ? 'bg-white text-black' : 'text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <TopPlayersList
        title={currentTabInfo.title}
        players={currentTabInfo.data}
        statKey={currentTabInfo.statKey as any}
        statLabel={currentTabInfo.statLabel}
        emptyText={'emptyText' in currentTabInfo ? currentTabInfo.emptyText : undefined}
        onSelectPlayer={handleSelectPlayer}
      />

      {/* Player Detail Drawer / Profile Modal */}
      {selectedPlayer && (
        <PlayerDetailDrawer
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}
