'use client'

import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMatchState, getMatchEvents, deleteMatchEvent, type MatchEvent } from '@/lib/services/match.service'
import { listLineups } from '@/lib/services/fixture.service'
import {
  followMatch,
  unfollowMatch,
  getPreferences,
} from '@/lib/services/notifications.service'
import { ChevronLeft, Bell, BellOff, RefreshCcw, Goal, CornerDownRight } from 'lucide-react'
import { getImageUrl, getErrorMessage } from '@/lib/api'
import { useGoBack } from '@/hooks/useGoBack'
import { useToastStore } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'

export default function MatchCenterPage() {
  const router = useRouter()
  const goBack = useGoBack('/app/league')
  const params = useParams()
  const matchId = params.matchId as string
  const [activeTab, setActiveTab] = useState<'lineup' | 'commentary'>('commentary')
  const [lineupTeam, setLineupTeam] = useState<'home' | 'away'>('home')
  const qc = useQueryClient()
  const toast = useToastStore()

  const { data: matchData, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => getMatchState(matchId),
  })

  const { data: allEvents, isLoading: isEventsLoading } = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: () => getMatchEvents(matchId),
    enabled: !!matchId,
    staleTime: 0,
    refetchInterval: 15_000,
  })

  // Lineups live at GET /fixtures/:id/lineups, not inside the match state
  const { data: lineupsData } = useQuery({
    queryKey: ['lineups', matchId],
    queryFn: () => listLineups(matchId),
    enabled: !!matchId,
    throwOnError: false,
  })

  // ── Follow / unfollow match ─────────────────────────────────────────────
  // Fetch preferences to determine current follow status
  const { data: prefsData } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences,
    retry: false,
  })
  const isFollowing = prefsData?.preferences?.followedMatches?.includes(matchId) ?? false

  const followMutation = useMutation({
    mutationFn: () => (isFollowing ? unfollowMatch(matchId) : followMatch(matchId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.addToast(isFollowing ? 'Unfollowed match.' : 'Following match — you\'ll get live alerts!', 'success')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const events = useMemo(() => {
    return Array.isArray(allEvents) ? allEvents : (allEvents as any)?.events || [];
  }, [allEvents]);

  const fixture = matchData?.fixture;
  
  const getScorerName = (g: MatchEvent): string => {
    if (g.playerId && typeof g.playerId === 'object') {
      return g.playerId.lastName || g.playerId.firstName || `#${(g.playerId as any).jerseyNumber}` || 'Unknown'
    }
    return 'Unknown'
  }

  // Calculate Scorers from Events
  const scorers = useMemo(() => {
    if (!events.length || !fixture) return { home: [], away: [] };
    const homeGoals = events.filter((e: MatchEvent) => (e.type === 'goal' || e.type === 'penalty_scored') && (typeof e.teamId === 'string' ? e.teamId === fixture.homeTeamId?._id : (e.teamId as any)?._id === fixture.homeTeamId?._id));
    const awayGoals = events.filter((e: MatchEvent) => (e.type === 'goal' || e.type === 'penalty_scored') && (typeof e.teamId === 'string' ? e.teamId === fixture.awayTeamId?._id : (e.teamId as any)?._id === fixture.awayTeamId?._id));

    return {
      home: homeGoals.map((g: MatchEvent) => ({ name: getScorerName(g), minute: `${g.minute || 0}'` })),
      away: awayGoals.map((g: MatchEvent) => ({ name: getScorerName(g), minute: `${g.minute || 0}'` }))
    };
  }, [events, fixture]);

  if (isLoading) return <LoadingSpinner />
  if (!fixture) return <NotFound router={router} />

  const isCompleted = fixture.status === 'completed'
  const isLive = fixture.status === 'live'

  // homeTeamId / awayTeamId may be null or a bare string ID when not populated
  const homeTeam = (fixture.homeTeamId && typeof fixture.homeTeamId === 'object')
    ? fixture.homeTeamId
    : { name: 'Home', shortName: 'HME', logoUrl: null }
  const awayTeam = (fixture.awayTeamId && typeof fixture.awayTeamId === 'object')
    ? fixture.awayTeamId
    : { name: 'Away', shortName: 'AWY', logoUrl: null }

  return (
    <div className="min-h-screen bg-[#10111d] text-white pb-10">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-[#10111d] z-50">
        <button onClick={goBack} className="text-white p-1">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-[18px] font-bold tracking-tight">
          {isCompleted ? 'Final Score' : isLive ? 'Live Match' : 'Match Schedule'}
        </h1>
        {/* Follow match — POST/DELETE /notifications/follow/match/:matchId */}
        <button
          onClick={() => followMutation.mutate()}
          disabled={followMutation.isPending}
          className="p-1 transition-colors disabled:opacity-40"
          aria-label={isFollowing ? 'Unfollow match' : 'Follow match'}
        >
          {isFollowing
            ? <Bell size={20} className="text-gaffer-orange" fill="currentColor" />
            : <BellOff size={20} className="text-white/40 hover:text-white" />
          }
        </button>
      </header>

      {/* Score Section */}
      <section className="mt-4 px-6 mb-10 flex flex-col items-center">
         <span className={`text-[13px] font-black uppercase tracking-widest mb-8 ${isCompleted ? 'text-[#00D1FF]' : 'text-red-500 font-black'}`}>
            {isCompleted ? 'Full Time' : 'Live'}
         </span>

         <div className="flex items-center justify-between w-full max-w-[340px] px-2 mb-8">
            <div className="flex flex-col items-center gap-3 w-[100px]">
               <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-full p-2">
                  {homeTeam.logoUrl ? (
                    <img src={getImageUrl(homeTeam.logoUrl)} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-white/20 font-black text-xl">{homeTeam.name[0]}</div>
                  )}
               </div>
               <span className="text-white text-[12px] font-black uppercase tracking-wider text-center line-clamp-1">{homeTeam.shortName || homeTeam.name}</span>
            </div>

            <div className="flex items-center gap-4">
               <span className="text-[48px] font-black italic tracking-tighter leading-none">{fixture.score?.home ?? 0}</span>
               <span className="text-[32px] font-black italic tracking-widest text-white/10">-</span>
               <span className="text-[48px] font-black italic tracking-tighter leading-none">{fixture.score?.away ?? 0}</span>
            </div>

            <div className="flex flex-col items-center gap-3 w-[100px]">
               <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-full p-2">
                  {awayTeam.logoUrl ? (
                    <img src={getImageUrl(awayTeam.logoUrl)} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-white/20 font-black text-xl">{awayTeam.name[0]}</div>
                  )}
               </div>
               <span className="text-white text-[12px] font-black uppercase tracking-wider text-center line-clamp-1">{awayTeam.shortName || awayTeam.name}</span>
            </div>
         </div>

         {/* Scorers List */}
         <div className="w-full max-w-[350px] flex justify-between px-2 opacity-80 min-h-[40px]">
            <div className="flex flex-col gap-1">
               {scorers.home.map((s: any, i: number) => (
                  <span key={i} className="text-[11px] font-bold text-white/80 uppercase">{s.name} {s.minute}</span>
               ))}
            </div>
            <div className="flex flex-col gap-1 items-end">
               {scorers.away.map((s: any, i: number) => (
                  <span key={i} className="text-[11px] font-bold text-white/80 uppercase">{s.name} {s.minute}</span>
               ))}
            </div>
         </div>
      </section>

      {/* Tabs */}
      <div className="px-6 mb-6">
         <div className="flex border-b border-white/5 relative">
            {(['lineup', 'commentary'] as const).map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-[14px] font-black uppercase tracking-[0.2em] relative transition-colors ${activeTab === tab ? 'text-white' : 'text-white/30'}`}
               >
                  {tab === 'lineup' ? 'Line-up' : 'Commentary'}
                  {activeTab === tab && (
                     <motion.div 
                        layoutId="matchTab"
                        className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-gaffer-orange z-10"
                     />
                  )}
               </button>
            ))}
         </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
         <AnimatePresence mode="wait">
            {activeTab === 'lineup' ? (
               <motion.div
                  key="lineup"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col gap-6 px-1"
               >
                  {/* HOME / AWAY team toggle */}
                  <div className="flex gap-2">
                     {(['home', 'away'] as const).map((side) => (
                        <button
                           key={side}
                           onClick={() => setLineupTeam(side)}
                           className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors ${lineupTeam === side ? 'bg-gaffer-orange text-white' : 'bg-white/5 text-white/40'}`}
                        >
                           {side === 'home' ? (homeTeam.shortName || homeTeam.name) : (awayTeam.shortName || awayTeam.name)}
                        </button>
                     ))}
                  </div>

                  {(() => {
                     const teamId = lineupTeam === 'home'
                        ? (fixture.homeTeamId && typeof fixture.homeTeamId === 'object' ? fixture.homeTeamId._id : fixture.homeTeamId as string)
                        : (fixture.awayTeamId && typeof fixture.awayTeamId === 'object' ? fixture.awayTeamId._id : fixture.awayTeamId as string)
                     
                     // Handle both structured { homeTeam, awayTeam } and legacy array formats
                     let teamLineup = undefined
                     if (lineupsData && !Array.isArray(lineupsData)) {
                        teamLineup = lineupTeam === 'home' ? lineupsData.homeTeam : lineupsData.awayTeam
                     } else if (Array.isArray(lineupsData)) {
                        teamLineup = lineupsData.find((l: any) => {
                           const lid = (typeof l.teamId === 'object' && l.teamId !== null) ? l.teamId._id : l.teamId
                           return lid === teamId
                        })
                     }

                     const formation = lineupTeam === 'home' 
                        ? (teamLineup?.formation || fixture.homeFormation || '4-3-3') 
                        : (teamLineup?.formation || fixture.awayFormation || '4-3-3')
                     return (
                        <div className="relative">
                           <div className="flex items-center justify-between px-3 mb-4">
                              <div className="flex items-center gap-2">
                                 {lineupTeam === 'home'
                                    ? homeTeam.logoUrl && <img src={getImageUrl(homeTeam.logoUrl)} className="w-4 h-4 object-contain" alt="" />
                                    : awayTeam.logoUrl && <img src={getImageUrl(awayTeam.logoUrl)} className="w-4 h-4 object-contain" alt="" />
                                 }
                                 <span className="text-white text-[14px] font-black uppercase tracking-wider">
                                    {lineupTeam === 'home' ? (homeTeam.shortName || homeTeam.name) : (awayTeam.shortName || awayTeam.name)}
                                 </span>
                              </div>
                              <span className="text-white/40 text-[13px] font-black tracking-widest italic leading-none">{formation}</span>
                           </div>
                           <div className="relative">
                               <Pitch teamLineup={teamLineup} formation={formation} />
                           </div>
                        </div>
                     )
                  })()}
               </motion.div>
            ) : (
               <motion.div
                  key="commentary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-3 px-1"
               >
                  {isEventsLoading ? (
                    <div className="flex justify-center py-20">
                       <div className="w-8 h-8 border-2 border-white/10 border-t-gaffer-orange rounded-full animate-spin" />
                    </div>
                  ) : events && events.length > 0 ? (
                    [...events]
                      .filter((e: MatchEvent) => e.description || e.commentaryText || e.notes)
                      .sort((a: MatchEvent, b: MatchEvent) => (b.minute ?? 0) - (a.minute ?? 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((event: MatchEvent, i: number) => (
                        <CommentaryCard key={event._id || i} event={event} matchId={matchId} />
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                       <p className="text-[10px] font-black uppercase tracking-widest font-mono">Commentary will appear as the game unfolds</p>
                    </div>
                  )}
               </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  )
}

function CommentaryCard({ event, matchId }: { event: MatchEvent; matchId: string }) {
   const rawType = (event as any).rawType || event.type || 'event'
   const { role } = useAuthStore()
   const queryClient = useQueryClient()

   const deleteMutation = useMutation({
      mutationFn: () => deleteMatchEvent(matchId, event._id),
      meta: { suppressGlobalError: true },
      onMutate: async () => {
         await queryClient.cancelQueries({ queryKey: ['match-events', matchId] })
         const prev = queryClient.getQueryData(['match-events', matchId])
         queryClient.setQueryData(['match-events', matchId], (old: any) => {
            if (Array.isArray(old)) return old.filter((e: any) => e._id !== event._id)
            return old
         })
         return { prev }
      },
      onError: (_err: unknown, _v: unknown, ctx: any) => {
         queryClient.setQueryData(['match-events', matchId], ctx?.prev)
      },
      onSettled: () => {
         queryClient.invalidateQueries({ queryKey: ['match-events', matchId] })
      },
   })

   const isGoal = ['goal', 'own_goal', 'penalty_scored'].includes(rawType)
   const isSub = rawType === 'substitution'
   const isYellow = rawType === 'yellow_card'
   const isRed = rawType === 'red_card'
   const isFulltime = rawType === 'fulltime'
   const isCorner = rawType === 'corner'

   const bgColor = isGoal || isFulltime ? 'bg-[#8E103E]' : 'bg-[#1C1F2D]'
   const content = event.description || event.commentaryText || event.notes || ''

   return (
      <div className={`${bgColor} rounded-[18px] p-4 flex items-center gap-4 transition-all hover:scale-[1.01] shadow-lg border border-white/5`}>
         <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            {isGoal && <Goal size={20} className="text-white" />}
            {isSub && <RefreshCcw size={18} className="text-white/60" />}
            {isCorner && <CornerDownRight size={18} className="text-white/60" />}
            {isYellow && <div className="w-[10px] h-[14px] bg-yellow-400 rounded-[2px]" />}
            {isRed && <div className="w-[10px] h-[14px] bg-red-500 rounded-[2px]" />}
            {isFulltime && <Goal size={18} className="text-white opacity-40" />}
            {!isGoal && !isSub && !isCorner && !isYellow && !isRed && !isFulltime && (
               <div className="w-2 h-2 rounded-full bg-white/20" />
            )}
         </div>
         <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-bold leading-tight tracking-tight whitespace-pre-line">
               {content}
            </p>
         </div>
         {role === 'organization' && (
            <button
               onClick={() => deleteMutation.mutate(undefined)}
               disabled={deleteMutation.isPending}
               aria-label="Undo commentary"
               className="shrink-0 text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white/70 transition-colors disabled:opacity-30"
               style={{ opacity: deleteMutation.isPending ? 0.3 : undefined }}
            >
               {deleteMutation.isPending ? 'Undoing…' : 'Undo'}
            </button>
         )}
         {event.minute != null && (
            <span className="shrink-0 text-[10px] font-bold text-white/30 uppercase tracking-widest">{event.minute}&apos;</span>
         )}
      </div>
   )
}

function playerLabel(p: any): { name: string; initial: string } {
   if (!p) return { name: '—', initial: '?' }
   // Handle different object structures
   const player = p.playerId && typeof p.playerId === 'object' ? p.playerId : p
   const last = player.lastName || player.firstName || p.playerName || '—'
   const jersey = player.jerseyNumber || p.jerseyNumber || null
   
   return {
      name: last.length > 8 ? last.substring(0, 8) + '.' : last,
      initial: jersey ? String(jersey) : (last[0]?.toUpperCase() || '?'),
   }
}

function Pitch({ teamLineup, formation }: { teamLineup?: any; formation?: string }) {
   // Use explicit SLOTS if available, otherwise fall back to sequential starters
   const slots = teamLineup?.slots || []
   const starters = teamLineup?.players || (Array.isArray(teamLineup) ? teamLineup : [])
   const [defN, midN, attN] = (formation || '4-3-3').split('-').map(Number)

   // 4-3-3 formations normally have 11 slots (0-10)
   // We'll use the same formations mapping logic as the admin side for consistency
   const formationDots = {
      '4-4-2': [
         { t: 88, l: 50 }, { t: 72, l: 15 }, { t: 72, l: 38 }, { t: 72, l: 62 }, { t: 72, l: 85 },
         { t: 45, l: 15 }, { t: 45, l: 38 }, { t: 45, l: 62 }, { t: 45, l: 85 },
         { t: 18, l: 35 }, { t: 18, l: 65 }
      ],
      '4-3-3': [
         { t: 88, l: 50 }, { t: 72, l: 15 }, { t: 72, l: 38 }, { t: 72, l: 62 }, { t: 72, l: 85 },
         { t: 45, l: 25 }, { t: 45, l: 50 }, { t: 45, l: 75 },
         { t: 18, l: 15 }, { t: 18, l: 50 }, { t: 18, l: 85 }
      ],
      '3-5-2': [
         { t: 88, l: 50 }, { t: 72, l: 25 }, { t: 72, l: 50 }, { t: 72, l: 75 },
         { t: 45, l: 10 }, { t: 45, l: 30 }, { t: 45, l: 50 }, { t: 45, l: 70 }, { t: 45, l: 90 },
         { t: 18, l: 35 }, { t: 18, l: 65 }
      ]
   }

   const activeFormation = formationDots[formation as keyof typeof formationDots] || formationDots['4-3-3']
   
   // Map players to their designated slots
   const mappedPlayers: Record<number, any> = {}
   
   if (slots.length > 0) {
      slots.forEach((s: any) => {
         mappedPlayers[s.positionIndex] = s
      })
   } else {
      // Fallback: fill sequentially
      starters.forEach((p: any, i: number) => {
         if (i < activeFormation.length) mappedPlayers[i] = p
      })
   }

   return (
      <div className="w-full aspect-[1/1.5] bg-[#1e212f] border-[1.5px] border-white/10 rounded-[28px] relative overflow-hidden shadow-2xl">
         {/* Pitch Markings */}
         <div className="absolute inset-x-12 top-[-1px] h-16 border-x border-b border-white opacity-10" />
         <div className="absolute inset-x-20 top-[-1px] h-6 border-x border-b border-white opacity-10" />
         <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/10" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-white/10 rounded-full" />
         <div className="absolute inset-x-12 bottom-[-1px] h-16 border-x border-t border-white opacity-10" />
         <div className="absolute inset-x-20 bottom-[-1px] h-6 border-x border-t border-white opacity-10" />

         <div className="absolute inset-0 z-10 p-4">
            {activeFormation.map((pos, i) => {
               const player = mappedPlayers[i]
               const d = playerLabel(player)
               // Convert top-down (admin) to public view positioning
               // Basically, we show it centered
               const top = pos.t
               const left = pos.l

               return (
                  <div 
                     key={i} 
                     className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                     style={{ top: `${top}%`, left: `${left}%` }}
                  >
                     {player ? (
                        <PlayerPos 
                           name={d.name} 
                           initial={d.initial} 
                           color={top > 60 ? 'bg-blue-600' : top > 30 ? 'bg-green-700' : 'bg-orange-600'} 
                        />
                     ) : (
                        <div className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center">
                           <div className="w-1 h-1 rounded-full bg-white/10" />
                        </div>
                     )}
                  </div>
               )
            })}
         </div>

         {(slots.length === 0 && starters.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 z-20">
               <p className="text-[10px] font-black uppercase tracking-widest">Lineup not announced</p>
            </div>
         )}
      </div>
   )
}

function PlayerPos({ name, initial, color }: { name: string, initial: string, color: string }) {
   return (
      <div className="flex flex-col items-center gap-1 min-w-[60px]">
         <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className={`w-9 h-9 rounded-full ${color} border border-white/20 flex items-center justify-center shadow-lg`}
         >
            <span className="text-white text-[11px] font-black">{initial}</span>
         </motion.div>
         <div className="bg-[#10111d]/80 backdrop-blur-sm rounded-[4px] px-1.5 py-0.5 border border-white/10">
            <span className="text-[8px] text-white/90 font-black uppercase tracking-wider">{name}</span>
         </div>
      </div>
   )
}

function LoadingSpinner() {
   return <div className="min-h-screen bg-[#10111d] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-white/5 border-t-gaffer-orange rounded-full animate-spin" />
  </div>
}

function NotFound({ router }: { router: any }) {
   return <div className="min-h-screen bg-[#10111d] flex flex-col items-center justify-center gap-4">
    <p className="text-white/40 font-black italic">Match not found</p>
    <button onClick={() => router.back()} className="text-gaffer-orange font-black uppercase tracking-[0.2em] text-sm">Go back</button>
  </div>
}
