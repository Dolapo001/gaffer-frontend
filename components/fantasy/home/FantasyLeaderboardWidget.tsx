'use client'

import { asArray } from '@/lib/asArray'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getLeaderboard } from '@/lib/services/fantasy.service'
import { onSocketInitialized } from '@/hooks/useNotificationSocket'
import { useToastStore } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'

interface FantasyLeaderboardWidgetProps {
  competitionId: string
}

export function FantasyLeaderboardWidget({ competitionId }: FantasyLeaderboardWidgetProps) {
  const queryClient = useQueryClient()
  const toast = useToastStore()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [rankDiffs, setRankDiffs] = useState<Record<string, number>>({})
  const prevRanksRef = useRef<Record<string, number>>({})

  const { data: leaderboardRes, isLoading } = useQuery({
    queryKey: ['fantasy-leaderboard', competitionId, 1],
    queryFn: () => getLeaderboard(competitionId, 1),
  })

  const leaderboard = asArray<any>(leaderboardRes?.data)

  // Socket live update listener
  useEffect(() => {
    let activeSocket: any = null
    let handleLiveUpdate: any = null

    onSocketInitialized((socket: any) => {
      activeSocket = socket
      socket.emit('join:competition', competitionId)

      handleLiveUpdate = () => {
        queryClient.invalidateQueries({ queryKey: ['fantasy-leaderboard', competitionId] })
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

  // Track rank shifts when leaderboard data updates
  useEffect(() => {
    if (!leaderboard.length) return

    const newRanks: Record<string, number> = {}
    const newDiffs: Record<string, number> = {}
    const prev = prevRanksRef.current

    leaderboard.forEach((entry) => {
      const id = entry._id
      const currentRank = entry.rank
      newRanks[id] = currentRank

      if (prev[id] !== undefined) {
        // Higher rank = lower rank number (e.g. #1 is better than #3)
        // Diff = prevRank - currentRank (positive means climbed up)
        const diff = prev[id] - currentRank
        if (diff !== 0) {
          newDiffs[id] = diff
        }
      }
    })

    // Check if current user climbed in rank
    if (currentUserId) {
      const userEntry = leaderboard.find((e) => e.userId._id === currentUserId)
      if (userEntry && newDiffs[userEntry._id] && newDiffs[userEntry._id] > 0) {
        const climb = newDiffs[userEntry._id]
        toast.addToast({
          message: `🚀 Rank Up! You climbed +${climb} to #${userEntry.rank}!`,
          type: 'success',
        })
      }
    }

    setRankDiffs(newDiffs)
    prevRanksRef.current = newRanks
  }, [leaderboard, currentUserId])

  if (isLoading) {
    return (
      <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-white/5 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!leaderboard.length) {
    return null
  }

  return (
    <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-gaffer-orange" />
          <h3 className="text-white font-display font-bold text-xs uppercase tracking-wider">
            Fantasy Leaderboard
          </h3>
        </div>
        <span className="text-[9px] font-black font-chakra text-gaffer-muted uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      <div className="space-y-1.5 overflow-hidden">
        <AnimatePresence initial={false}>
          {leaderboard.slice(0, 10).map((entry) => {
            const isMe = entry.userId._id === currentUserId
            const diff = rankDiffs[entry._id] ?? 0

            return (
              <motion.div
                key={entry._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${
                  isMe
                    ? 'bg-gaffer-orange/15 border-gaffer-orange/40 shadow-[0_0_12px_rgba(255,107,0,0.15)]'
                    : 'bg-[#1a1b2e]/60 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Rank & User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1 min-w-[36px]">
                    <span
                      className={`text-xs font-display font-black w-5 text-center ${
                        entry.rank === 1
                          ? 'text-yellow-400'
                          : entry.rank === 2
                          ? 'text-slate-300'
                          : entry.rank === 3
                          ? 'text-amber-600'
                          : 'text-white/60'
                      }`}
                    >
                      #{entry.rank}
                    </span>

                    {/* Rank Diff Indicator */}
                    {diff > 0 ? (
                      <span className="flex items-center text-[9px] font-bold text-emerald-400 font-chakra">
                        <TrendingUp size={10} className="mr-0.5" />+{diff}
                      </span>
                    ) : diff < 0 ? (
                      <span className="flex items-center text-[9px] font-bold text-red-400 font-chakra">
                        <TrendingDown size={10} className="mr-0.5" />
                        {diff}
                      </span>
                    ) : (
                      <Minus size={8} className="text-white/20 ml-1" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-display font-bold text-white truncate flex items-center gap-1.5">
                      {entry.teamName}
                      {isMe && (
                        <span className="text-[8px] bg-gaffer-orange text-white font-black px-1.5 py-0.2 rounded uppercase">
                          YOU
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] font-body text-gaffer-muted truncate">
                      {entry.userId.fullName || entry.userId.username || 'Manager'}
                    </p>
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  {diff > 0 && <Sparkles size={12} className="text-emerald-400 animate-spin" />}
                  <span className="text-sm font-display font-black text-white tabular-nums">
                    {entry.totalPoints} <span className="text-[9px] text-gaffer-muted font-normal">pts</span>
                  </span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
