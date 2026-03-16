'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { type FantasySquadPlayer } from '@/lib/fantasyMockData'

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
  color,
  size = 36,
}: {
  code: string
  color: string
  size?: number
}) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-display font-black text-white border border-white/20 flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color + 'CC' }}
    >
      <span style={{ fontSize: size * 0.28 }}>{code.slice(0, 3)}</span>
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
    <div className="flex items-center gap-4 bg-[#1e2130] rounded-2xl px-4 py-3 border border-white/5 shadow-sm">
      <div className="flex flex-col items-center gap-1 w-16">
        <TeamCrest code={fixture.homeCode} color="#1D4ED8" size={38} />
        <span className="text-white text-[10px] font-bold truncate w-full text-center">Engineering</span>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">
          SAT 14:00
        </span>
        <div className="bg-[#2a2d3e] rounded-lg px-3 py-1.5 flex items-center justify-center">
          <span className="text-white font-bold text-lg leading-none tracking-tight">
            14:00
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 w-16">
        <TeamCrest code={fixture.awayCode} color="#DC2626" size={38} />
        <span className="text-white text-[10px] font-bold truncate w-full text-center">Law</span>
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

          {/* Drawer */}
          <motion.div
            key="drawer-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-gaffer-surface border-t border-gaffer-border rounded-t-3xl px-4 pt-4 pb-10 max-w-sm mx-auto"
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-gaffer-border mx-auto mb-4" />

            {/* Player header */}
            <div className="flex items-center gap-4 mb-8">
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-[85px] h-[85px] rounded-full overflow-hidden flex items-center justify-center bg-[#25283c] border-[3px] border-white/10"
                >
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-4xl font-bold">{player.name[0]}</span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-[32px] leading-tight tracking-tight">
                  {player.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#a1a1aa] text-[15px] font-medium">#{player.price}M</span>
                  <span className="text-[#a1a1aa] text-[15px]">•</span>
                  <span className="text-[#a1a1aa] text-[15px] font-medium">{player.position === 'GK' ? 'Goalkeeper' : player.position === 'DEF' ? 'Defender' : player.position === 'MID' ? 'Midfielder' : 'Forward'}</span>
                </div>
              </div>
            </div>

            {/* Form section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white text-2xl font-bold">Form</span>
                <span className="text-white text-2xl font-bold px-2">Points</span>
              </div>

              <div className="space-y-4">
                {player.gwHistory.map(({ gw, pts, opponent, result }) => (
                  <div key={gw} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-white text-[20px] font-medium tracking-tight">
                        GW-{gw}  vs Engineering
                      </span>
                      {/* Result dot */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white/90 ${
                          result === 'W'
                            ? 'bg-[#16A34A]'
                            : result === 'D'
                            ? 'bg-[#71717a]'
                            : 'bg-[#ef4444]'
                        }`}
                      >
                        {result.toLowerCase()}
                      </div>
                    </div>
                    <span className="text-white font-bold text-[20px]">
                      {pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Match section */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <span className="text-white text-2xl font-extrabold tracking-tight">
                  Next Match
                </span>
                <span className="text-[#fca311] text-[16px] font-bold tracking-tight">
                  Gameweek {player.nextFixtures[0]?.gameweek ?? 4}
                </span>
              </div>

              <div className="space-y-4">
                {player.nextFixtures.slice(0, 2).map((fixture, i) => (
                  <FixtureRow key={i} fixture={fixture} />
                ))}
              </div>
            </div>

            {/* Captain action buttons */}
            <div className="flex justify-between items-start gap-4 mt-auto mb-2">
              {[
                { label: 'Make Captain', icon: <span className="font-bold text-3xl text-white">C</span> },
                { label: 'Sub Out', icon: <span className="font-bold text-3xl text-white">C</span> },
                { label: 'Transfer', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white stroke-[2.5]"><path d="M17 1L21 5L17 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11V9C3 7.93913 3.42143 6.92172 4.17157 6.17157C4.92172 5.42143 5.93913 5 7 5H21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 23L3 19L7 15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 13V15C21 16.0609 20.5786 17.0783 19.8284 17.8284C19.0783 18.5786 18.0609 19 17 19H3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg> }
              ].map((action, i) => (
                <div key={i} className="flex flex-col items-center gap-3 flex-1">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    className="w-[90px] h-[90px] rounded-full bg-[#0d3b24] text-white flex items-center justify-center shadow-lg border border-white/5 active:bg-[#114b30] transition-colors"
                  >
                    {action.icon}
                  </motion.button>
                  <span className="text-white text-[14px] font-bold tracking-tight text-center leading-tight">
                    {action.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
