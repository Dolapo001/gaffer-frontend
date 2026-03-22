'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { getTopScorers, getTopAssists } from '@/lib/services/stats.service'

export default function PlayerStatsPage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  const [tab, setTab] = useState<'goals' | 'assists'>('goals')

  const { data: scorers, isLoading: loadingScorers } = useQuery({
    queryKey: ['top-scorers', leagueId],
    queryFn: () => getTopScorers(leagueId),
  })

  const { data: assists, isLoading: loadingAssists } = useQuery({
    queryKey: ['top-assists', leagueId],
    queryFn: () => getTopAssists(leagueId),
  })

  const isLoading = tab === 'goals' ? loadingScorers : loadingAssists;
  const rawData = tab === 'goals' ? scorers : assists;
  
  const hasData = rawData && rawData.length > 0;
  const players = hasData ? rawData.map((p, i) => ({
    name: typeof p.playerId === 'string' ? 'Player' : `${p.playerId.firstName} ${p.playerId.lastName}`,
    team: typeof p.teamId === 'string' ? '' : p.teamId.name,
    crest: typeof p.teamId === 'string' ? '' : p.teamId.logoUrl,
    value: tab === 'goals' ? (p.goals || 0) : (p.assists || 0),
    trend: i % 3 === 0 ? 'up' : i % 3 === 1 ? 'down' : 'steady',
    image: typeof p.playerId !== 'string' ? p.playerId.photoUrl : ''
  })) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#10111d] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/5 border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-[#10111d] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
           <Target size={40} className="text-white/20" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2 uppercase tracking-tight">No Stats Available</h2>
        <p className="text-white/40 text-sm max-w-xs font-medium">There are currently no {tab} recorded for this league.</p>
        <button onClick={() => router.back()} className="mt-8 text-gaffer-orange font-black uppercase tracking-[0.2em] text-xs">Go Back</button>
      </div>
    );
  }

  const topPlayer = players[0];
  const otherPlayers = players.slice(1);

  return (
    <div className="min-h-screen bg-[#10111d] relative overflow-hidden pb-10">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover grayscale"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#10111d]/50 via-[#10111d]/80 to-[#10111d]" />
      </div>

      {/* Header */}
      <div className="relative pt-12 pb-4 px-6 flex items-center justify-between z-10">
        <button onClick={() => router.back()} className="text-white p-1 hover:text-gaffer-orange transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-white text-[22px] font-black uppercase tracking-tight">Tables</h1>
        <div className="w-8" />
      </div>

      <div className="relative z-10 px-5 max-w-md mx-auto">
        {/* Top Player Highlight Card */}
        <div className="mt-6 bg-[#1a2138]/40 border border-white/5 rounded-[28px] p-6 pt-8 pb-4 relative overflow-hidden backdrop-blur-xl shadow-2xl">
           <div className="flex flex-col relative z-20">
              <div className="flex items-center gap-3 mb-6">
                 {topPlayer.crest && (
                   <img src={topPlayer.crest} className="w-7 h-7 object-contain" alt="" />
                 )}
                 <span className="text-white/80 text-[14px] font-black uppercase tracking-widest leading-none">
                    {topPlayer.team || 'TBD'}
                 </span>
              </div>

              <h2 className="text-white text-[26px] font-black tracking-tight mb-2 uppercase">
                 {topPlayer.name}
              </h2>
              <span className="text-white/50 text-[12px] font-bold uppercase tracking-[0.2em] mb-4">
                 {tab === 'goals' ? 'Goals Score' : 'Assists Score'}
              </span>

              <span className="text-[#FFAC33] text-[58px] font-black leading-none tracking-tighter italic">
                 {topPlayer.value}
              </span>
           </div>

           {/* Large Player Image (Right aligned) */}
           <div className="absolute top-0 right-[-20px] bottom-0 w-[240px] pointer-events-none z-10 overflow-hidden">
              <img 
                src={topPlayer.image || "https://www.fcbarcelona.com/fcbarcelona/photo/2022/08/02/ae0e1577-080c-43f1-8b06-444a539f379a/21-FRENKIE-DE-JONG.png"} 
                className="h-full w-full object-contain object-right-bottom scale-110 translate-y-2 opacity-90 drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
                alt=""
              />
           </div>
        </div>

        {/* List of Stats */}
        <div className="mt-8 flex flex-col gap-6">
           {otherPlayers.map((player: any, i: number) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               className="flex items-center justify-between group cursor-pointer"
             >
                <div className="flex items-center gap-4 min-w-0">
                   {/* Trend Indicator */}
                   <div className="w-6 flex justify-center">
                      {player.trend === 'up' ? (
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[9px] border-b-[#00D1FF]" />
                      ) : player.trend === 'down' ? (
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[9px] border-t-[#EE4B2B]" />
                      ) : (
                        <div className="w-4 h-1 bg-white/30 rounded-full" />
                      )}
                   </div>

                   {/* Player Avatar / Crest Area */}
                   <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex items-center justify-center p-0.5 border border-white/5">
                      {player.crest ? (
                        <img src={player.crest} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full bg-[#1a2138] flex items-center justify-center text-white/20 select-none">
                           <Target size={20} className="" />
                        </div>
                      )}
                   </div>

                   {/* Name */}
                   <span className="text-white text-[17px] font-black uppercase tracking-tight truncate group-hover:text-gaffer-orange transition-colors decoration-gaffer-orange">
                      {player.name}
                   </span>
                </div>

                {/* Score */}
                <span className="text-white text-[22px] font-black italic tracking-wider">
                   {player.value}
                </span>
             </motion.div>
           ))}
        </div>
      </div>
    </div>
  )
}

function Target({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
