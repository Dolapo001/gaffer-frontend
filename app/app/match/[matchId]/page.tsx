'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Info, Trophy } from 'lucide-react'
import { MATCHES, type Match } from '@/lib/leagueMockData'

function fetchMatch(matchId: string) {
  return new Promise<Match | undefined>((resolve) =>
    setTimeout(() => resolve(MATCHES.find((m) => m.id === matchId)), 400)
  )
}

export default function MatchCenterPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string
  const [activeTab, setActiveTab] = useState<'lineup' | 'commentary'>('commentary')

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatch(matchId),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center text-white/40">
        <div className="w-10 h-10 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#181928] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-white/40 font-chakra font-black">Match not found</p>
        <button onClick={() => router.back()} className="text-orange-500 font-bold">Go back</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181928] text-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[#181928]/95 backdrop-blur-xl z-40">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-chakra font-black text-xl uppercase tracking-tight">Final Score</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white transition-colors">
          <Info size={20} />
        </button>
      </header>

      <main className="px-6 space-y-10 pb-20">
        {/* Scoreboard */}
        <section className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <span className="text-emerald-500 font-chakra font-black text-xs uppercase tracking-widest">Full Time</span>
          </div>

          <div className="flex items-center justify-between w-full max-w-sm px-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-white/5 p-4 border border-white/10 shadow-2xl">
                <img src="/images/barca_logo.png" className="w-full h-full object-contain" alt="Home" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="font-chakra font-black text-6xl">2</span>
              <span className="text-white/10 font-chakra font-black text-5xl">-</span>
              <span className="font-chakra font-black text-6xl">2</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-white/5 p-4 border border-white/10 shadow-2xl">
                <img src="/images/mc_logo.png" className="w-full h-full object-contain" alt="Away" />
              </div>
            </div>
          </div>

          {/* Goal Scorers */}
          <div className="flex justify-between w-full max-w-sm px-4">
             <div className="space-y-1">
                <p className="text-[12px] font-chakra font-bold text-white/80">De Jong 66&apos;</p>
                <p className="text-[12px] font-chakra font-bold text-white/80">Depay 79&apos;</p>
             </div>
             <div className="space-y-1 text-right">
                <p className="text-[12px] font-chakra font-bold text-white/80">Omoba 59&apos;</p>
                <p className="text-[12px] font-chakra font-bold text-white/80">Palmer 70&apos;</p>
             </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab('lineup')}
            className={`flex-1 flex items-center justify-center py-4 font-chakra font-black text-sm uppercase tracking-wider relative transition-colors ${activeTab === 'lineup' ? 'text-white' : 'text-white/40'}`}
          >
            Line-up
            {activeTab === 'lineup' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-600"
              />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('commentary')}
            className={`flex-1 flex items-center justify-center py-4 font-chakra font-black text-sm uppercase tracking-wider relative transition-colors ${activeTab === 'commentary' ? 'text-white' : 'text-white/40'}`}
          >
            Commentary
            {activeTab === 'commentary' && (
              <motion.div 
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-600"
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'commentary' ? (
            <motion.div 
              key="commentary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              {/* Goal Event 1 - Stylized Card */}
              <div className="bg-[#8E103E] rounded-[24px] px-6 py-5 flex items-center gap-5 border border-white/5 shadow-[0_10px_30px_rgba(142,16,62,0.3)]">
                 <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Trophy size={24} className="text-white fill-white/20" />
                 </div>
                 <p className="font-chakra font-black text-[13px] uppercase leading-tight tracking-tight text-white/90">
                    GOOOOOOOOALLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL!
                 </p>
              </div>

              {/* Yellow Card Event */}
              <div className="bg-[#1C1F2D] rounded-[22px] px-6 py-4 flex items-center gap-4 border border-white/5 shadow-xl">
                 <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <div className="w-4 h-6 bg-yellow-400 rounded-sm" />
                 </div>
                 <div className="flex flex-col">
                    <p className="font-chakra font-black text-[12px] uppercase leading-tight tracking-tight">
                        YELLOW CARD. Dahood (CIVIL)
                    </p>
                    <p className="text-[10px] text-white/40 font-bold font-chakra uppercase">34&apos;</p>
                 </div>
              </div>

              {/* Goal Event 2 - Detailed Goal Card */}
              <div className="bg-[#8E103E] rounded-[24px] px-6 py-5 flex flex-col gap-3 border border-white/5 shadow-[0_10px_30px_rgba(142,16,62,0.3)]">
                 <div className="flex items-center gap-4">
                   <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                     <div className="w-4 h-4 bg-white rounded-full relative shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        <div className="absolute inset-0 border-[1.5px] border-black/10 rounded-full" />
                     </div>
                   </div>
                   <p className="font-chakra font-black text-[12px] uppercase tracking-wider text-white">
                     GOAL. Victor (CIVIL)
                   </p>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                        <path d="M4 16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4z" />
                        <path d="M12 10V6a2 2 0 0 0-2-2H8" />
                     </svg>
                   </div>
                   <p className="font-chakra font-black text-[12px] uppercase tracking-wider text-white/50">
                     ASSIT. Segun (CIVIL)
                   </p>
                 </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="lineup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div 
                className="w-full relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[12px] overflow-hidden"
                style={{ height: '780px', backgroundColor: '#1E212D' }}
              >
                {/* Pitch Markings */}
                <div className="absolute inset-x-4 inset-y-6 border-[1.5px] border-white pointer-events-none">
                   {/* Halfway line */}
                   <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-white -translate-y-1/2" />
                   
                   {/* Center Circle */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-[1.5px] border-white rounded-full" />
                   
                   {/* Top Penalty Area */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-[1.5px] border-t-0 border-white">
                     {/* Top 6-yard box */}
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 border-[1.5px] border-t-0 border-white" />
                   </div>

                   {/* Bottom Penalty Area */}
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-[1.5px] border-b-0 border-white">
                     {/* Bottom 6-yard box */}
                     <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 border-[1.5px] border-b-0 border-white" />
                   </div>
                </div>

                {/* Player Slots */}
                <div className="absolute inset-0 py-10 flex flex-col justify-between">
                  {/* Home Team (Top) a 4-4-2 */}
                  <div className="space-y-7 z-10 w-full">
                    <div className="flex justify-center">
                       <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                    </div>
                    <div className="flex justify-around px-8">
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                    </div>
                    <div className="flex justify-around px-[10%]">
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                    </div>
                    <div className="flex justify-center gap-20">
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#403816]" border="border-[#756621]/60" iconColor="text-[#EAB308]" />
                    </div>
                  </div>

                  {/* Away Team (Bottom) a 4-4-2 */}
                  <div className="space-y-7 z-10 w-full">
                    <div className="flex justify-center gap-20">
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                    </div>
                    <div className="flex justify-around px-[10%]">
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                    </div>
                    <div className="flex justify-around px-8">
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                      <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                    </div>
                    <div className="flex justify-center">
                       <PitchSlot color="bg-[#3F1414]" border="border-[#7A2020]/60" iconColor="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function PitchSlot({ color, border, iconColor }: { color: string, border: string, iconColor: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer">
      <div className={`w-[44px] h-[44px] rounded-full ${color} border-[1.5px] ${border} flex items-center justify-center`}>
        <div className={`w-3.5 h-3.5 flex items-center justify-center ${iconColor}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </div>
      </div>
      <div className="bg-[#13151D] px-[10px] py-[2px] rounded border border-white/5 shadow-2xl">
        <span className="text-[10px] font-bold text-white/40 leading-none">-</span>
      </div>
    </div>
  )
}
