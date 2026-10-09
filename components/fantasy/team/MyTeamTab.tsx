'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Zap } from 'lucide-react'
import { onSocketInitialized } from '@/hooks/useNotificationSocket'

import { useFantasyStore, selectRemainingBudget } from '@/store/fantasyStore'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { getMyFantasyTeam, getFantasyStats, listGameweeks, getFantasySeason, getMyFantasyTeamHistory } from '@/lib/services/fantasy.service'
import { listFixtures } from '@/lib/services/fixture.service'
import { mapApiTeamToSquad } from '@/lib/converters'
import { getGameweekState, getCurrentGameweek, getEditableGameweek, getRoundFixtures, getTeamFixtureInRound } from '@/lib/gameweekState'
import { formatSquadValue } from '@/lib/format'

import { Pitch } from '@/components/fantasy/Pitch'
import { SubstituteBench } from '@/components/fantasy/SubstituteBench'
import { PlayerDetailDrawer } from '@/components/fantasy/PlayerDetailDrawer'
import { RoundPointsStrip } from './RoundPointsStrip'
import { ActiveChipBanner } from './ActiveChipBanner'
import { TransfersPanel } from './TransfersPanel'
import { ChipStoreDrawer } from './ChipStoreDrawer'

export function MyTeamTab({ competitionId }: { competitionId: string }) {
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [transfersOpen, setTransfersOpen] = useState(false)
  const [transferPlayerOutId, setTransferPlayerOutId] = useState<string | null>(null)
  const [chipStoreOpen, setChipStoreOpen] = useState(false)

  const selectedPlayerId = useFantasyStore((s) => s.selectedPlayerId)
  const budget = useFantasyStore(selectRemainingBudget)
  const players = useFantasyStore((s) => s.players)
  const selectPlayer = useFantasyStore((s) => s.selectPlayer)
  const saveTeamToApi = useFantasyStore((s) => s.saveTeamToApi)
  const setPlayers = useFantasyStore((s) => s.setPlayers)
  const setSquadBudget = useFantasyStore((s) => s.setSquadBudget)
  const isSaving = useFantasyStore((s) => s.isSaving)
  const [savedAnim, setSavedAnim] = useState(false)

  // Inline substitution mode (Decision #3) — set by PlayerDetailDrawer's
  // "Sub Out" action; no separate route/screen involved.
  const substitutingOutId = useFantasyStore((s) => s.substitutingOutId)
  const setSubstitutingOutId = useFantasyStore((s) => s.setSubstitutingOutId)
  const performSubstitution = useFantasyStore((s) => s.performSubstitution)
  const substituteError = useFantasyStore((s) => s.substituteError)

  const [selectedGameweekId, setSelectedGameweekId] = useState<string | null>(null)

  const { data: gameweeks } = useQuery({
    queryKey: ['fantasy-gameweeks', competitionId],
    queryFn: () => listGameweeks(competitionId),
  })

  const { data: fixtures = [] } = useQuery({
    queryKey: ['fixtures', competitionId],
    queryFn: () => listFixtures(competitionId),
    staleTime: 60_000,
  })

  const editableGw = useMemo(
    () => (gameweeks && fixtures ? getEditableGameweek(gameweeks, fixtures) : undefined),
    [gameweeks, fixtures],
  )
  const editableGwId = editableGw?._id ?? null

  useEffect(() => {
    if (selectedGameweekId || !gameweeks?.length) return
    // Open on the gameweek that accepts changes; the strip above still lets people look back at live and past ones
    const target = editableGw ?? getCurrentGameweek(gameweeks, fixtures)
    if (target) setSelectedGameweekId(target._id)
  }, [gameweeks, fixtures, selectedGameweekId, editableGw])

  useEffect(() => {
    let activeSocket: any = null
    let handleLiveUpdate: any = null

    onSocketInitialized((socket) => {
      activeSocket = socket
      socket.emit('join:competition', competitionId)

      handleLiveUpdate = () => {
        // Invalidate the current gameweek and stats quietly in the background
        queryClient.invalidateQueries({ queryKey: ['fantasy-team-me', competitionId] })
        queryClient.invalidateQueries({ queryKey: ['fantasy-stats'] })
      }

      socket.on('fantasy:live_update', handleLiveUpdate)
    })

    return () => {
      if (activeSocket) {
        activeSocket.emit('leave:competition', competitionId)
        if (handleLiveUpdate) {
          activeSocket.off('fantasy:live_update', handleLiveUpdate)
        }
      }
    }
  }, [competitionId, queryClient])

  const { data: myTeam, isLoading: loadingTeam, isError: teamLoadFailed } = useQuery({
    queryKey: ['fantasy-team-me', competitionId, selectedGameweekId],
    queryFn: () => {
      // Use live endpoint if no gameweek is selected or if viewing the active editable gameweek.
      // Use historical snapshot endpoint only when viewing genuinely completed/past rounds.
      if (!selectedGameweekId || selectedGameweekId === editableGwId) {
        return getMyFantasyTeam(competitionId)
      }
      return getMyFantasyTeamHistory(competitionId, selectedGameweekId)
    },
    enabled: !!selectedGameweekId || (gameweeks && gameweeks.length === 0),
  })

  const { data: season } = useQuery({
    queryKey: ['fantasy-season', competitionId],
    queryFn: () => getFantasySeason(competitionId),
  })

  const { data: seasonStats } = useQuery({
    queryKey: ['fantasy-stats', competitionId],
    queryFn: () => getFantasyStats(competitionId),
  })

  const setBaseBankBalance = useFantasyStore((s) => s.setBaseBankBalance)

  useEffect(() => {
    if (myTeam) {
      const mapped = mapApiTeamToSquad(myTeam as any)
      if (mapped.length > 0) setPlayers(mapped)
      if (myTeam.bankBalance != null) setBaseBankBalance(myTeam.bankBalance)
    }
  }, [myTeam])

  useEffect(() => {
    if (season?.squadBudget != null) setSquadBudget(season.squadBudget)
  }, [season?.squadBudget])

  // Which gameweek's points to show on the pitch.
  // Points are already included in player objects returned by team endpoints.
  const pointsByPlayerId = useMemo(() => {
    if (!selectedGameweekId) return {}
    const map: Record<string, number | null> = {}
    
    const selectedGw = gameweeks?.find((gw) => gw._id === selectedGameweekId)
    const state = selectedGw ? getGameweekState(selectedGw, fixtures) : 'no_fixtures'
    const isGwStarted = state === 'in_progress' || state === 'completed'

    players.forEach((p) => {
      map[p.id] = isGwStarted ? p.points : null
    })
    return map
  }, [players, selectedGameweekId, gameweeks, fixtures])

  // A player's real-world team can have a fixture in some other round while
  // having none in the round you're viewing — "TBC" should only show when
  // the team truly has no fixture in THIS gameweek's round, not whenever
  // their next fixture anywhere happens to be further out.
  const fixtureLabelByTeamId = useMemo(() => {
    const selectedGw = gameweeks?.find((gw) => gw._id === selectedGameweekId)
    if (!selectedGw) return {}
    const roundFixtures = getRoundFixtures(selectedGw, fixtures)
    const map: Record<string, string | null> = {}
    players.forEach((p) => {
      if (!p.teamId || map[p.teamId] !== undefined) return
      const result = getTeamFixtureInRound(p.teamId, roundFixtures)
      if (result) {
        if (result.status === 'completed') {
          map[p.teamId] = '-'
        } else {
          map[p.teamId] = `${result.opponentCode} (${result.isHome ? 'H' : 'A'})`
        }
      } else {
        map[p.teamId] = null
      }
    })
    return map
  }, [gameweeks, fixtures, players, selectedGameweekId])

  const pitchPlayers = players.filter((p) => p.isOnPitch)
  const benchPlayers = players.filter((p) => !p.isOnPitch)
  const selectedPlayer = selectedPlayerId != null ? players.find((p) => p.id === selectedPlayerId) ?? null : null

  const toast = useToastStore()

  // Only a failed LOAD replaces the pitch; a failed save is a toast so the
  // user can fix their lineup. React Query clears isError on a successful refetch.
  const teamError = teamLoadFailed && !myTeam ? 'Could not load your team. Please try again.' : null

  useEffect(() => {
    if (substituteError) toast.addToast(substituteError, 'error')
  }, [substituteError])

  const isHistorical = (myTeam as any)?.isHistoricalSnapshot === true
  const noSnapshotAvailable = (myTeam as any)?.noSnapshotAvailable === true

  const handleSelectPlayer = useCallback(
    (id: string) => {
      if (substitutingOutId) {
        if (id === substitutingOutId) {
          setSubstitutingOutId(null)
          return
        }
        if (isHistorical) {
          // Nothing can change in a gameweek that is live or finished
          setSubstitutingOutId(null)
          toast.addToast('This gameweek is locked. Pick the next open gameweek above to make changes.', 'error')
          return
        }
        performSubstitution(substitutingOutId, id)
        return
      }
      selectPlayer(id)
    },
    [substitutingOutId, selectPlayer, performSubstitution, setSubstitutingOutId, isHistorical],
  )

  const handleSave = async () => {
    try {
      await saveTeamToApi()
      setSavedAnim(true)
      setTimeout(() => setSavedAnim(false), 2200)
    } catch (err: any) {
      const msg = err?.message ?? 'Could not save your team. Please try again.'
      toast.addToast(msg, 'error')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <RoundPointsStrip
        competitionId={competitionId}
        gameweeks={gameweeks ?? []}
        fixtures={fixtures}
        currentUserId={currentUserId}
        selectedGameweekId={selectedGameweekId}
        onSelectGameweek={setSelectedGameweekId}
      />

      {seasonStats && (
        <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-4 flex justify-around">
          <div className="flex flex-col items-center">
            <span className="text-white font-chakra font-black text-xl">{seasonStats.yourSC}</span>
            <span className="text-gaffer-muted text-[10px] font-bold uppercase tracking-widest mt-1">Points</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-chakra font-black text-xl">{seasonStats.averageSC.toFixed(1)}</span>
            <span className="text-gaffer-muted text-[10px] font-bold uppercase tracking-widest mt-1">Average</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white font-chakra font-black text-xl">{seasonStats.highestSC}</span>
            <span className="text-gaffer-muted text-[10px] font-bold uppercase tracking-widest mt-1">Highest</span>
          </div>
        </div>
      )}

      <ActiveChipBanner
        competitionId={competitionId}
        selectedGameweekId={selectedGameweekId}
        onOpen={() => setChipStoreOpen(true)}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card px-4 py-3">
          <span className="text-gaffer-muted text-[10px] font-black uppercase tracking-widest">Budget</span>
          <span className="text-gaffer-orange font-chakra font-black text-sm">{formatSquadValue(budget)}</span>
        </div>
        
        <div className="flex items-center justify-between px-2 text-gaffer-muted text-[11px] font-body">
          <span>Free Transfers: <span className="text-white font-medium">{myTeam?.unlimitedTransfers ? 'Unlimited' : (myTeam?.freeTransfersRemaining ?? 0)}</span></span>
          <span>Squad Value: <span className="text-white font-medium">{formatSquadValue(players.reduce((s, p) => s + (p.price ?? 0), 0))}</span></span>
        </div>
      </div>

      {loadingTeam ? (
        <div className="w-full aspect-[4/5] rounded-xl bg-[#2b3520]/60 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gaffer-orange border-t-transparent animate-spin" />
        </div>
      ) : teamError ? (
        <div className="w-full aspect-[4/5] rounded-xl bg-gaffer-card flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <span className="text-white/60 text-sm">{teamError}</span>
          </div>
        </div>
      ) : noSnapshotAvailable ? (
        <div className="w-full aspect-[4/5] rounded-xl bg-[#2b3520]/60 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="text-4xl">📋</span>
          <p className="text-white font-bold text-sm">No Snapshot Available</p>
          <p className="text-white/50 text-xs max-w-xs">
            Squad data for this gameweek hasn&apos;t been captured yet — it will appear once the gameweek scoring has been processed.
          </p>
        </div>
      ) : pitchPlayers.length === 0 ? (
        <div className="w-full aspect-[4/5] rounded-xl bg-[#2b3520]/60 flex items-center justify-center">
          <span className="text-white/60 text-sm font-bold uppercase tracking-wide">No squad set up yet</span>
        </div>
      ) : (
        <Pitch
          pitchPlayers={pitchPlayers}
          selectedId={selectedPlayerId}
          substitutingOutId={substitutingOutId}
          budget={budget}
          onSelectPlayer={handleSelectPlayer}
          pointsByPlayerId={pointsByPlayerId}
          fixtureLabelByTeamId={fixtureLabelByTeamId}
        />
      )}

      {substitutingOutId && (
        <div className="flex items-center justify-between bg-gaffer-orange/10 border border-gaffer-orange/30 rounded-xl px-4 py-2">
          <span className="text-gaffer-orange text-xs font-body font-semibold">Pick a bench player to sub in</span>
          <button onClick={() => setSubstitutingOutId(null)} className="text-gaffer-muted text-xs font-body underline">
            Cancel
          </button>
        </div>
      )}

      {!loadingTeam && !teamError && (
        <SubstituteBench
          benchPlayers={benchPlayers}
          selectedId={selectedPlayerId}
          substitutingOutId={substitutingOutId}
          onSelectPlayer={handleSelectPlayer}
          players={players}
          compact
          fixtureLabelByTeamId={fixtureLabelByTeamId}
          pointsByPlayerId={pointsByPlayerId}
        />
      )}

      {!isHistorical && (
        <div className="flex justify-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-orange-gradient-btn text-white px-6 py-3 rounded-xl font-display font-black uppercase tracking-widest text-sm shadow-orange-glow disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : savedAnim ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={() => { setTransferPlayerOutId(null); setTransfersOpen(true) }}
            className="bg-gaffer-card border border-gaffer-border text-white px-6 py-3 rounded-xl font-display font-black uppercase tracking-widest text-sm"
          >
            Transfers
          </button>
          <button
            onClick={() => setChipStoreOpen(true)}
            className="bg-gaffer-card border border-gaffer-border text-white px-6 py-3 rounded-xl font-display font-black uppercase tracking-widest text-sm flex items-center gap-2"
          >
            <Zap size={16} />
            Chips
          </button>
        </div>
      )}

      <PlayerDetailDrawer
        player={selectedPlayer}
        gameweekId={selectedGameweekId}
        onClose={() => selectPlayer(null)}
        onTransfer={(playerId) => {
          setTransferPlayerOutId(playerId)
          setTransfersOpen(true)
        }}
      />

      {transfersOpen && (
        <TransfersPanel
          competitionId={competitionId}
          initialPlayerOutId={transferPlayerOutId}
          onClose={() => {
            setTransfersOpen(false)
            setTransferPlayerOutId(null)
          }}
        />
      )}

      {chipStoreOpen && <ChipStoreDrawer competitionId={competitionId} onClose={() => setChipStoreOpen(false)} />}
    </div>
  )
}
