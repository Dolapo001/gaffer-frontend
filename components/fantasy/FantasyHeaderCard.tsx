'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronRightCircle } from 'lucide-react'

interface FantasyHeaderCardProps {
  teamName?: string
  gameweekCurrent?: number
  gameweekTotal?: number
  totalPoints?: number
  globalRank?: number | null
  teamValue?: number | null
  activeGameweekLabel?: string
  activeGameweekPoints?: number | string
  activePlayers?: number
  totalPlayers?: number
  highestScore?: number | null
  deadline?: string | null
  onPrevGameweek?: () => void
  onNextGameweek?: () => void
  onPointsClick?: () => void
  onHighestClick?: () => void
}

// No demo defaults: a missing value shows "-" rather than a made-up number
export const FantasyHeaderCard = ({
  teamName,
  gameweekCurrent,
  gameweekTotal,
  totalPoints,
  globalRank = null,
  teamValue = null,
  activeGameweekLabel,
  activeGameweekPoints = '-',
  activePlayers,
  totalPlayers,
  highestScore = null,
  deadline = null,
  onPrevGameweek,
  onNextGameweek,
  onPointsClick,
  onHighestClick,
}: FantasyHeaderCardProps) => {
  const rankDisplay = globalRank != null ? `#${globalRank}` : '-'
  const valueDisplay = teamValue != null ? `£${teamValue.toFixed(1)}M` : '-'
  const highestDisplay = highestScore != null ? highestScore : '-'
  const gameweekDisplay = gameweekCurrent != null && gameweekTotal ? `${gameweekCurrent}/${gameweekTotal}` : '-'
  const playersDisplay = activePlayers != null && totalPlayers ? `${activePlayers}/${totalPlayers}` : '-'

  return (
    <div className="w-full max-w-[380px] mx-auto flex flex-col gap-4 font-chakra">

      {/* ========================================= */}
      {/* CARD 1: TEAM INFO                         */}
      {/* ========================================= */}
      <div className="w-full rounded-[24px] bg-[#242539]/40 backdrop-blur-xl border border-white/20 p-[20px_25px] shadow-lg flex flex-col items-center gap-[15px]">

        <b className="text-white text-[15px] uppercase tracking-wide drop-shadow-md">
          {teamName || '-'}
        </b>

        <div className="w-full grid grid-cols-2 gap-[15px]">
          {/* Gameweek */}
          <div className="rounded-[10px] bg-[#2C355A]/50 backdrop-blur-md h-[42px] flex flex-col items-center justify-center gap-1 shadow-inner">
            <div className="text-[#94a3b8] text-[8px] font-light uppercase tracking-wide">GAMEWEEK</div>
            <div className="text-white text-[12px] font-medium leading-none">{gameweekDisplay}</div>
          </div>

          {/* Total Pts */}
          <div className="rounded-[10px] bg-[#2C355A]/50 backdrop-blur-md h-[42px] flex flex-col items-center justify-center gap-1 shadow-inner">
            <div className="text-[#94a3b8] text-[8px] font-light uppercase tracking-wide">TOTAL PTS</div>
            <div className="text-white text-[12px] font-medium leading-none">{totalPoints ?? '-'}</div>
          </div>

          {/* Global Ranking */}
          <div className="rounded-[10px] bg-[#2C355A]/50 backdrop-blur-md h-[42px] flex flex-col items-center justify-center gap-1 shadow-inner">
            <div className="text-[#94a3b8] text-[8px] font-light uppercase tracking-wide">GLOBAL RANKING</div>
            <div className="text-white text-[12px] font-medium leading-none">{rankDisplay}</div>
          </div>

          {/* Team Value */}
          <div className="rounded-[10px] bg-[#2C355A]/50 backdrop-blur-md h-[42px] flex flex-col items-center justify-center gap-1 shadow-inner">
            <div className="text-[#94a3b8] text-[8px] font-light uppercase tracking-wide">TEAM VALUE</div>
            <div className="text-white text-[12px] font-medium leading-none">{valueDisplay}</div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* CARD 2: SCORES & DEADLINE                 */}
      {/* ========================================= */}
      <div className="w-full rounded-[24px] bg-[#242539]/40 backdrop-blur-xl border border-white/5 p-[25px_20px] shadow-lg flex flex-col items-center gap-[24px]">

        {/* Gameweek Slider */}
        <div className="flex justify-between items-center w-full px-2">
          <button
            onClick={onPrevGameweek}
            className="text-white/50 hover:text-white transition"
            aria-label="Previous gameweek"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <b className="text-white text-[16px] uppercase tracking-[1px] drop-shadow-sm">{activeGameweekLabel || '-'}</b>
          <button
            onClick={onNextGameweek}
            className="text-white/50 hover:text-white transition"
            aria-label="Next gameweek"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* The 3-Column Score Layout */}
        <div className="flex justify-between items-center w-full">

          {/* Left: Players */}
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="text-white text-[28px] font-medium leading-none drop-shadow-md">{playersDisplay}</div>
            <div className="text-white/70 text-[10px] uppercase tracking-wider mt-[8px]">PLAYERS</div>
          </div>

          {/* Center: Giant Points */}
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="text-[#e25f05] text-[72px] font-bold leading-[0.8] tracking-tighter drop-shadow-[0_4px_16px_rgba(226,95,5,0.3)]">
              {activeGameweekPoints}
            </div>
            <button
              onClick={onPointsClick}
              className="flex items-center gap-[4px] mt-[16px] cursor-pointer hover:opacity-80 transition group"
            >
              <span className="text-white text-[14px] font-bold uppercase tracking-widest">POINTS</span>
              <ChevronRightCircle size={14} className="text-white group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right: Highest */}
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="text-white text-[28px] font-medium leading-none drop-shadow-md">{highestDisplay}</div>
            <button
              onClick={onHighestClick}
              className="flex items-center gap-[4px] mt-[8px] cursor-pointer hover:opacity-80 transition group"
            >
              <span className="text-white/70 text-[10px] uppercase tracking-wider">HIGHEST</span>
              <ChevronRightCircle size={10} className="text-white/70 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* Deadline Footer */}
        {deadline ? (
          <div className="flex items-center justify-center gap-2 text-white/40 text-[9px] font-medium uppercase tracking-[0.15em] mt-2">
            <span>DEADLINE .</span>
            <span>{deadline}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-white/40 text-[9px] font-medium uppercase tracking-[0.15em] mt-2">
            <span>NO UPCOMING DEADLINE</span>
          </div>
        )}

      </div>

    </div>
  )
}