'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Info, Plus, MessageSquare, Users, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GradientButton } from '@/components/GradientButton'

interface PlayerSlot {
  id: string
  name: string | null
  number: string | null
  team: 'A' | 'B'
  position: { x: number; y: number }
}

export function AdminLiveMatchDetails() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'lineup' | 'commentary'>('lineup')
  const [isLive, setIsLive] = useState(false)

  // Mock data for the pitch slots
  const [slotsA, setSlotsA] = useState<PlayerSlot[]>([
    { id: 'a1', name: null, number: null, team: 'A', position: { x: 50, y: 10 } }, // GK
    { id: 'a2', name: null, number: null, team: 'A', position: { x: 20, y: 25 } },
    { id: 'a3', name: null, number: null, team: 'A', position: { x: 40, y: 25 } },
    { id: 'a4', name: null, number: null, team: 'A', position: { x: 60, y: 25 } },
    { id: 'a5', name: null, number: null, team: 'A', position: { x: 80, y: 25 } },
    { id: 'a6', name: null, number: null, team: 'A', position: { x: 30, y: 40 } },
    { id: 'a7', name: null, number: null, team: 'A', position: { x: 50, y: 40 } },
    { id: 'a8', name: null, number: null, team: 'A', position: { x: 70, y: 40 } },
    { id: 'a9', name: null, number: null, team: 'A', position: { x: 40, y: 55 } },
    { id: 'a10', name: null, number: null, team: 'A', position: { x: 60, y: 55 } },
    { id: 'a11', name: null, number: null, team: 'A', position: { x: 50, y: 70 } },
  ])

  return (
    <div className="min-h-screen bg-[#0F111A] text-white pb-10">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[#0F111A]/80 backdrop-blur-md z-40">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-chakra font-black text-xl uppercase tracking-tight">Live Game</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white transition-colors">
          <Info size={20} />
        </button>
      </header>

      <main className="px-6 space-y-8">
        {/* Scoreboard */}
        <section className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <span className="text-green-500 font-bold text-xs uppercase tracking-widest">Full Time</span>
          </div>

          <div className="flex items-center justify-between w-full max-w-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-white/5 p-2 border border-white/10">
                <img src="/images/barca_logo.png" className="w-full h-full object-contain" alt="Barca" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="font-chakra font-black text-5xl">2</span>
              <span className="text-white/20 font-chakra font-black text-5xl">-</span>
              <span className="font-chakra font-black text-5xl">2</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-white/5 p-2 border border-white/10">
                <img src="/images/mc_logo.png" className="w-full h-full object-contain" alt="Man City" />
              </div>
            </div>
          </div>

          {/* Go Live Toggle */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <label className="relative inline-flex items-center cursor-pointer scale-125">
              <input type="checkbox" className="sr-only peer" checked={isLive} onChange={() => setIsLive(!isLive)} />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] italic">Go Live</span>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button 
            onClick={() => setActiveTab('lineup')}
            className={`flex-1 flex items-center justify-center py-4 font-chakra font-black text-sm uppercase tracking-wider relative transition-colors ${activeTab === 'lineup' ? 'text-white' : 'text-white/40'}`}
          >
            Line-up
            {activeTab === 'lineup' && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-600"
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
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-600"
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'lineup' ? (
            <motion.div 
              key="lineup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Team 1 Info */}
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-2 font-chakra font-black text-xs uppercase text-white/90">
                   <div className="w-5 h-5 rounded-full bg-black/20 p-0.5 border border-white/5">
                    <img src="/images/barca_logo.png" className="w-full h-full object-contain" alt="" />
                   </div>
                   COCCS
                 </div>
                 <span className="text-white/40 font-chakra font-black text-[10px] tracking-widest">3-5-2</span>
              </div>

              {/* Pitch */}
              <div className="aspect-[3/5] w-full bg-[#1C1F2D] rounded-[32px] border-2 border-white/10 relative overflow-hidden shadow-2xl">
                {/* Pitch Markings */}
                <div className="absolute inset-4 border-2 border-white/10 rounded-2xl pointer-events-none">
                   <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/10 rounded-full" />
                   
                   {/* Top Goal Area */}
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-t-0 border-white/10" />
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 border-2 border-t-0 border-white/10" />

                   {/* Bottom Goal Area */}
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-b-0 border-white/10" />
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 border-2 border-b-0 border-white/10" />
                </div>

                {/* Player Slots */}
                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  {/* Home Team (Top) */}
                  <div className="space-y-8">
                    <div className="flex justify-center"><PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" /></div>
                    <div className="flex justify-around">
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                    </div>
                    <div className="flex justify-around px-10">
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                    </div>
                    <div className="flex justify-center gap-12">
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                      <PitchSlot color="bg-[#EAB308]/20" border="border-[#EAB308]/40" iconColor="text-[#EAB308]" />
                    </div>
                  </div>

                  {/* Away Team (Bottom) */}
                  <div className="space-y-8">
                    <div className="flex justify-center gap-12">
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                    </div>
                    <div className="flex justify-around px-10">
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                    </div>
                    <div className="flex justify-around">
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                      <PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" />
                    </div>
                    <div className="flex justify-center"><PitchSlot color="bg-[#EF4444]/20" border="border-[#EF4444]/40" iconColor="text-[#EF4444]" /></div>
                  </div>
                </div>
              </div>

              {/* Team 2 Info */}
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-2 font-chakra font-black text-xs uppercase text-white/90">
                   <div className="w-5 h-5 rounded-full bg-black/20 p-0.5 border border-white/5">
                    <img src="/images/barca_logo.png" className="w-full h-full object-contain" alt="" />
                   </div>
                   COCCS
                 </div>
                 <span className="text-white/40 font-chakra font-black text-[10px] tracking-widest">3-5-2</span>
              </div>

              <div className="pb-8">
                 <GradientButton className="h-16 w-full rounded-2xl font-chakra font-black text-lg uppercase tracking-wider shadow-[0_10px_40px_rgba(255,0,0,0.3)]">
                   Save
                 </GradientButton>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="commentary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-[#1C1F2D] rounded-2xl p-4 border border-white/5 space-y-4">
                 <textarea 
                  placeholder="Add a comment..."
                  className="w-full bg-[#0F111A] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors min-h-[100px]"
                 />
                 <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                       <button className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg border border-yellow-500/20">
                          Card
                       </button>
                       <button className="p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
                          Goal
                       </button>
                    </div>
                    <GradientButton className="h-10 px-6 rounded-xl font-chakra font-black text-sm uppercase">
                       Post
                    </GradientButton>
                 </div>
              </div>

              <div className="space-y-3">
                 <CommentaryItem 
                    time="90'" 
                    text="Full Time !!! Civil Engineering takes the win in a hard-fought derby."
                    type="goal"
                    team="CIVIL"
                 />
                 <CommentaryItem 
                    time="85'" 
                    text="Substitution, CIVIL. Victor replaces Segun because of a tactical change."
                    type="substitution"
                    team="CIVIL"
                 />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function PitchSlot({ color, border, textColor }: { color: string, border: string, textColor: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer">
      <div className={`w-10 h-10 rounded-full ${color} border-2 ${border} flex items-center justify-center text-white shadow-lg backdrop-blur-sm`}>
        <Plus size={20} className={textColor} />
      </div>
      <div className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded border border-white/5">
        <span className="text-[8px] font-bold text-white/60">-</span>
      </div>
    </div>
  )
}

function CommentaryItem({ time, text, type, team }: { time: string, text: string, type: string, team: string }) {
  const bgColor = team === 'CIVIL' ? 'bg-[#A11D44]' : 'bg-[#59A8D4]'
  
  return (
    <div className={`${bgColor} rounded-2xl p-4 shadow-lg text-white space-y-1`}>
      <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
        <span className="font-chakra font-black text-[10px] tracking-widest">{type.toUpperCase()}</span>
        <span className="font-chakra font-black text-sm">{time}</span>
      </div>
      <p className="text-sm font-medium leading-relaxed">{text}</p>
    </div>
  )
}
