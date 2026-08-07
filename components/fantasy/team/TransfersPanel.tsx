'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ArrowLeftRight, X, TrendingUp, Coins, SlidersHorizontal, ChevronDown } from 'lucide-react'
import {
  getMyFantasyTeam,
  listFantasyPlayers,
  makeTransfer,
  listGameweeks,
  getStageRules,
  type FantasyPlayer,
} from '@/lib/services/fantasy.service'
import { listCompetitionTeams } from '@/lib/services/competition.service'
import { listFixtures } from '@/lib/services/fixture.service'
import { getCurrentGameweek } from '@/lib/gameweekState'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { formatCoins, formatSquadValue } from '@/lib/format'

const POSITION_LABELS: Record<string, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
}

const POSITION_COLORS: Record<string, string> = {
  GK: 'text-yellow-400',
  DEF: 'text-blue-400',
  MID: 'text-green-400',
  FWD: 'text-gaffer-orange',
}

type SortBy = 'price' | 'totalPoints'

interface TransfersPanelProps {
  competitionId: string
  initialPlayerOutId?: string | null
  onClose: () => void
}

export function TransfersPanel({ competitionId, initialPlayerOutId, onClose }: TransfersPanelProps) {
  const toast = useToastStore()
  const qc = useQueryClient()

  const [playerOutId, setPlayerOutId] = useState<string | null>(initialPlayerOutId ?? null)

  // Transfer market filters
  const [teamFilter, setTeamFilter] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState<SortBy>('price')
  const [affordableOnly, setAffordableOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (initialPlayerOutId) setPlayerOutId(initialPlayerOutId)
  }, [initialPlayerOutId])

  const { data: myTeam, isLoading: teamLoading } = useQuery({
    queryKey: ['fantasy-team-me', competitionId],
    queryFn: () => getMyFantasyTeam(competitionId),
  })

  const { data: compTeams } = useQuery({
    queryKey: ['competition-teams', competitionId],
    queryFn: () => listCompetitionTeams(competitionId),
  })

  const { data: gameweeks = [] } = useQuery({
    queryKey: ['gameweeks', competitionId],
    queryFn: () => listGameweeks(competitionId),
  })

  const { data: fixtures = [] } = useQuery({
    queryKey: ['fixtures', competitionId],
    queryFn: () => listFixtures(competitionId),
  })

  const currentGw = gameweeks.length ? getCurrentGameweek(gameweeks, fixtures) : undefined
  const stageRules = getStageRules(currentGw?.stage)

  const squad: FantasyPlayer[] = myTeam
    ? [...((myTeam as any).startingXI ?? []), ...((myTeam as any).bench ?? [])]
    : []

  const playerOut = squad.find((p: FantasyPlayer) => p._id === playerOutId)
  const filterPosition = playerOut?.position

  // Budget: what the user can spend after selling playerOut
  const bankBalance: number = (myTeam as any)?.bankBalance ?? 0
  const freeTransfersRemaining: number = (myTeam as any)?.transferState?.freeTransfersAvailable ?? 1
  const sellValue: number = (playerOut as any)?.sellPrice ?? playerOut?.price ?? 0
  const maxAffordable = Math.round((bankBalance + sellValue) * 10) / 10

  // Build query params for transfer market
  const marketParams: Parameters<typeof listFantasyPlayers>[1] = {
    position: filterPosition,
    pageSize: 50,
    sortBy,
    // CompetitionTeam.teamId is the actual Team._id that FantasyPlayer.teamId references
    teamId: teamFilter,
    ...(affordableOnly && playerOut ? { maxPrice: maxAffordable } : {}),
  }

  const { data: poolData, isLoading: poolLoading } = useQuery({
    queryKey: ['fantasy-players', competitionId, filterPosition, teamFilter, sortBy, affordableOnly ? maxAffordable : 'all'],
    queryFn: () => listFantasyPlayers(competitionId, marketParams),
    enabled: !!playerOutId,
  })

  const transferMutation = useMutation({
    mutationFn: ({ inId, outId }: { inId: string; outId: string }) =>
      makeTransfer(competitionId, inId, outId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fantasy-team-me', competitionId] })
      toast.addToast('Transfer completed!', 'success')
      onClose()
    },
    onError: (err) => {
      toast.addToast(getErrorMessage(err), 'error')
    },
  })

  const playerName = (p: FantasyPlayer) => {
    const pid = p.playerId as any
    return pid ? `${pid.firstName} ${pid.lastName}` : p._id.slice(-6)
  }
  const teamName = (p: FantasyPlayer) => (p.teamId as any)?.name ?? ''

  // Budget affordability check (client-side, with 0.001 float safety margin)
  const canAfford = (p: FantasyPlayer) => p.price <= maxAffordable + 0.001

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full bg-gaffer-surface border-t border-gaffer-border rounded-t-[2.5rem] max-w-md md:max-w-xl lg:max-w-2xl mx-auto shadow-2xl mt-auto overflow-y-auto"
          style={{ maxHeight: '88dvh' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-6 pb-4 sticky top-0 bg-gaffer-surface z-10">
            <button
              onClick={playerOutId && !initialPlayerOutId ? () => setPlayerOutId(null) : onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white"
            >
              {playerOutId && !initialPlayerOutId ? <ChevronLeft size={18} /> : <X size={16} />}
            </button>
            <div className="flex-1">
              <h1 className="font-display font-bold text-white text-base">Transfers</h1>
              <p className="text-gaffer-muted text-xs font-body">
                {playerOutId ? 'Select a replacement' : 'Select a player to transfer out'}
              </p>
            </div>
          </div>

          {/* Stats & Stage Bar */}
          <div className="px-4 pb-3 flex gap-2">
            <div className="flex-1 bg-gaffer-card border border-gaffer-border rounded-xl px-3 py-2 text-center">
              <span className="text-gaffer-muted text-[10px] uppercase tracking-wider block font-semibold">
                Stage Rules
              </span>
              <span className="text-white text-xs font-bold font-chakra">
                {stageRules.name} · Max {stageRules.maxPerRealTeam}/club
              </span>
            </div>
            <div className="flex-1 bg-gaffer-card border border-gaffer-border rounded-xl px-3 py-2 text-center">
              <span className="text-gaffer-muted text-[10px] uppercase tracking-wider block font-semibold">
                Free Transfers
              </span>
              <span className="text-gaffer-orange text-xs font-bold font-chakra">
                {stageRules.isUnlimitedTransfers ? 'Unlimited (Reset)' : `${freeTransfersRemaining} Available`}
              </span>
            </div>
            <div className="flex-1 bg-gaffer-card border border-gaffer-border rounded-xl px-3 py-2 text-center">
              <span className="text-gaffer-muted text-[10px] uppercase tracking-wider block font-semibold">
                Bank
              </span>
              <span className="text-gaffer-orange text-xs font-bold font-chakra">
                {formatSquadValue(bankBalance)}
              </span>
            </div>
          </div>

          <div className="px-4 pb-8 space-y-3">
            {!playerOutId ? (
              /* Step 1: pick player to transfer OUT */
              <>
                <p className="text-gaffer-muted text-xs font-body">Your current squad ({squad.length} players):</p>
                {teamLoading
                  ? [0, 1, 2].map((i) => <div key={i} className="h-14 bg-gaffer-card rounded-2xl animate-pulse" />)
                  : squad.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => setPlayerOutId(p._id)}
                        className="w-full flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-2xl p-3 text-left hover:border-gaffer-orange/40 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center">
                          <span className="text-gaffer-orange font-display font-bold text-sm">{p.position}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-body font-medium text-sm truncate">{playerName(p)}</p>
                          <p className="text-gaffer-muted text-xs font-body">{teamName(p)}</p>
                        </div>
                        <p className="text-gaffer-orange font-display font-bold text-sm flex-shrink-0">
                          {formatSquadValue((p as any).sellPrice ?? p.price)}
                        </p>
                      </button>
                    ))}
              </>
            ) : (
              /* Step 2: pick player to transfer IN */
              <>
                {/* Player OUT card */}
                {playerOut && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-center gap-3">
                    <ArrowLeftRight size={16} className="text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-red-400 text-xs font-body">Transferring out:</p>
                      <p className="text-white font-body font-medium text-sm">{playerName(playerOut)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-gaffer-orange font-display font-bold text-sm block">
                        {formatSquadValue((playerOut as any).sellPrice ?? playerOut.price)}
                      </span>
                      <span className="text-gaffer-muted text-[10px]">sell value</span>
                    </div>
                  </div>
                )}

                {/* Budget affordability info */}
                {playerOut && (
                  <div className="bg-gaffer-card border border-gaffer-border rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-gaffer-muted text-xs font-body">Max you can spend</span>
                    <span className="text-gaffer-orange font-display font-bold text-sm">
                      {formatSquadValue(maxAffordable)}
                    </span>
                  </div>
                )}

                {/* Filter bar */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-body font-medium transition-all ${showFilters ? 'bg-gaffer-orange text-black border-gaffer-orange' : 'bg-gaffer-card border-gaffer-border text-gaffer-muted hover:text-white'}`}
                  >
                    <SlidersHorizontal size={12} />
                    Filters
                  </button>

                  {/* Sort toggle */}
                  <button
                    onClick={() => setSortBy(s => s === 'price' ? 'totalPoints' : 'price')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gaffer-border bg-gaffer-card text-gaffer-muted hover:text-white text-xs font-body font-medium transition-all"
                  >
                    {sortBy === 'price' ? <Coins size={12} /> : <TrendingUp size={12} />}
                    {sortBy === 'price' ? 'By Price' : 'By Points'}
                  </button>

                  {/* Affordable only toggle */}
                  <button
                    onClick={() => setAffordableOnly(a => !a)}
                    className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-body font-medium transition-all ${affordableOnly ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-gaffer-card border-gaffer-border text-gaffer-muted hover:text-white'}`}
                  >
                    Can afford
                  </button>
                </div>

                {/* Expanded filter panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-3 space-y-2">
                        <p className="text-gaffer-muted text-[10px] font-body uppercase tracking-widest">Filter by Team</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setTeamFilter(undefined)}
                            className={`py-1.5 rounded-xl border text-xs font-body transition-all ${!teamFilter ? 'bg-gaffer-orange text-black border-gaffer-orange' : 'bg-gaffer-surface border-gaffer-border text-gaffer-muted hover:text-white'}`}
                          >
                            All Teams
                          </button>
                          {(compTeams ?? []).map((t: any) => (
                            <button
                              key={t.teamId}
                              onClick={() => setTeamFilter(t.teamId)}
                              className={`py-1.5 rounded-xl border text-xs font-body truncate transition-all ${teamFilter === t.teamId ? 'bg-gaffer-orange text-black border-gaffer-orange' : 'bg-gaffer-surface border-gaffer-border text-gaffer-muted hover:text-white'}`}
                            >
                              {t.name || 'Team'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-gaffer-muted text-xs font-body">
                  Showing {filterPosition ? POSITION_LABELS[filterPosition] : 'all'} players
                  {teamFilter ? ' · Filtered by team' : ''}:
                </p>

                {/* Player pool */}
                {poolLoading
                  ? [0, 1, 2].map((i) => <div key={i} className="h-14 bg-gaffer-card rounded-2xl animate-pulse" />)
                  : (poolData?.data ?? [])
                      .filter((p) => !squad.some((s) => s._id === p._id))
                      .map((p) => {
                        const affordable = canAfford(p)
                        return (
                          <button
                            key={p._id}
                            disabled={transferMutation.isPending || !affordable}
                            onClick={() => affordable && transferMutation.mutate({ inId: p._id, outId: playerOutId })}
                            className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left border transition-all ${
                              affordable
                                ? 'bg-gaffer-card border-gaffer-border hover:border-green-500/40 cursor-pointer'
                                : 'bg-gaffer-card/50 border-gaffer-border/40 cursor-not-allowed opacity-50'
                            } ${transferMutation.isPending ? 'opacity-50' : ''}`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${affordable ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                              <span className={`font-display font-bold text-sm ${affordable ? (POSITION_COLORS[p.position] ?? 'text-white') : 'text-white/30'}`}>
                                {p.position}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-body font-medium text-sm truncate ${affordable ? 'text-white' : 'text-white/40'}`}>{playerName(p)}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-gaffer-muted text-xs font-body">{teamName(p)}</p>
                                {(p as any).totalPoints != null && (
                                  <span className="text-[10px] text-gaffer-muted font-body">· {(p as any).totalPoints} pts</span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className={`font-display font-bold text-sm block ${affordable ? 'text-gaffer-orange' : 'text-red-400/60'}`}>
                                {formatSquadValue(p.price)}
                              </span>
                              {!affordable && (
                                <span className="text-[10px] text-red-400/60 font-body">too costly</span>
                              )}
                            </div>
                          </button>
                        )
                      })}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
