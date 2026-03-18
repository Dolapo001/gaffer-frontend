'use client'

import React, { useState, useEffect } from 'react'
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
}

export function AdminLiveMatchDetails() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'lineup' | 'commentary'>('lineup')
  const [isLive, setIsLive] = useState(false)
  const [commentaryStep, setCommentaryStep] = useState<'idle' | 'menu' | 'team' | 'scorer' | 'assist'>('idle')
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  useEffect(() => {
    const navBar = document.getElementById('admin-nav-bar')
    if (commentaryStep !== 'idle') {
      document.body.style.overflow = 'hidden'
      if (navBar) {
        navBar.style.opacity = '0'
        navBar.style.pointerEvents = 'none'
      }
    } else {
      document.body.style.overflow = ''
      if (navBar) {
        navBar.style.opacity = ''
        navBar.style.pointerEvents = ''
      }
    }
    
    return () => {
      document.body.style.overflow = ''
      if (navBar) {
        navBar.style.opacity = ''
        navBar.style.pointerEvents = ''
      }
    }
  }, [commentaryStep])

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
        <section className="flex flex-col items-center space-y-2">
          <div className="text-center">
            <span className="text-green-500 font-black text-[12px] uppercase tracking-widest italic">Full Time</span>
          </div>

          <div className="flex items-center justify-between w-full max-w-sm px-4">
            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-20 h-20 rounded-full bg-white/5 p-4 border border-white/10 shadow-lg backdrop-blur-sm">
                <img src="/images/barca_logo.png" className="w-full h-full object-contain" alt="Barca" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center min-w-[100px]">
               <div className="flex items-center gap-4 mb-2">
                  <span className="font-chakra font-black text-4xl text-white">2</span>
                  <span className="text-white/20 font-chakra font-black text-2xl">-</span>
                  <span className="font-chakra font-black text-4xl text-white">2</span>
               </div>
            </div>

            <div className="flex flex-col items-center gap-3 flex-1">
              <div className="w-20 h-20 rounded-full bg-white/5 p-4 border border-white/10 shadow-lg backdrop-blur-sm">
                <img src="/images/mc_logo.png" className="w-full h-full object-contain" alt="Man City" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between w-full max-w-sm px-6 text-[10px] font-chakra font-bold text-white/60 tracking-tighter">
             <div className="flex flex-col text-left">
                <span>De Jong 66&apos;</span>
                <span>Depay 79&apos;</span>
             </div>
             <div className="flex flex-col text-right">
                <span>Omoba 59&apos;</span>
                <span>Palmer 70&apos;</span>
             </div>
          </div>

          {/* Go Live Toggle */}
          <div className="flex flex-col items-center gap-2 pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isLive} onChange={() => setIsLive(!isLive)} />
              <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
            <span className="text-[10px] text-orange-500 font-chakra font-black uppercase tracking-[0.2em] italic">Go Live</span>
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
              {/* Pitch */}
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
              {/* Commentary Feed (with blur background for active steps) */}
              <div className={`space-y-6 pt-4 transition-all duration-300 ${commentaryStep !== 'idle' ? 'opacity-10 blur-md pointer-events-none' : ''}`}>
                
                {/* Mock Live Event: Substitution */}
                <div className="bg-[#1C1F2D] rounded-[22px] px-6 py-5 flex flex-col gap-3 border border-white/5 relative group">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <Repeat size={16} className="text-gaffer-muted" />
                        </div>
                        <p className="font-chakra font-black text-[12px] uppercase text-white/90">Substitution. COCCS</p>
                     </div>
                     <Edit2 size={14} className="text-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-6 pl-11">
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[11px] font-bold text-white/40 uppercase">Out. Victor</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[11px] font-bold text-white/40 uppercase">In. Dahood</span>
                     </div>
                  </div>
                  <span className="absolute top-5 right-6 text-[10px] font-bold text-white/20">84&apos;</span>
                </div>

                {/* Mock Live Event: Attempt Missed (from image 4 style) */}
                <div className="bg-[#5AA1D1] rounded-[18px] px-6 py-4 flex items-center justify-between border border-white/5 shadow-lg">
                   <p className="text-[#0A1D2D] font-chakra font-bold text-[11px] leading-relaxed uppercase pr-4">
                     Attempt missed. Tunde (MECH) header from the center of the box is close, but misses to the right.
                   </p>
                </div>

                {/* Mock Live Event: Goal (from image 2 style) */}
                <div className="bg-[#8E103E] rounded-[24px] px-6 py-5 flex flex-col gap-3 border border-white/5 shadow-xl relative group">
                   <div className="flex items-center gap-4">
                     <div className="w-8 h-8 flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full relative shadow-lg" />
                     </div>
                     <p className="font-chakra font-black text-[12px] uppercase tracking-wide text-white">GOAL. Dahood (COCCS)</p>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="w-8 h-8 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40">
                           <path d="M4 16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4z" />
                        </svg>
                     </div>
                     <p className="font-chakra font-black text-[11px] uppercase tracking-widest text-white/50">ASSIST. Victor (COCCS)</p>
                   </div>
                   <span className="absolute top-5 right-6 text-[10px] font-bold text-white/30">79&apos;</span>
                </div>

                {/* Placeholder input */}
                <div className="bg-white/5 rounded-[22px] px-6 py-5 border border-white/5 border-dashed flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Edit2 size={16} className="text-white/20" />
                  </div>
                  <span className="text-white/20 font-chakra font-bold text-xs uppercase tracking-widest">Awaiting next action...</span>
                </div>
              </div>

              {/* Step: Goal/Card/Attempt Visualization */}
              {commentaryStep !== 'idle' && selectedAction && ['GOAL', 'RED CARD', 'YELLOW CARD', 'SUBSTITUTION', 'ATTEMPT MISSED'].includes(selectedAction) && (
                <div className="flex flex-col items-center justify-center pt-20 space-y-6">
                   <motion.div 
                     initial={{ scale: 0.5, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     className="w-full flex flex-col items-center justify-center relative"
                   >
                      <div className={`absolute w-48 h-48 rounded-full animate-pulse -z-10 ${
                                          selectedAction === 'GOAL' ? 'bg-white/5' : 
                                          selectedAction === 'RED CARD' ? 'bg-red-500/10' : 
                                          selectedAction === 'YELLOW CARD' ? 'bg-yellow-500/10' :
                                          'bg-blue-500/10'
                                        }`} />

                      {selectedAction === 'GOAL' ? (
                        <Trophy size={80} className="text-white/20" />
                      ) : selectedAction === 'SUBSTITUTION' ? (
                        <Repeat size={80} className="text-white/20" />
                      ) : selectedAction === 'ATTEMPT MISSED' ? (
                        <div className="relative flex flex-col items-center">
                           {/* Goal Post SVG */}
                           <div className="relative">
                              <span className="absolute -top-12 left-1/2 -translate-x-1/2 text-red-500 font-chakra font-black text-6xl">X</span>
                              <svg width="240" height="140" viewBox="0 0 240 140" fill="none" className="opacity-60">
                                 <path d="M10 130 V 20 H 230 V 130" stroke="white" strokeWidth="4" strokeLinecap="round" />
                                 <path d="M10 20 L 40 10 H 200 L 230 20" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                                 <path d="M40 10 V 110 M 200 10 V 110" stroke="white" strokeWidth="2" strokeOpacity="0.3" />
                                 <path d="M10 130 H 230" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
                                 {/* Net Effect */}
                                 <pattern id="net" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />
                                 </pattern>
                                 <rect x="10" y="20" width="220" height="110" fill="url(#net)" />
                              </svg>
                           </div>
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ rotate: -20, y: 50 }}
                          animate={{ rotate: 0, y: 0 }}
                          className="relative"
                        >
                           <svg width="120" height="160" viewBox="0 0 120 160" className="drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                              <rect 
                                x="20" y="0" width="80" height="120" rx="10" 
                                className={selectedAction === 'RED CARD' ? 'fill-red-600' : 'fill-yellow-500'} 
                              />
                           </svg>
                        </motion.div>
                      )}
                   </motion.div>
                   <h2 className={`font-chakra font-black text-6xl italic opacity-20 tracking-tighter uppercase text-center w-full px-6 ${
                                    selectedAction === 'RED CARD' ? 'text-red-500' : 
                                    selectedAction === 'YELLOW CARD' ? 'text-yellow-500' : 'text-white'
                                  }`}>
                     {selectedAction}
                   </h2>
                </div>
              )}

              {/* Floating Action Menu & Flow Overlay */}
              <AnimatePresence>
                {commentaryStep !== 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex flex-col items-end justify-end p-6 pb-[220px]"
                  >
                    {/* Dark Overlay with click to close */}
                    <div 
                      className="absolute inset-0 bg-black/80 backdrop-blur-[4px] -z-10" 
                      onClick={() => setCommentaryStep('idle')}
                    />

                    {/* Step Content */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="w-full flex flex-col items-end gap-3"
                    >
                      {commentaryStep === 'menu' && (
                        <div className="flex flex-col items-end gap-3 w-full max-h-[60vh] overflow-y-auto no-scrollbar pb-10 pr-1">
                          {actionTypes.slice().reverse().map((action, idx) => (
                            <motion.button
                              key={action.label}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => {
                                setSelectedAction(action.label)
                                setCommentaryStep('team')
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
                              onClick={() => {
                                if (['RED CARD', 'YELLOW CARD', 'GOAL', 'SUBSTITUTION', 'ATTEMPT MISSED'].includes(selectedAction || '')) {
                                  setCommentaryStep('scorer') // 'scorer' is used as 'player out' for subs or 'player' for misses
                                } else {
                                  setCommentaryStep('idle')
                                }
                              }}
                              className="flex items-center gap-3 w-full max-w-[150px] px-4 py-2.5 bg-[#4A4646] rounded-[14px] border border-white/5 text-white shadow-xl active:scale-95 transition-all text-left"
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
                        <div className="flex flex-col items-end gap-3 w-full max-h-[60vh] overflow-y-auto no-scrollbar pb-10 pr-1">
                          <span className="font-chakra font-black text-xs uppercase text-white/40 mb-1 pr-1">
                            {selectedAction === 'SUBSTITUTION' 
                              ? (commentaryStep === 'scorer' ? 'PLAYER OUT' : 'PLAYER IN')
                              : selectedAction?.includes('CARD') 
                                ? 'SELECT PLAYER' 
                                : (commentaryStep === 'scorer' ? 'GOAL SCORER' : 'ASSIST')
                            }
                          </span>
                          {players.map((player, idx) => (
                            <motion.button
                              key={`${player.name}-${idx}`}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              onClick={() => {
                                if ((selectedAction === 'GOAL' || selectedAction === 'SUBSTITUTION') && commentaryStep === 'scorer') {
                                  setCommentaryStep('assist')
                                } else {
                                  setCommentaryStep('idle')
                                }
                              }}
                              className="flex items-center justify-between w-full max-w-[210px] px-4 py-2 bg-[#4A4646]/90 backdrop-blur-md rounded-[12px] border border-white/5 text-white shadow-xl active:scale-95 transition-all text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-white/10 p-1">
                                  <img src={selectedAction === 'SUBSTITUTION' && commentaryStep === 'assist' ? "/images/mc_logo.png" : "/images/barca_logo.png"} className="w-full h-full object-contain" alt="" />
                                </div>
                                <span className="font-chakra font-black text-[13px] uppercase tracking-wide">{player.name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-white/40 uppercase pl-3">{player.pos}</span>
                            </motion.button>
                          ))}
                          {selectedAction === 'GOAL' && commentaryStep === 'scorer' && (
                             <motion.button
                                onClick={() => setCommentaryStep('idle')}
                                className="flex items-center justify-center w-full max-w-[210px] px-4 py-2 bg-[#4A4646]/90 backdrop-blur-md rounded-[12px] border border-white/5 text-white shadow-xl active:scale-95 transition-all font-chakra font-black text-[13px] uppercase tracking-wider"
                             >
                                OWN GOAL
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
