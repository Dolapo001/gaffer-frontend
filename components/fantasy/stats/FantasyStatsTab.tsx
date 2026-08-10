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

    const name = pObj.firstName ? `${pObj.firstName} ${pObj.lastName}`.trim() : (pObj.name || 'Player')
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
      price: rawPlayer.price ?? 5.0,
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
    { key: 'goals', label: 'Golden Boot ⚽', statKey: 'goals', statLabel: 'Goals', data: scorers },
    { key: 'assists', label: 'Top Assists 🅰️', statKey: 'assists', statLabel: 'Assists', data: assisters },
    { key: 'cleanSheets', label: 'Clean Sheets 🧤', statKey: 'cleanSheets', statLabel: 'Clean Sheets', data: cleanSheets },
    { key: 'discipline', label: 'Discipline 🟨', statKey: 'yellowCards', statLabel: 'Cards', data: discipline },
  ] as const

  const currentTabInfo = TABS.find((t) => t.key === tab)!

  return (
    <div className="p-4 space-y-4">
      {/* Tab Filter Pills */}
      <div className="flex bg-gaffer-surface border border-gaffer-border p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-chakra font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-gaffer-orange text-black shadow-md' : 'text-gaffer-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <TopPlayersList
        title={currentTabInfo.label}
        players={currentTabInfo.data}
        statKey={currentTabInfo.statKey as any}
        statLabel={currentTabInfo.statLabel}
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
