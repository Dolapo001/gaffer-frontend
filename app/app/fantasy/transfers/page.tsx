'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyFantasyTeam,
  listFantasyPlayers,
  makeTransfer,
  type FantasyPlayer,
} from '@/lib/services/fantasy.service'
import { useFantasyStore } from '@/store/fantasyStore'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { ChevronLeft, ArrowLeftRight, Search, X } from 'lucide-react'
import { useGoBack } from '@/hooks/useGoBack'

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

export default function TransfersPage() {
  const router = useRouter()
  const goBack = useGoBack('/app/fantasy')
  const toast = useToastStore()
  const qc = useQueryClient()
  const { competitionId } = useFantasyStore()

  const [playerOutId, setPlayerOutId] = useState<string | null>(null)
  const [positionFilter, setPositionFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data: myTeam, isLoading: teamLoading } = useQuery({
    queryKey: ['fantasy-team-me', competitionId],
    queryFn: () => getMyFantasyTeam(competitionId!),
    enabled: !!competitionId,
  })

  // When a player is selected to go out, filter pool by their position
  const playerOut = myTeam?.squad?.find((p: FantasyPlayer) => p._id === playerOutId)
  const filterPosition = playerOut
    ? playerOut.position
    : positionFilter ?? undefined

  const { data: poolData, isLoading: poolLoading } = useQuery({
    queryKey: ['fantasy-players', competitionId, filterPosition, search],
    queryFn: () =>
      listFantasyPlayers(competitionId!, {
        position: filterPosition,
        pageSize: 50,
      }),
    enabled: !!competitionId,
  })

  const transferMutation = useMutation({
    mutationFn: ({ inId, outId }: { inId: string; outId: string }) =>
      makeTransfer(competitionId!, inId, outId),
    onSuccess: (res: { message: string; cost: number; type: string }) => {
      qc.invalidateQueries({ queryKey: ['fantasy-team-me', competitionId] })
      toast.addToast(
        res.cost < 0
          ? `Transfer made (${res.cost} pts hit)`
          : 'Transfer made — no points deducted',
        'success',
      )
      setPlayerOutId(null)
    },
    onError: (err: unknown) => {
      toast.addToast(getErrorMessage(err), 'error')
    },
  })

  const squad: FantasyPlayer[] = (myTeam?.squad as any[]) ?? []

  const playerName = (p: FantasyPlayer) => {
    const pid = p.playerId as any
    return pid ? `${pid.firstName} ${pid.lastName}` : p._id.slice(-6)
  }

  const teamName = (p: FantasyPlayer) => {
    const tid = p.teamId as any
    return tid?.name ?? ''
  }

  if (!competitionId) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex flex-col items-center justify-center px-6 text-center">
        <p className="text-gaffer-muted font-body text-sm">No competition selected.</p>
        <button
          onClick={goBack}
          className="mt-4 text-gaffer-orange font-body font-medium"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gaffer-bg pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-gaffer-border sticky top-0 bg-gaffer-bg/95 backdrop-blur-xl z-20">
        <button
          onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-white text-base">Transfers</h1>
          <p className="text-gaffer-muted text-xs font-body">
            {playerOutId ? 'Select a replacement' : 'Select a player to transfer out'}
          </p>
        </div>
        {playerOutId && (
          <button
            onClick={() => setPlayerOutId(null)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-gaffer-muted"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Step 1: Select player OUT */}
      {!playerOutId ? (
        <div className="px-4 pt-4 space-y-3">
          <p className="text-gaffer-muted text-xs font-body">Your current squad ({squad.length} players):</p>
          {teamLoading ? (
            [0,1,2].map(i => <div key={i} className="h-14 bg-gaffer-card rounded-2xl animate-pulse" />)
          ) : squad.length > 0 ? (
            squad.map((p) => (
              <motion.button
                key={p._id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPlayerOutId(p._id)}
                className="w-full flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-2xl p-3 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center">
                  <span className="text-gaffer-orange font-display font-bold text-sm">
                    {p.position}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-body font-medium text-sm truncate">{playerName(p)}</p>
                  <p className="text-gaffer-muted text-xs font-body">{teamName(p)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-gaffer-orange font-display font-bold text-sm">£{p.price}m</p>
                  <p className={`text-[10px] font-display font-bold ${POSITION_COLORS[p.position] ?? 'text-gaffer-muted'}`}>
                    {p.position}
                  </p>
                </div>
              </motion.button>
            ))
          ) : (
            <div className="text-center py-10 text-gaffer-muted font-body text-sm">
              No squad set yet. Pick your team first.
            </div>
          )}
        </div>
      ) : (
        /* Step 2: Pick replacement */
        <div className="px-4 pt-4 space-y-3">
          {/* Selected out player */}
          {playerOut && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 flex items-center gap-3">
              <ArrowLeftRight size={16} className="text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-400 text-xs font-body">Transferring out:</p>
                <p className="text-white font-body font-medium text-sm">{playerName(playerOut)}</p>
              </div>
              <span className="text-gaffer-orange font-display font-bold text-sm">£{playerOut.price}m</span>
            </div>
          )}

          {/* Pool filter */}
          <p className="text-gaffer-muted text-xs font-body">
            Showing {filterPosition ? POSITION_LABELS[filterPosition] : 'all'} players:
          </p>

          {/* Player pool */}
          {poolLoading ? (
            [0,1,2].map(i => <div key={i} className="h-14 bg-gaffer-card rounded-2xl animate-pulse" />)
          ) : (
            (poolData?.data ?? [])
              .filter((p) => !squad.some((s) => s._id === p._id)) // exclude current squad
              .map((p) => (
                <motion.button
                  key={p._id}
                  whileTap={{ scale: 0.98 }}
                  disabled={transferMutation.isPending}
                  onClick={() =>
                    transferMutation.mutate({ inId: p._id, outId: playerOutId })
                  }
                  className="w-full flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-2xl p-3 text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <span className={`font-display font-bold text-sm ${POSITION_COLORS[p.position] ?? 'text-white'}`}>
                      {p.position}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-body font-medium text-sm truncate">{playerName(p)}</p>
                    <p className="text-gaffer-muted text-xs font-body">{teamName(p)}</p>
                  </div>
                  <span className="text-gaffer-orange font-display font-bold text-sm flex-shrink-0">
                    £{p.price}m
                  </span>
                </motion.button>
              ))
          )}
        </div>
      )}
    </div>
  )
}
