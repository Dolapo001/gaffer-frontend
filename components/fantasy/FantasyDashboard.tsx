'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/store/toastStore'
import { useFantasyStore } from '@/store/fantasyStore'
import { getMyFantasyTeam, listGameweeks } from '@/lib/services/fantasy.service'
import { getWallet } from '@/lib/services/payment.service'
import { Sparkles } from 'lucide-react'

const FantasyDashboard: React.FC = () => {
  const router = useRouter()
  const { addToast } = useToast()
  const { competitionId, teamName, totalPoints } = useFantasyStore()

  const { data: myTeam } = useQuery({
    queryKey: ['fantasy-team-me', competitionId],
    queryFn: () => getMyFantasyTeam(competitionId!),
    enabled: !!competitionId,
  })

  const { data: gameweeks } = useQuery({
    queryKey: ['fantasy-gameweeks', competitionId],
    queryFn: () => listGameweeks(competitionId!),
    enabled: !!competitionId,
  })

  const currentGW = gameweeks?.[0]
  const displayPoints = myTeam?.totalPoints ?? totalPoints

  const handleNav = (label: string, path: string) => {
    if (path === '/app/fantasy/transfers') {
      router.push(path)
      return
    }
    router.push(path)
  }

  return (
    <div className="fixed inset-0 w-full max-w-sm mx-auto bg-[#222232] overflow-hidden flex flex-col font-sans z-0">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-100 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#222232]/30 to-[#222232]/80" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full touch-none">

        {/* Team Name */}
        {teamName && (
          <div
            className="absolute text-center"
            style={{ top: '20px', left: '50%', transform: 'translateX(-50%)' }}
          >
            <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">{teamName}</p>
          </div>
        )}

        {/* Points Card */}
        <div
          className="absolute backdrop-blur-lg border border-white/5 shadow-2xl overflow-hidden flex flex-col items-center py-5"
          style={{
            width: '342px',
            height: '160px',
            top: '59px',
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '24px',
            backgroundColor: 'rgba(34, 34, 50, 0.6)',
            fontFamily: "'Chakra Petch', sans-serif",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />

          <h2 className="text-white text-center text-[16px] font-bold mb-4 uppercase tracking-widest">
            {currentGW ? `${currentGW.name} Points` : 'Season Points'}
          </h2>

          <div className="flex justify-around w-full px-4 relative z-10">
            <div className="flex flex-col items-center">
              <span className="text-white text-[24px] font-bold leading-none mb-1">42.0</span>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest text-center mt-2">Average SC</span>
            </div>
 
            <div className="flex flex-col items-center scale-110">
              <span className="text-[#FF4D00] text-[52px] font-bold leading-none mb-0.5 drop-shadow-[0_0_15px_rgba(255,77,0,0.3)]">
                {displayPoints}
              </span>
              <span className="text-white text-[11px] font-bold uppercase tracking-widest text-center mt-1">Your SC</span>
            </div>
 
            <div className="flex flex-col items-center">
              <span className="text-white text-[24px] font-bold leading-none mb-1">242</span>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest text-center mt-2">Highest SC</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="absolute w-full px-4" style={{ top: '0', left: '0' }}>
          {[
            { label: 'Points', path: '/app/fantasy/points', top: 240 },
            { label: 'Pick Team', path: '/app/fantasy/team', top: 312 },
            { label: 'Transfers', path: '/app/fantasy/transfers', top: 384 },
            { label: 'Chips Store', path: '/app/fantasy/chips', top: 456 },
            { label: 'Switch League', action: 'SWITCH', top: 528 },
          ].map((item) => (
            <button
              key={item.label}
              className="absolute flex items-center bg-[#2b2b40]/70 backdrop-blur-md transition-all hover:bg-[#32324d]/80 active:scale-[0.98] group"
              style={{
                width: '342px',
                height: '56px',
                top: `${item.top}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
              onClick={() => {
                if (item.action === 'SWITCH') {
                  useFantasyStore.getState().setCompetitionId(null)
                  useFantasyStore.getState().resetTeam()
                  router.push('/app/fantasy')
                } else if (item.path) {
                  handleNav(item.label, item.path)
                }
              }}
            >
              <span className="text-white font-bold text-[16px] ml-[20px] uppercase tracking-wide">
                {item.label}
              </span>
              <div
                className="absolute flex items-center justify-center rounded-full border border-white/40 group-hover:border-white transition-all transform group-hover:translate-x-1"
                style={{ width: '24px', height: '24px', top: '16px', right: '20px' }}
              >
                <ChevronRight size={14} strokeWidth={2.5} className="text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FantasyDashboard
