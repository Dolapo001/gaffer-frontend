'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getMatchState, getMatchEvents } from '@/lib/services/match.service'
import { listLineups } from '@/lib/services/fixture.service'
import { getPreferences, followMatch, unfollowMatch } from '@/lib/services/notifications.service'
import { ChevronLeft, Info, Zap, Bell, BellOff } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import type { MatchEvent } from '@/lib/services/match.service'

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event }: { event: MatchEvent }) {
  const isGoal = ['goal', 'own_goal', 'penalty_scored'].includes(event.type)
  const isCard = ['yellow_card', 'red_card'].includes(event.type)
  const isSub = event.type === 'substitution'

  const teamName =
    typeof event.teamId === 'object' && event.teamId
      ? (event.teamId as any).shortName ?? (event.teamId as any).name
      : ''

  const playerName =
    typeof event.playerId === 'object' && event.playerId
      ? `${(event.playerId as any).firstName} ${(event.playerId as any).lastName}`
      : ''

  if (isGoal) {
    return (
      <div className="bg-[#8E103E] rounded-2xl px-5 py-4 flex items-center gap-4 border border-white/5 shadow-lg">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-lg">⚽</span>
        </div>
        <div>
          <p className="font-display font-black text-[11px] uppercase tracking-wider text-white">
            GOAL — {teamName}
          </p>
          {playerName && (
            <p className="text-white/80 text-[11px] font-body mt-0.5">
              {playerName} {event.minute ? `${event.minute}'` : ''}
              {event.commentaryText && ` · ${event.commentaryText}`}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (isCard) {
    const cardColor = event.type === 'yellow_card' ? 'bg-yellow-400' : 'bg-red-500'
    return (
      <div className="bg-gaffer-surface rounded-2xl px-5 py-4 flex items-center gap-4 border border-gaffer-border">
        <div className={`w-5 h-7 ${cardColor} rounded-sm flex-shrink-0`} />
        <div>
          <p className="font-display font-bold text-xs uppercase text-white">
            {event.type === 'yellow_card' ? 'Yellow Card' : 'Red Card'}
            {playerName ? ` — ${playerName}` : ''}
          </p>
          <p className="text-gaffer-muted text-[10px] font-body">{event.minute ? `${event.minute}'` : ''}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gaffer-card rounded-2xl px-5 py-3 flex items-center gap-3 border border-gaffer-border">
      <span className="text-gaffer-orange text-xs font-display font-bold w-8 flex-shrink-0">
        {event.minute ? `${event.minute}'` : '—'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-body capitalize">
          {event.type.replace(/_/g, ' ')}
          {playerName ? ` — ${playerName}` : ''}
          {teamName ? ` (${teamName})` : ''}
        </p>
        {event.commentaryText && (
          <p className="text-gaffer-muted text-[11px] font-body mt-0.5 line-clamp-2">
            {event.commentaryText}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Pitch Slot ───────────────────────────────────────────────────────────────

function PitchSlot({
  name,
  jerseyNumber,
  colorClass,
}: {
  name: string
  jerseyNumber?: number
  colorClass?: string
}) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-11 h-11 rounded-full ${colorClass ?? 'bg-gaffer-orange/30'} border border-white/20 flex items-center justify-center`}>
        <span className="text-white text-[11px] font-display font-black">
          {jerseyNumber ?? initials}
        </span>
      </div>
      <div className="bg-black/60 rounded px-2 py-0.5">
        <span className="text-[8px] text-white font-body font-semibold leading-none truncate max-w-[44px] block text-center">
          {name.split(' ')[0]}
        </span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MatchCenterPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string
  const [activeTab, setActiveTab] = useState<'lineup' | 'commentary'>('commentary')

  const { data, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => getMatchState(matchId),
    refetchInterval: (query) => {
      // Poll every 30s during live matches
      return (query as any).state?.data?.fixture?.status === 'live' ? 30_000 : false
    },
  })

  const { data: allEvents } = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: () => getMatchEvents(matchId),
    enabled: activeTab === 'commentary',
    refetchInterval: data?.fixture?.status === 'live' ? 30_000 : false,
  })

  const { data: lineups } = useQuery({
    queryKey: ['lineups', matchId],
    queryFn: () => listLineups(matchId),
    enabled: activeTab === 'lineup',
  })

  const { data: prefs, refetch: refetchPrefs } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences
  })

  const isFollowing = prefs?.preferences?.followedMatches?.includes(matchId) ?? false
  const toast = useToastStore()

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowMatch(matchId)
        toast.addToast('Unfollowed match alerts', 'info')
      } else {
        await followMatch(matchId)
        toast.addToast('Following match alerts ⚽', 'success')
      }
      refetchPrefs()
    } catch (err) {
      toast.addToast('Failed to update alerts', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex flex-col items-center justify-center gap-4">
        <p className="text-gaffer-muted font-body">Match not found</p>
        <button onClick={() => router.back()} className="text-gaffer-orange font-body font-medium">
          Go back
        </button>
      </div>
    )
  }

  const { fixture, recentEvents } = data
  const events = allEvents ?? recentEvents
  const homeTeam = typeof fixture.homeTeamId === 'object' ? fixture.homeTeamId : null
  const awayTeam = typeof fixture.awayTeamId === 'object' ? fixture.awayTeamId : null
  const competition = typeof fixture.competitionId === 'object' ? fixture.competitionId : null
  const round = typeof fixture.roundId === 'object' ? fixture.roundId : null

  const isLive = fixture.status === 'live' || fixture.status === 'halftime'
  const isCompleted = fixture.status === 'completed'

  const statusLabel =
    fixture.status === 'live'
      ? 'LIVE'
      : fixture.status === 'halftime'
      ? 'HALF TIME'
      : fixture.status === 'completed'
      ? 'Full Time'
      : fixture.status === 'suspended'
      ? 'SUSPENDED'
      : 'Scheduled'

  return (
    <div className="min-h-screen bg-gaffer-bg text-white">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-gaffer-bg/95 backdrop-blur-xl z-40 border-b border-gaffer-border">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          {competition && (
            <p className="text-gaffer-muted text-[10px] font-body">{competition.name}</p>
          )}
          {round && <p className="text-gaffer-orange text-[10px] font-body">{round.name}</p>}
        </div>
        <button
          onClick={toggleFollow}
          className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
            isFollowing 
              ? 'bg-gaffer-orange/20 border-gaffer-orange text-gaffer-orange' 
              : 'bg-gaffer-card border-gaffer-border text-white/40'
          }`}
        >
          {isFollowing ? <Bell size={18} fill="currentColor" /> : <BellOff size={18} />}
        </button>
      </header>

      <main className="px-4 space-y-6 pb-20">
        {/* Scoreboard */}
        <section className="pt-4">
          <div className="text-center mb-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-display font-bold px-3 py-1 rounded-full ${
              isLive ? 'bg-red-500 text-white' : isCompleted ? 'bg-gaffer-card text-gaffer-orange border border-gaffer-orange/30' : 'bg-gaffer-card text-gaffer-muted border border-gaffer-border'
            }`}>
              {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center justify-between px-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              {homeTeam?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={homeTeam.logoUrl} alt={homeTeam.name} className="w-16 h-16 object-contain rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gaffer-orange/20 border border-gaffer-orange/30 flex items-center justify-center text-2xl text-gaffer-orange font-display font-bold">
                  {homeTeam?.name?.[0] ?? 'H'}
                </div>
              )}
              <p className="font-display font-bold text-white text-sm text-center leading-tight">
                {homeTeam?.shortName ?? homeTeam?.name ?? 'Home'}
              </p>
            </div>

            <div className="px-4 text-center">
              <p className="font-display font-black text-5xl text-white leading-none">
                {fixture.score.home}
                <span className="text-gaffer-orange mx-2 text-4xl">–</span>
                {fixture.score.away}
              </p>
              {fixture.kickoffAt && (
                <p className="text-gaffer-muted text-[10px] font-body mt-1">
                  {new Date(fixture.kickoffAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              {awayTeam?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={awayTeam.logoUrl} alt={awayTeam.name} className="w-16 h-16 object-contain rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-2xl text-blue-400 font-display font-bold">
                  {awayTeam?.name?.[0] ?? 'A'}
                </div>
              )}
              <p className="font-display font-bold text-white text-sm text-center leading-tight">
                {awayTeam?.shortName ?? awayTeam?.name ?? 'Away'}
              </p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex border-b border-gaffer-border">
          {(['commentary', 'lineup'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 font-display font-bold text-sm uppercase tracking-wide relative transition-colors capitalize ${
                activeTab === tab ? 'text-white' : 'text-gaffer-muted'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="matchTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gaffer-orange"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'commentary' ? (
            <motion.div
              key="commentary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {events && events.length > 0 ? (
                [...events].reverse().map((event) => (
                  <EventCard key={event._id} event={event} />
                ))
              ) : (
                <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-8 text-center">
                  <Zap size={28} className="text-gaffer-subtle mx-auto mb-3" />
                  <p className="text-gaffer-muted font-body text-sm">No events yet</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="lineup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {lineups && lineups.length > 0 ? (
                lineups.map((lineup) => {
                  const teamName = typeof lineup.teamId === 'object' ? (lineup.teamId as any).name : 'Team'
                  return (
                    <div key={lineup._id} className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-display font-bold text-sm">{teamName}</p>
                        <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full border ${
                          lineup.status === 'approved'
                            ? 'text-green-400 bg-green-400/10 border-green-400/30'
                            : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
                        }`}>
                          {lineup.status}
                        </span>
                      </div>
                      <p className="text-gaffer-muted text-xs font-body mb-2">
                        Starters ({lineup.starters.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {lineup.starters.map((id) => (
                          <div key={id} className="text-gaffer-subtle text-[10px] font-body bg-gaffer-card px-2 py-1 rounded-lg border border-gaffer-border">
                            {id.slice(-4)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-8 text-center">
                  <p className="text-gaffer-muted font-body text-sm">No lineups submitted yet</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
