'use client'

import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getMatchState, getMatchEvents, type MatchEvent } from '@/lib/services/match.service'
import { ChevronLeft, Info, RefreshCcw, Goal, CornerDownRight } from 'lucide-react'

export default function MatchCenterPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string
  const [activeTab, setActiveTab] = useState<'lineup' | 'commentary'>('commentary')

  const { data: matchData, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => getMatchState(matchId),
  })

  const { data: allEvents } = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: () => getMatchEvents(matchId),
  })

  const events = useMemo(() => {
    return Array.isArray(allEvents) ? allEvents : (allEvents as any)?.events || [];
  }, [allEvents]);

  const fixture = matchData?.fixture;
  
  // Calculate Scorers from Events
  const scorers = useMemo(() => {
    if (!events.length || !fixture) return { home: [], away: [] };
    const homeGoals = events.filter((e: MatchEvent) => (e.type === 'goal' || e.type === 'penalty_scored') && (typeof e.teamId === 'string' ? e.teamId === fixture.homeTeamId?._id : (e.teamId as any)?._id === fixture.homeTeamId?._id));
    const awayGoals = events.filter((e: MatchEvent) => (e.type === 'goal' || e.type === 'penalty_scored') && (typeof e.teamId === 'string' ? e.teamId === fixture.awayTeamId?._id : (e.teamId as any)?._id === fixture.awayTeamId?._id));
    
    return {
      home: homeGoals.map((g: MatchEvent) => ({ name: g.commentaryText?.split(' ')[1] || 'Player', minute: `${g.minute || 0}'` })),
      away: awayGoals.map((g: MatchEvent) => ({ name: g.commentaryText?.split(' ')[1] || 'Player', minute: `${g.minute || 0}'` }))
    };
  }, [events, fixture]);

  if (isLoading) return <LoadingSpinner />
  if (!fixture) return <NotFound router={router} />

  const isCompleted = fixture.status === 'completed'
  const isLive = fixture.status === 'live'

  const homeTeam = fixture.homeTeamId;
  const awayTeam = fixture.awayTeamId;

  return (
    <div className="min-h-screen bg-[#10111d] text-white pb-10">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-[#10111d] z-50">
        <button onClick={() => router.back()} className="text-white p-1">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-[18px] font-bold tracking-tight">
          {isCompleted ? 'Final Score' : isLive ? 'Live Match' : 'Match Schedule'}
        </h1>
        <button className="text-white p-1 opacity-60">
          <Info size={18} />
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
                    <img src={homeTeam.logoUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-white/20 font-black text-xl">{homeTeam.name[0]}</div>
                  )}
               </div>
               <span className="text-white text-[12px] font-black uppercase tracking-wider text-center line-clamp-1">{homeTeam.shortName || homeTeam.name}</span>
            </div>

            <div className="flex items-center gap-4">
               <span className="text-[48px] font-black italic tracking-tighter leading-none">{fixture.score.home}</span>
               <span className="text-[32px] font-black italic tracking-widest text-white/10">-</span>
               <span className="text-[48px] font-black italic tracking-tighter leading-none">{fixture.score.away}</span>
            </div>

            <div className="flex flex-col items-center gap-3 w-[100px]">
               <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-full p-2">
                  {awayTeam.logoUrl ? (
                    <img src={awayTeam.logoUrl} alt="" className="w-full h-full object-contain" />
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
                   <div className="relative">
                      {/* Top Team Header (Inside content) */}
                      <div className="flex items-center justify-between px-3 mb-6">
                         <div className="flex items-center gap-2">
                            {homeTeam.logoUrl && <img src={homeTeam.logoUrl} className="w-4 h-4 object-contain" alt="" />}
                            <span className="text-white text-[14px] font-black uppercase tracking-wider">{homeTeam.shortName || homeTeam.name}</span>
                         </div>
                         <span className="text-white/40 text-[13px] font-black tracking-widest italic leading-none">{fixture.formation || '4-3-3'}</span>
                      </div>

                      <div className="relative">
                         <Pitch lineup={fixture.lineup} />
                      </div>

                      {/* Bottom Team Header */}
                      <div className="flex items-center justify-between px-3 mt-6">
                         <div className="flex items-center gap-2">
                            {awayTeam.logoUrl && <img src={awayTeam.logoUrl} className="w-4 h-4 object-contain" alt="" />}
                            <span className="text-white text-[14px] font-black uppercase tracking-wider">{awayTeam.shortName || awayTeam.name}</span>
                         </div>
                         <span className="text-white/40 text-[13px] font-black tracking-widest italic leading-none">{fixture.awayFormation || '4-3-3'}</span>
                      </div>
                   </div>
               </motion.div>
            ) : (
               <motion.div 
                  key="commentary"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-3 px-1"
               >
                  {events && events.length > 0 ? (
                    [...events].reverse().map((event: MatchEvent, i: number) => (
                      <CommentaryCard key={event._id || i} event={event} />
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

function CommentaryCard({ event }: { event: MatchEvent }) {
   const eventType = event.type || 'event';
   
   const isMainEvent = ['fulltime', 'goal', 'goal_long', 'goal_info', 'substitution', 'corner', 'penalty_scored'].includes(eventType);
   const isYellow = eventType === 'yellow_card' || eventType === 'yellow';
   
   const bgColor = isMainEvent ? 'bg-[#8E103E]' : isYellow ? 'bg-[#5C92C1]' : 'bg-[#5C92C1]';
   
   const content = event.commentaryText || '';

   return (
      <div className={`${bgColor} rounded-[18px] p-4 flex items-center gap-4 transition-all hover:scale-[1.01] shadow-lg`}>
         <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            {eventType === 'substitution' && <RefreshCcw size={18} className="text-white" />}
            {eventType.includes('goal') && <Goal size={20} className="text-white" />}
            {eventType === 'corner' && <CornerDownRight size={18} className="text-white" />}
            {isYellow && <div className="w-4 h-6 bg-yellow-400 rounded-sm" />}
            {eventType === 'fulltime' && <Goal size={18} className="text-white opacity-50" />}
            {eventType === 'attempt' && <div className="w-2 h-2 rounded-full bg-white/40" />}
         </div>
         
         <p className="text-white text-[12px] font-bold leading-tight tracking-tight whitespace-pre-line">
            {content}
         </p>
      </div>
   )
}

function Pitch({ lineup }: { lineup?: any[] }) {
   return (
      <div className="w-full aspect-[1/1.8] bg-[#1e212f] border-[1.5px] border-white/10 rounded-[28px] relative overflow-hidden shadow-2xl">
         {/* Pitch Markings */}
         <div className="absolute inset-x-12 top-[-1px] h-16 border-x border-b border-white opacity-40" />
         <div className="absolute inset-x-20 top-[-1px] h-6 border-x border-b border-white opacity-40" />
         <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/20" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full" />
         <div className="absolute inset-x-12 bottom-[-1px] h-16 border-x border-t border-white opacity-40" />
         <div className="absolute inset-x-20 bottom-[-1px] h-6 border-x border-t border-white opacity-40" />

         <div className="flex flex-col justify-between h-full w-full py-6 z-10">
            {lineup && lineup.length > 0 ? (
               <div className="w-full h-full flex flex-col justify-between py-6">
                  <div className="flex justify-center"><PlayerPos name={lineup.find(p => p.role === 'gk')?.playerId?.lastName || 'GK'} initial="GK" color="bg-[#5C5020]" /></div>
                  <div className="flex justify-around">
                     {lineup.filter(p => p.role === 'def').slice(0, 4).map((p, i) => (
                        <PlayerPos key={i} name={p.playerId?.lastName || 'DEF'} initial={p.playerId?.lastName?.[0] || 'D'} color="bg-[#1D3E64]" />
                     ))}
                  </div>
                  <div className="flex justify-around">
                      {lineup.filter(p => p.role === 'mid').slice(0, 3).map((p, i) => (
                        <PlayerPos key={i} name={p.playerId?.lastName || 'MID'} initial={p.playerId?.lastName?.[0] || 'M'} color="bg-[#0D4429]" />
                     ))}
                  </div>
                  <div className="flex justify-around">
                      {lineup.filter(p => p.role === 'att').slice(0, 2).map((p, i) => (
                        <PlayerPos key={i} name={p.playerId?.lastName || 'ATT'} initial={p.playerId?.lastName?.[0] || 'A'} color="bg-[#5C5020]" />
                     ))}
                  </div>
               </div>
            ) : (
               <div className="w-full h-full flex flex-col justify-between py-6 opacity-30">
                  <div className="flex justify-center"><PlayerPos name="TBD" initial="ARS" color="bg-[#5C5020]" /></div>
                  <div className="flex justify-between px-4">
                     <PlayerPos name="TBD" initial="A" color="bg-[#5C5020]" />
                     <PlayerPos name="TBD" initial="I" color="bg-[#5C5020]" />
                     <PlayerPos name="TBD" initial="E" color="bg-[#1D3E64]" />
                     <PlayerPos name="TBD" initial="P" color="bg-[#1D3E64]" />
                  </div>
                  <div className="flex justify-around w-full px-12">
                     <PlayerPos name="TBD" initial="D" color="bg-[#5C5020]" />
                     <PlayerPos name="TBD" initial="G" color="bg-[#0D4429]" />
                  </div>
                  <div className="flex justify-center"><PlayerPos name="TBD" initial="ARS" color="bg-[#5C5020]" /></div>
               </div>
            )}
         </div>
      </div>
   )
}

function PlayerPos({ name, initial, color }: { name: string, initial: string, color: string }) {
   return (
      <div className="flex flex-col items-center gap-1.5 min-w-[50px]">
         <div className={`w-10 h-10 rounded-full ${color} border border-white/10 flex items-center justify-center shadow-lg`}>
            <span className="text-white text-[12px] font-black">{initial?.toUpperCase()}</span>
         </div>
         <div className="bg-[#10111d] rounded-[4px] px-2 py-0.5 border border-white/[0.03]">
            <span className="text-[8px] text-white/70 font-black uppercase tracking-wider">{name}</span>
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
