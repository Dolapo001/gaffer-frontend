'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CornerUpLeft, ArrowRightLeft } from 'lucide-react'
import { type FantasySquadPlayer } from '@/lib/fantasyMockData'
import { useFantasyStore } from '@/store/fantasyStore'

// ─── Position badge colors ────────────────────────────────────────────────────

const POS_STYLES: Record<string, string> = {
  GK: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  DEF: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  MID: 'bg-green-500/10 text-green-500 border-green-500/20',
  FWD: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
}

// ─── Team crest placeholder ───────────────────────────────────────────────────

function TeamCrest({
  code,
  size = 36,
}: {
  code: string
  size?: number
}) {
  let logoUrl = '';
  switch (code) {
    case 'ENG': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/120px-Manchester_City_FC_badge.svg.png'; break;
    case 'LAW': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/120px-FC_Barcelona_%28crest%29.svg.png'; break;
    case 'MED': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/120px-Liverpool_FC.svg.png'; break;
    case 'SCI': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/120px-Chelsea_FC.svg.png'; break;
    case 'BUS': logoUrl = 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Tottenham_Hotspur.svg/120px-Tottenham_Hotspur.svg.png'; break;
  }

  return (
    <div
      className="rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-white shadow-sm p-0.5"
      style={{ width: size, height: size }}
    >
      {logoUrl ? (
         <img src={logoUrl} alt={code} className="w-[85%] h-[85%] object-contain mt-0.5 mx-auto" />
      ) : (
         <span style={{ fontSize: size * 0.28, color: '#000' }} className="font-bold">{code}</span>
      )}
    </div>
  )
}

// ─── Fixture row ──────────────────────────────────────────────────────────────

function FixtureRow({
  fixture,
}: {
  fixture: FantasySquadPlayer['nextFixtures'][number]
}) {
  return (
    <div className="flex items-center gap-4 bg-[#1e2130] rounded-[16px] px-5 py-3 shadow-md">
      <div className="flex flex-col items-center gap-1.5 w-[60px]">
        <TeamCrest code={fixture.homeCode} size={36} />
        <span className="text-white text-[10px] font-bold truncate w-full text-center tracking-wide">{fixture.homeTeam}</span>
      </div>
      <div className="flex-1 flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">
          {fixture.kickoff || 'SAT 14:00'}
        </span>
        <div className="bg-[#2a2d3e] rounded-lg px-3 py-1 flex items-center justify-center mt-1">
          <span className="text-white font-bold text-xs tracking-widest font-mono">
            {fixture.kickoff?.split(' ')[1] || '14:00'}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 w-[60px]">
        <TeamCrest code={fixture.awayCode} size={36} />
        <span className="text-white text-[10px] font-bold truncate w-full text-center tracking-wide">{fixture.awayTeam}</span>
      </div>
    </div>
  )
}

// ─── PlayerDetailDrawer ───────────────────────────────────────────────────────

interface PlayerDetailDrawerProps {
  player: FantasySquadPlayer | null
  onClose: () => void
}

export function PlayerDetailDrawer({ player, onClose }: PlayerDetailDrawerProps) {
  useEffect(() => {
    const navWrap = document.getElementById('global-nav-bar')
    const navInner = navWrap?.querySelector('nav')
    
    if (player && navWrap && navInner) {
      navWrap.style.opacity = '0'
      navInner.style.pointerEvents = 'none'
    } else if (navWrap && navInner) {
      navWrap.style.opacity = '1'
      navInner.style.pointerEvents = 'auto'
    }
    
    return () => {
      if (navWrap && navInner) {
        navWrap.style.opacity = '1'
        navInner.style.pointerEvents = 'auto'
      }
    }
  }, [player])

  return (
    <AnimatePresence>
      {player && (
        <motion.div
          key="drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              key="drawer-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full flex flex-col bg-[#2b2d3c] border-t border-white/5 rounded-t-[2.5rem] max-w-sm mx-auto shadow-2xl z-50 mt-auto"
            >
              {/* Handle Area */}
              <div className="w-full flex-shrink-0 pt-2 pb-2 flex justify-center z-10">
                <div className="w-12 h-1.5 rounded-full bg-gray-500/30" />
              </div>

              {/* Main Content */}
              <div className="px-6 pb-6 pt-2">
                {/* Player header */}
                <div className="flex items-center gap-5 mb-6">
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-[82px] h-[82px] rounded-full overflow-hidden flex items-center justify-center bg-[#25283c] border-[3px] border-white/10 shadow-xl"
                >
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} 
                      alt={player.name} 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="text-white font-bold text-[24px] leading-tight tracking-tight">
                  {player.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#a1a1aa] text-[13px] font-medium tracking-wide">#{player.price}M</span>
                  <span className="text-[#a1a1aa] text-[13px]">•</span>
                  <span className="text-[#a1a1aa] text-[13px] font-medium tracking-wide">
                    {player.position === 'GK' ? 'Goalkeeper' : player.position === 'DEF' ? 'Defender' : player.position === 'MID' ? 'Midfielder' : 'Forward'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium tracking-wide">Form</span>
                <span className="text-white text-sm font-medium tracking-wide pl-2">Points</span>
              </div>

              <div className="space-y-2.5">
                {player.gwHistory.map(({ gw, pts, opponent, result }) => (
                  <div key={gw} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-[13px] font-normal tracking-wide">
                        GW-{gw}
                      </span>
                      <span className="text-white text-[13px] font-normal tracking-wide w-4">
                        vs
                      </span>
                      <span className="text-white text-[13px] font-normal tracking-wide">
                        {opponent}
                      </span>
                      {/* Result dot */}
                      <div
                        className={`w-3.5 h-3.5 ml-1 rounded-full flex items-center justify-center text-[7px] font-bold text-white shadow-sm ${
                          result === 'W'
                            ? 'bg-[#16A34A]'
                            : result === 'D'
                            ? 'bg-[#71717a]'
                            : 'bg-[#ef4444]'
                        }`}
                      >
                        {result.toUpperCase()}
                      </div>
                    </div>
                    <span className="text-white font-bold text-[14px]">
                      {pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Match section */}
            <div className="mb-4 mt-4 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-[13px] font-bold tracking-wide">
                  Next Match
                </span>
                <span className="text-[#e95a0c] text-[11px] font-medium tracking-wide">
                  Gameweek {player.nextFixtures[0]?.gameweek ?? 4}
                </span>
              </div>

              <div className="space-y-3">
                {player.nextFixtures.slice(0, 2).map((fixture, i) => (
                  <FixtureRow key={i} fixture={fixture} />
                ))}
              </div>
            </div>

            {/* Captain action buttons */}
            <div className="flex justify-around items-center pt-2 mb-2">
              {[
                { label: 'Make Captain', icon: <span className="font-bold text-[32px] text-white">C</span>, onClick: () => {} },
                { 
                  label: player.isOnPitch ? 'Sub Out' : 'Sub In', 
                  icon: <CornerUpLeft size={34} className={player.isOnPitch ? "text-white" : "text-white"} strokeWidth={2.5} />, 
                  onClick: () => {
                    useFantasyStore.getState().setSubstitutingOutId(player.id)
                    onClose()
                    window.location.href = '/app/fantasy/substitution'
                  }
                },
                { 
                  label: 'Transfer', 
                  icon: (
                    <div className="flex flex-col items-center justify-center">
                       <ArrowRightLeft size={30} className="text-white" strokeWidth={2.5} />
                    </div>
                  ), 
                  onClick: () => {} 
                }
              ].map((action, i) => (
                <div key={i} className="flex flex-col items-center gap-3 w-24">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={action.onClick}
                    className="w-[82px] h-[82px] rounded-full bg-[#0d4a25] text-white flex items-center justify-center shadow-2xl active:bg-[#0a3a1d] transition-colors border-2 border-white/5"
                  >
                    {action.icon}
                  </motion.button>
                  <span className="text-white text-[13px] font-bold tracking-tight text-center leading-tight">
                    {action.label}
                  </span>
                </div>
              ))}
            </div>
            
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
