'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, Info, Plus, MessageSquare, Clock, BarChart2, 
  AlertTriangle, Repeat, Square, Play, Edit2, Trophy 
} from 'lucide-react'
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
  const [commentaryStep, setCommentaryStep] = useState<'idle' | 'menu' | 'team' | 'scorer' | 'assist'>('idle')
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  const actionTypes = [
    { label: 'FULLTIME', icon: MessageSquare },
    { label: 'HALFTIME', icon: Clock },
    { label: 'PENALTY', icon: BarChart2 },
    { label: 'ATTEMPT MISSED', icon: AlertTriangle },
    { label: 'SUBSTITUTION', icon: Repeat },
    { label: 'RED CARD', icon: Square, color: 'text-red-500' },
    { label: 'YELLOW CARD', icon: Square, color: 'text-yellow-500' },
    { label: 'GOAL', icon: Trophy },
    { label: 'START', icon: Play },
    { label: 'CUSTOM', icon: Edit2 },
  ]

  const players = [
    { name: 'Dahood', pos: 'GK' },
    { name: 'Dahood', pos: 'LB' },
    { name: 'Dahood', pos: 'CB' },
    { name: 'Dahood', pos: 'CB' },
    { name: 'Dahood', pos: 'RB' },
    { name: 'Dahood', pos: 'CM' },
    { name: 'Dahood', pos: 'CM' },
    { name: 'Dahood', pos: 'DM' },
    { name: 'Dahood', pos: 'RW' },
    { name: 'Dahood', pos: 'CF' },
    { name: 'Dahood', pos: 'LW' },
  ]

  return (
    <div className="min-h-screen bg-[#0F111A] text-white pb-10 relative overflow-hidden">
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
              {/* Blur background for steps */}
              <div className={`space-y-6 pt-4 transition-all duration-300 ${commentaryStep !== 'idle' ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
                <div className="bg-red-900/10 rounded-[24px] p-6 border border-white/5 relative overflow-hidden group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
                      <MessageSquare size={16} className="text-red-500" />
                    </div>
                    <span className="text-white/40 font-medium text-sm">Enter live commentary here</span>
                  </div>
                </div>
              </div>

              {/* Step: Goal Icon (as in image 2) */}
              {commentaryStep === 'team' && selectedAction === 'GOAL' && (
                <div className="flex flex-col items-center justify-center pt-20 space-y-6">
                   <div className="w-32 h-32 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse" />
                      <Trophy size={60} className="text-white/20" />
                   </div>
                   <h2 className="font-chakra font-black text-6xl italic text-white/20 tracking-tighter uppercase">GOAL</h2>
                </div>
              )}

              {/* Floating Action Menu & Flow Overlay */}
              <AnimatePresence>
                {commentaryStep !== 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex flex-col items-end justify-end p-6 pb-24"
                  >
                    {/* Dark Overlay with click to close */}
                    <div 
                      className="absolute inset-0 bg-black/60 backdrop-blur-[2px] -z-10" 
                      onClick={() => {
                        setCommentaryStep('idle')
                      }}
                    />

                    {/* Step Content */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="w-full flex flex-col items-end gap-3"
                    >
                      {commentaryStep === 'menu' && (
                        <div className="flex flex-col items-end gap-3">
                          {actionTypes.map((action, idx) => (
                            <motion.button
                              key={action.label}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (actionTypes.length - idx) * 0.05 }}
                              onClick={() => {
                                setSelectedAction(action.label)
                                setCommentaryStep(action.label === 'GOAL' ? 'team' : 'idle')
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 bg-[#4A4646] rounded-[14px] border border-white/5 text-white shadow-xl active:scale-95 transition-all"
                            >
                              <action.icon size={18} className={action.color} />
                              <span className="font-chakra font-black text-[12px] uppercase tracking-wider">{action.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {commentaryStep === 'team' && (
                        <div className="flex flex-col items-end gap-3 w-full">
                          <span className="font-chakra font-black text-xs uppercase text-white/40 mb-1 pr-1">PICK TEAM</span>
                          {['COCCS', 'COHES'].map((team) => (
                            <motion.button
                              key={team}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => setCommentaryStep('scorer')}
                              className="flex items-center gap-3 w-full max-w-[140px] px-4 py-2.5 bg-[#4A4646] rounded-[14px] border border-white/5 text-white shadow-xl active:scale-95 transition-all text-left"
                            >
                              <div className="w-5 h-5 rounded-full bg-white/10 p-1">
                                <img src="/images/barca_logo.png" className="w-full h-full object-contain" alt="" />
                              </div>
                              <span className="font-chakra font-black text-[12px] uppercase tracking-wider">{team}</span>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {(commentaryStep === 'scorer' || commentaryStep === 'assist') && (
                        <div className="flex flex-col items-end gap-3 w-full max-h-[60vh] overflow-y-auto no-scrollbar pb-4 pr-1">
                          <span className="font-chakra font-black text-xs uppercase text-white/40 mb-1 pr-1">{commentaryStep === 'scorer' ? 'GOAL SCORER' : 'ASSIST'}</span>
                          {players.map((player, idx) => (
                            <motion.button
                              key={`${player.name}-${idx}`}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              onClick={() => {
                                if (commentaryStep === 'scorer') setCommentaryStep('assist')
                                else setCommentaryStep('idle')
                              }}
                              className="flex items-center justify-between w-full max-w-[180px] px-4 py-2.5 bg-[#4A4646] rounded-[14px] border border-white/5 text-white shadow-xl active:scale-95 transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-white/10 p-1">
                                  <img src="/images/barca_logo.png" className="w-full h-full object-contain" alt="" />
                                </div>
                                <span className="font-chakra font-black text-[12px] uppercase tracking-wider">{player.name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-white/40">{player.pos}</span>
                            </motion.button>
                          ))}
                          {commentaryStep === 'scorer' && (
                             <motion.button
                                onClick={() => setCommentaryStep('idle')}
                                className="flex items-center gap-3 w-full max-w-[180px] px-4 py-2.5 bg-[#4A4646] rounded-[14px] border border-white/5 text-white shadow-xl active:scale-95 transition-all text-left"
                             >
                               <span className="font-chakra font-black text-[12px] uppercase tracking-wider">OWN GOAL</span>
                             </motion.button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating Action Button */}
              <button 
                onClick={() => {
                  if (commentaryStep === 'idle') setCommentaryStep('menu')
                  else setCommentaryStep('idle')
                }}
                className={`fixed bottom-32 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF0000] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,138,0,0.4)] z-[60] active:scale-95 transition-all duration-500 ${commentaryStep !== 'idle' ? 'rotate-45' : ''}`}
              >
                <Plus size={32} strokeWidth={3} />
              </button>
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
      <div className={`w-10 h-10 rounded-full ${color} border-2 ${border} flex items-center justify-center text-white shadow-lg backdrop-blur-sm`}>
        <Plus size={20} className={iconColor} />
      </div>
      <div className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded border border-white/5">
        <span className="text-[8px] font-bold text-white/60">-</span>
      </div>
    </div>
  )
}
