'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { type FantasySquadPlayer } from '@/lib/fantasyMockData'

// ─── Position badge colors ────────────────────────────────────────────────────

const POS_STYLES: Record<string, string> = {
  GK: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DEF: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MID: 'bg-green-500/20 text-green-400 border-green-500/30',
  FWD: 'bg-gaffer-orange/20 text-gaffer-orange border-gaffer-orange/30',
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
    <div className="flex items-center gap-3 bg-gaffer-surface/60 rounded-2xl px-3 py-2.5">
      <TeamCrest code={fixture.homeCode} color="#1D4ED8" size={34} />
      <div className="flex-1 flex flex-col items-center">
        <span className="text-[9px] font-body text-gaffer-muted uppercase tracking-wide">
          SAT 14:00
        </span>
        <span className="text-white font-display font-black text-xl leading-tight">
          {fixture.kickoff.split(' ')[1]}
        </span>
      </div>
      <TeamCrest code={fixture.awayCode} color="#DC2626" size={34} />
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
            <div className="flex items-center gap-3 mb-5">
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-black text-2xl flex-shrink-0 border border-white/10"
                style={{ backgroundColor: player.teamColor + 'CC' }}
              >
                {player.name[0]}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-display font-black text-lg leading-tight">
                  {player.name}
                </p>
                <p className="text-gaffer-muted text-[10px] font-body">
                  #{player.teamCode} • {player.position === 'GK' ? 'Goalkeeper' : player.position === 'DEF' ? 'Defender' : player.position === 'MID' ? 'Midfielder' : 'Forward'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[9px] font-display font-bold px-2 py-0.5 rounded-full border ${POS_STYLES[player.position]}`}
                  >
                    {player.position}
                  </span>
                  <span className="text-gaffer-orange font-display font-bold text-xs">
                    ₦{player.price}m
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-muted flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Form section */}
            <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-sm font-display font-bold">Form</span>
                <span className="text-gaffer-muted text-xs font-body">Points</span>
              </div>

              <div className="space-y-2.5">
                {player.gwHistory.map(({ gw, pts, opponent, result }) => (
                  <div key={gw} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gaffer-muted text-[11px] font-display font-bold w-14">
                        GW-{gw} vs
                      </span>
                      <span className="text-white/80 text-[11px] font-body">
                        {opponent}
                      </span>
                      {/* Result dot */}
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          result === 'W'
                            ? 'bg-green-400'
                            : result === 'D'
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        }`}
                      />
                    </div>
                    <span className="text-white font-display font-bold text-sm">
                      {pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Match section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-display font-bold">
                  Next Match
                </span>
                <span className="text-gaffer-orange text-[10px] font-display font-bold bg-gaffer-orange/10 border border-gaffer-orange/20 rounded-full px-2 py-0.5">
                  Gameweek {player.nextFixtures[0]?.gameweek ?? 4}
                </span>
              </div>

              <div className="space-y-2">
                {player.nextFixtures.slice(0, 2).map((fixture, i) => (
                  <FixtureRow key={i} fixture={fixture} />
                ))}
              </div>
            </div>

            {/* Captain action buttons */}
            <div className="flex justify-center gap-4 mt-5">
              {['C', 'C', 'C'].map((label, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.9 }}
                  className="w-11 h-11 rounded-full bg-green-700 text-white font-display font-black text-sm shadow-md border border-green-600/50"
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
