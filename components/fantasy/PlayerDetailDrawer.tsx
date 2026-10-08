'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CornerUpLeft, ArrowRightLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type FantasySquadPlayer } from '@/lib/fantasyMockData'
import { useFantasyStore, selectPitchPlayers, selectBenchPlayers } from '@/store/fantasyStore'
import { useUIStore } from '@/store/uiStore'
import { getPlayerHistory, setSquad } from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

// ─── Position badge colors ────────────────────────────────────────────────────

const POS_STYLES: Record<string, string> = {
  GK: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  DEF: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  MID: 'bg-green-500/10 text-green-500 border-green-500/20',
  FWD: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
}

// ─── Team crest placeholder ───────────────────────────────────────────────────

function TeamCrest({
  code,
  size = 36,
}: {
  code: string
  size?: number
}) {
  let logoUrl = '';
  switch (code) {
    case 'ENG': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/120px-Manchester_City_FC_badge.svg.png'; break;
    case 'LAW': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png'; break;
    case 'MED': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/120px-Liverpool_FC.svg.png'; break;
    case 'SCI': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/120px-Chelsea_FC.svg.png'; break;
    case 'BUS': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Tottenham_Hotspur.svg/120px-Tottenham_Hotspur.svg.png'; break;
  }

  return (
    <div
      className="rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-white shadow-sm p-0.5"
      style={{ width: size, height: size }}
    >
      {logoUrl ? (
         <img src={logoUrl} alt={code} className="w-[85%] h-[85%] object-contain mt-0.5 mx-auto" />
      ) : (
         <span style={{ fontSize: size * 0.28, color: '#000' }} className="font-bold">{code}</span>
      )}
    </div>
  )
}

// ─── Fixture row ──────────────────────────────────────────────────────────────

function FixtureRow({
  fixture,
}: {
  fixture: FantasySquadPlayer['nextFixtures'][number]
}) {
  return (
    <div className="flex items-center gap-4 bg-[#1e2130] rounded-[16px] px-5 py-3 shadow-md">
      <div className="flex flex-col items-center gap-1.5 w-[60px]">
        <TeamCrest code={fixture.homeCode} size={36} />
        <span className="text-white text-[10px] font-bold truncate w-full text-center tracking-wide">{fixture.homeTeam}</span>
      </div>
      <div className="flex-1 flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">
          {fixture.kickoff || 'SAT 14:00'}
        </span>
        <div className="bg-[#2a2d3e] rounded-lg px-3 py-1 flex items-center justify-center mt-1">
          <span className="text-white font-bold text-xs tracking-widest font-mono">
            {fixture.kickoff?.split(' ')[1] || '14:00'}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 w-[60px]">
        <TeamCrest code={fixture.awayCode} size={36} />
        <span className="text-white text-[10px] font-bold truncate w-full text-center tracking-wide">{fixture.awayTeam}</span>
      </div>
    </div>
  )
}

// ─── Point History Graph (Bar chart across gameweeks) ─────────────────────────

function PointHistoryGraph({ history }: { history: any[] }) {
  if (!history || history.length === 0) return null
  const sorted = [...history].sort((a, b) => (a.gameweekId?.gameweekNumber ?? 0) - (b.gameweekId?.gameweekNumber ?? 0))
  const maxPts = Math.max(...sorted.map((h) => h.totalPoints ?? 0), 10)

  return (
    <div className="bg-[#1e2130] rounded-2xl p-4 border border-white/5 space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <span className="text-white text-xs font-chakra font-black uppercase tracking-wider">Point History</span>
        <span className="text-[#a1a1aa] text-[10px] font-chakra uppercase font-bold">Season Trend</span>
      </div>
      <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1 px-1">
        {sorted.map((h) => {
          const pts = h.totalPoints ?? 0
          const heightPct = Math.max((pts / maxPts) * 100, 8)
          const isHigh = pts >= 10
          return (
            <div key={h._id} className="flex-1 h-full flex flex-col items-center gap-1 group relative">
              <span className="text-[10px] font-chakra font-bold text-white/70 group-hover:text-gaffer-orange transition-colors">
                {pts}
              </span>
              <div className="w-full bg-[#121420] rounded-t-lg flex-1 min-h-0 flex items-end overflow-hidden">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-lg transition-all ${
                    isHigh ? 'bg-orange-gradient-btn' : pts > 0 ? 'bg-white/30' : 'bg-white/10'
                  }`}
                />
              </div>
              <span className="text-[9px] font-chakra font-bold text-[#a1a1aa] uppercase">
                GW{h.gameweekId?.gameweekNumber ?? ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FormGuidePills({ history }: { history: any[] }) {
  const recent = [...(history ?? [])]
    .sort((a, b) => (a.gameweekId?.gameweekNumber ?? 0) - (b.gameweekId?.gameweekNumber ?? 0))
    .slice(-5)

  if (recent.length === 0) return null

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-[#a1a1aa] text-[11px] font-chakra font-bold uppercase tracking-wider">Form (Last 5):</span>
      <div className="flex items-center gap-1.5">
        {recent.map((h) => {
          const pts = h.totalPoints ?? 0
          const color =
            pts >= 8
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : pts >= 3
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-white/10 text-[#a1a1aa] border-white/10'
          return (
            <span
              key={h._id}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center font-chakra font-black text-xs ${color}`}
              title={`GW${h.gameweekId?.gameweekNumber}: ${pts} pts`}
            >
              {pts}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── PlayerDetailDrawer ───────────────────────────────────────────────────────

interface PlayerDetailDrawerProps {
  player: FantasySquadPlayer | null
  gameweekId?: string | null
  onClose: () => void
  /** Called instead of navigating to a separate route — the host screen opens its own Transfers panel. */
  onTransfer?: (playerId: string) => void
}

export function PlayerDetailDrawer({ player, gameweekId, onClose, onTransfer }: PlayerDetailDrawerProps) {
  const { hideNavbar, showNavbar } = useUIStore()
  const competitionId = useFantasyStore((s) => s.competitionId)
  const toast = useToastStore()
  const qc = useQueryClient()

  const captainMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const state = useFantasyStore.getState()
      const pitch = selectPitchPlayers(state)
      const bench = selectBenchPlayers(state)
      const benchSorted = [...bench.filter((p) => p.position !== 'GK'), ...bench.filter((p) => p.position === 'GK')]
      const viceCaptain = pitch.find((p) => p.id !== playerId) ?? pitch[0]
      return setSquad(competitionId!, {
        startingXI: pitch.map((p) => p.id),
        bench: benchSorted.map((p) => p.id),
        captainId: playerId,
        viceCaptainId: viceCaptain?.id ?? playerId,
      })
    },
    onMutate: async (newCaptainId: string) => {
      // Cancel outgoing query updates to prevent race conditions
      await qc.cancelQueries({ queryKey: ['fantasy-team-me', competitionId] })

      // Snapshot previous team data for rollback
      const previousTeam = qc.getQueryData(['fantasy-team-me', competitionId])

      // Optimistically update local Zustand store for 0ms UI feedback
      const state = useFantasyStore.getState()
      const updatedPlayers = state.players.map((p) => ({
        ...p,
        isCaptain: p.id === newCaptainId,
        isViceCaptain: p.isCaptain && p.id !== newCaptainId ? true : p.isViceCaptain,
      }))
      state.setPlayers(updatedPlayers)

      return { previousTeam }
    },
    onError: (err, _, context) => {
      if (context?.previousTeam) {
        qc.setQueryData(['fantasy-team-me', competitionId], context.previousTeam)
      }
      toast.addToast(getErrorMessage(err), 'error')
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['fantasy-team-me', competitionId] })
      toast.addToast('Captain updated', 'success')
    },
  })

  // Balanced hide/show: the navbar counter is shared, so only release what we took
  useEffect(() => {
    if (!player) return
    hideNavbar()
    return () => showNavbar()
  }, [player, hideNavbar, showNavbar])

  // Real per-gameweek scoring breakdown — events are logged by the competition
  // admin (goals/assists/cards/appearances) and this is the only source of
  // truth for how a player's points were earned; never derived client-side.
  const { data: history } = useQuery({
    queryKey: ['player-history', competitionId, player?.id],
    queryFn: () => getPlayerHistory(competitionId!, player!.id),
    enabled: !!competitionId && !!player,
  })
  const recentHistory = (history ?? []).slice(-5).reverse()
  const gwStats = gameweekId ? (history ?? []).find((h) => h.gameweekId?._id === gameweekId) : null

  const uniqueFixtures = React.useMemo(() => {
    if (!player) return []
    const seen = new Set<string>()
    return (player.nextFixtures ?? []).filter((f) => {
      const key = `${f.homeCode}-${f.awayCode}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 1)
  }, [player])
  const hasNextMatch = uniqueFixtures.length > 0

  return (
    <AnimatePresence>
      {player && (
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              key="drawer-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full bg-[#2b2d3c] border-t border-white/5 rounded-t-[2.5rem] max-w-md md:max-w-xl lg:max-w-2xl mx-auto shadow-2xl z-[200] mt-auto overflow-y-auto"
              style={{ maxHeight: '88dvh' }}
            >
              {/* Handle — sticks to top while scrolling */}
              <div className="sticky top-0 z-10 w-full pt-2 pb-2 flex justify-center bg-[#2b2d3c]">
                <div className="w-12 h-1.5 rounded-full bg-gray-500/30" />
              </div>

              {/* Scrollable content */}
              <div className="px-6 pt-2">
                {/* Player header */}
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative">
                    <div className="w-[82px] h-[82px] rounded-full overflow-hidden flex items-center justify-center bg-[#25283c] border-[3px] border-white/10 shadow-xl">
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} alt={player.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="text-white font-bold text-[24px] leading-tight tracking-tight">{player.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {Number.isFinite(player.price) && (
                        <>
                          <span className="text-[#a1a1aa] text-[13px] font-medium tracking-wide">#{player.price}M</span>
                          <span className="text-[#a1a1aa] text-[13px]">•</span>
                        </>
                      )}
                      <span className="text-[#a1a1aa] text-[13px] font-medium tracking-wide">
                        {player.position === 'GK' ? 'Goalkeeper' : player.position === 'DEF' ? 'Defender' : player.position === 'MID' ? 'Midfielder' : 'Forward'}
                      </span>
                    </div>
                    {/* Form Guide Pills */}
                    <FormGuidePills history={history ?? []} />
                  </div>
                </div>

                {/* Point History Graph */}
                <PointHistoryGraph history={history ?? []} />

                {/* Condition A: Historical Gameweek View */}
                {gameweekId && gwStats && (
                  <div className="mb-4 bg-[#1e2130] rounded-[16px] p-5 shadow-md mt-4">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                      <span className="text-white font-bold tracking-wide">Gameweek {gwStats.gameweekId?.gameweekNumber ?? '–'} Stats</span>
                      <span className="text-gaffer-orange font-bold text-xl">{gwStats.totalPoints} pts</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Goals</span>
                        <span className="text-white text-lg font-bold">
                          {gwStats.goalsScored} {!!gwStats.goalPoints && <span className="text-gaffer-orange text-[14px] font-semibold ml-1">({gwStats.goalPoints > 0 ? '+' : ''}{gwStats.goalPoints} pts)</span>}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Assists</span>
                        <span className="text-white text-lg font-bold">
                          {gwStats.assists} {!!gwStats.assistPoints && <span className="text-gaffer-orange text-[14px] font-semibold ml-1">({gwStats.assistPoints > 0 ? '+' : ''}{gwStats.assistPoints} pts)</span>}
                        </span>
                      </div>
                      
                      {!!gwStats.cleanSheetPoints && gwStats.cleanSheetPoints > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Clean Sheet</span>
                          <span className="text-white text-lg font-bold">
                            Yes <span className="text-gaffer-orange text-[14px] font-semibold ml-1">(+{gwStats.cleanSheetPoints} pts)</span>
                          </span>
                        </div>
                      )}

                      {!!gwStats.savePoints && gwStats.savePoints > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Saves</span>
                          <span className="text-white text-lg font-bold">
                            <span className="text-gaffer-orange text-[14px] font-semibold">+{gwStats.savePoints} pts</span>
                          </span>
                        </div>
                      )}

                      {!!gwStats.penaltySavePoints && gwStats.penaltySavePoints > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Penalty Saved</span>
                          <span className="text-white text-lg font-bold">
                            <span className="text-gaffer-orange text-[14px] font-semibold">+{gwStats.penaltySavePoints} pts</span>
                          </span>
                        </div>
                      )}

                      {!!gwStats.penaltyMissPoints && gwStats.penaltyMissPoints < 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Penalty Missed</span>
                          <span className="text-white text-lg font-bold text-red-400">
                            {gwStats.penaltyMissPoints} pts
                          </span>
                        </div>
                      )}

                      {!!gwStats.bonusPoints && gwStats.bonusPoints > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Man of the Match</span>
                          <span className="text-white text-lg font-bold">
                            <span className="text-gaffer-orange text-[14px] font-semibold">+{gwStats.bonusPoints} pts</span>
                          </span>
                        </div>
                      )}

                      {!!gwStats.goalsConcededPoints && gwStats.goalsConcededPoints < 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Goals Conceded</span>
                          <span className="text-white text-lg font-bold text-red-400">
                            {gwStats.goalsConcededPoints} pts
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Yellow Cards</span>
                        <span className="text-white text-lg font-bold">
                          {gwStats.yellowCards} {!!gwStats.yellowCardPoints && <span className="text-red-400 text-[14px] font-semibold ml-1">({gwStats.yellowCardPoints} pts)</span>}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Red Cards</span>
                        <span className="text-white text-lg font-bold">
                          {gwStats.redCards} {!!gwStats.redCardPoints && <span className="text-red-400 text-[14px] font-semibold ml-1">({gwStats.redCardPoints} pts)</span>}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Own Goals</span>
                        <span className="text-white text-lg font-bold">
                          {gwStats.ownGoals} {!!gwStats.ownGoalPoints && <span className="text-red-400 text-[14px] font-semibold ml-1">({gwStats.ownGoalPoints} pts)</span>}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Appeared</span>
                        <span className="text-white text-lg font-bold">
                          {gwStats.appeared ? 'Yes' : 'No'}
                          {!!gwStats.appearancePoints && <span className="text-gaffer-orange text-[14px] font-semibold ml-1">(+{gwStats.appearancePoints} pts)</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Condition B: Active Squad View (Recent Form & Next Match) */}
                {!gameweekId && recentHistory.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 mt-4">
                      <span className="text-white text-sm font-medium tracking-wide">Points breakdown</span>
                      <span className="text-white text-sm font-medium tracking-wide pl-2">Points</span>
                    </div>
                    <div className="space-y-2.5">
                      {recentHistory.map((h) => {
                        const events = [
                          h.goalsScored > 0 && `${h.goalsScored} goal${h.goalsScored > 1 ? 's' : ''}`,
                          h.assists > 0 && `${h.assists} assist${h.assists > 1 ? 's' : ''}`,
                          h.yellowCards > 0 && `${h.yellowCards} yellow`,
                          h.redCards > 0 && `${h.redCards} red`,
                          h.ownGoals > 0 && `${h.ownGoals} OG`,
                        ].filter(Boolean)
                        return (
                          <div key={h._id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-white text-[13px] font-normal tracking-wide flex-shrink-0">
                                GW{h.gameweekId?.gameweekNumber ?? '–'}
                              </span>
                              <span className="text-[#a1a1aa] text-[11px] truncate">
                                {!h.appeared ? 'Did not play' : events.length > 0 ? events.join(', ') : 'Appearance only'}
                              </span>
                            </div>
                            <span className="text-white font-bold text-[14px] flex-shrink-0">{h.totalPoints}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Next Match — only if fixture exists */}
                {!gameweekId && hasNextMatch && (
                  <div className="mb-4 mt-4 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white text-[13px] font-bold tracking-wide">Next Match</span>
                      <span className="text-[#e95a0c] text-[11px] font-medium tracking-wide">
                        Gameweek {uniqueFixtures[0]?.gameweek ?? '–'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {uniqueFixtures.map((fixture, i) => (
                        <FixtureRow key={i} fixture={fixture} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons — sticky at bottom of sheet */}
              <div className="sticky bottom-0 bg-[#2b2d3c] px-6 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]">
                <div className="flex justify-around items-center">
                  {[
                    {
                      label: 'Make Captain',
                      icon: <span className="font-bold text-[32px] text-white">C</span>,
                      onClick: () => captainMutation.mutate(player.id),
                    },
                    {
                      label: player.isOnPitch ? 'Sub Out' : 'Sub In',
                      icon: <CornerUpLeft size={34} className="text-white" strokeWidth={2.5} />,
                      onClick: () => {
                        useFantasyStore.getState().setSubstitutingOutId(player.id)
                        onClose()
                      }
                    },
                    {
                      label: 'Transfer',
                      icon: <ArrowRightLeft size={30} className="text-white" strokeWidth={2.5} />,
                      onClick: () => {
                        onTransfer?.(player.id)
                        onClose()
                      }
                    }
                  ].map((action, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 w-24">
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={action.onClick}
                        className="w-[72px] h-[72px] rounded-full bg-[#0d4a25] text-white flex items-center justify-center shadow-2xl active:bg-[#0a3a1d] transition-colors border-2 border-white/5"
                      >
                        {action.icon}
                      </motion.button>
                      <button type="button" onClick={action.onClick} className="text-white text-[12px] font-bold tracking-tight text-center leading-tight">{action.label}</button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
      )}
    </AnimatePresence>
  )
}
