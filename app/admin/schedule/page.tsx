'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Menu, ChevronDown, Calendar, Clock, X, ChevronLeft } from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'
import { useToast } from '@/store/toastStore'

type Match = {
  id: string
  teamA: string
  teamB: string
  teamALogo: string
  teamBLogo: string
  time: string
  date: string
  round: string
  score?: string
  isLive: boolean
}

export default function SchedulePage() {
  const { addToast } = useToast()
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [matches, setMatches] = useState<Match[]>([
    {
      id: '1',
      teamA: 'Engineering',
      teamB: 'Law',
      teamALogo: '/images/mc_logo.png',
      teamBLogo: '/images/barca_logo.png',
      time: '14:00',
      date: 'SAT 14:00',
      round: 'Round 4',
      isLive: false
    },
    {
      id: '2',
      teamA: 'Engineering',
      teamB: 'Law',
      teamALogo: '/images/mc_logo.png',
      teamBLogo: '/images/barca_logo.png',
      time: '14:00',
      date: 'SAT 14:00',
      round: 'Round 4',
      isLive: false
    }
  ])

  const [previousMatches] = useState<Match[]>([
    {
      id: '3',
      teamA: 'Engineering',
      teamB: 'Law',
      teamALogo: '/images/mc_logo.png',
      teamBLogo: '/images/barca_logo.png',
      time: '14:00',
      date: 'SAT 14:00',
      round: 'Round 1',
      score: '1:0',
      isLive: false
    },
    {
      id: '4',
      teamA: 'Engineering',
      teamB: 'Law',
      teamALogo: '/images/mc_logo.png',
      teamBLogo: '/images/barca_logo.png',
      time: '14:00',
      date: 'SAT 14:00',
      round: 'Round 1',
      score: '1:3',
      isLive: false
    },
    {
      id: '5',
      teamA: 'Engineering',
      teamB: 'Law',
      teamALogo: '/images/mc_logo.png',
      teamBLogo: '/images/barca_logo.png',
      time: '14:00',
      date: 'SAT 14:00',
      round: 'Round 1',
      score: '1:0',
      isLive: false
    }
  ])

  const isEmpty = matches.length === 0 && previousMatches.length === 0

  return (
    <div className="min-h-screen bg-[#0F111A] text-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex items-center gap-4">
        {showScheduleForm ? (
          <button 
            onClick={() => setShowScheduleForm(false)}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-lg"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <button 
            onClick={() => addToast('Menu coming soon', 'info')}
            className="text-white/60"
          >
            <Menu size={28} />
          </button>
        )}
        <h1 className="font-chakra font-black text-xl uppercase tracking-tight">
          {showScheduleForm ? 'Schedule Game' : 'Your Schedule'}
        </h1>
      </div>

      <div className="px-6 pb-40 flex-1 flex flex-col justify-center min-h-[60vh]">
        {isEmpty ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center space-y-4"
          >
            <h2 className="font-chakra font-black text-3xl text-white uppercase tracking-tight">
              What&apos;s up next?
            </h2>
            <p className="text-white/40 max-w-[280px] text-sm font-medium leading-[1.6]">
              Manage your schedule for matches ,ceremonies , Schedule now and for later
            </p>
          </motion.div>
        ) : !showScheduleForm ? (
          <div className="space-y-8">
            {/* Next Match Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="font-chakra font-black text-lg uppercase">Next Match</h3>
                <span className="text-orange-500 font-bold text-xs">Round 4</span>
              </div>
              <div className="space-y-3">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>

            {/* Previous Matches Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-chakra font-black text-lg uppercase">Previous Matches</h3>
                <p className="text-orange-500 font-bold text-xs uppercase tracking-widest">Round 1</p>
              </div>
              <div className="space-y-3">
                {previousMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1">Round</label>
                <div className="relative">
                  <select className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium">
                    <option>Round 1</option>
                    <option>Round 2</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Date</label>
                  <div className="relative">
                    <input type="text" defaultValue="20/4/26" className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none font-medium" />
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Start Time</label>
                  <div className="relative">
                    <input type="text" defaultValue="2:00 PM" className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none font-medium" />
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Team A</label>
                <div className="relative">
                  <select className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium">
                    <option>Barcelona</option>
                    <option>Engineering</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Team B</label>
                <div className="relative">
                  <select className="w-full h-14 bg-[#1C1F2D] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium">
                    <option>Real Madrid</option>
                    <option>Law</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="pt-4">
                <GradientButton 
                  onClick={() => {
                    const newMatch: Match = {
                      id: Date.now().toString(),
                      teamA: 'Barcelona',
                      teamB: 'Real Madrid',
                      teamALogo: '/images/barca_logo.png',
                      teamBLogo: '/images/mc_logo.png',
                      time: '14:00',
                      date: 'SUN 14:00',
                      round: 'Round 1',
                      isLive: false
                    };
                    setMatches([newMatch, ...matches]);
                    setShowScheduleForm(false);
                    addToast('Game scheduled successfully!', 'success');
                  }}
                  className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider"
                >
                  Schedule Game
                </GradientButton>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      {!showScheduleForm && (
        <button 
          onClick={() => setShowScheduleForm(true)}
          className="fixed bottom-32 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF0000] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,138,0,0.4)] z-40 active:scale-95 transition-transform"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

      {/* Background Blur Overlay for form */}
      <AnimatePresence>
        {showScheduleForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

import { useRouter } from 'next/navigation'

function MatchCard({ match }: { match: Match }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [isLive, setIsLive] = useState(match.isLive)

  const handleToggleLive = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.checked;
    setIsLive(nextValue);
    if (nextValue) {
      addToast(`${match.teamA} vs ${match.teamB} is now LIVE!`, 'success');
    }
  }

  return (
    <div 
      onClick={() => router.push(`/admin/schedule/${match.id}`)}
      className="bg-[#1C1F2D] border border-white/5 rounded-[24px] p-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
    >
      <div className="flex items-center justify-between">
        {/* Team A */}
        <div className="flex flex-col items-center gap-2 w-20">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-black/20 p-1">
            <img src={match.teamALogo} className="w-full h-full object-contain" alt="" />
          </div>
          <span className="text-[11px] font-chakra font-bold text-white uppercase truncate w-full text-center">
            {match.teamA}
          </span>
        </div>

        {/* Center Info */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em]">
            {match.date}
          </span>
          <div className="bg-[#0F111A]/60 px-4 py-2 rounded-xl border border-white/5">
            <span className="font-chakra font-black text-xl text-white tracking-widest leading-none">
              {match.score || match.time}
            </span>
          </div>
          
          {!match.score && (
            <div className="flex flex-col items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isLive} onChange={handleToggleLive} />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
              <span className="text-[8px] text-orange-500 font-bold uppercase tracking-widest italic leading-none">Go Live</span>
            </div>
          )}
        </div>

        {/* Team B */}
        <div className="flex flex-col items-center gap-2 w-20">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-black/20 p-1">
            <img src={match.teamBLogo} className="w-full h-full object-contain" alt="" />
          </div>
          <span className="text-[11px] font-chakra font-bold text-white uppercase truncate w-full text-center">
            {match.teamB}
          </span>
        </div>
      </div>
    </div>
  )
}
