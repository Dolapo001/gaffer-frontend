'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, Copy } from 'lucide-react'
import type { Team, Group } from '../types'

interface Props {
  selectedTeam: Team | null
  selectedGroup: Group | null
  logoPreview: string | null
  onBack: () => void
}

export function OrganiseShare({ selectedTeam, selectedGroup, logoPreview, onBack }: Props) {
  const name = selectedTeam?.name || selectedGroup?.name || ''
  const slug = name.toLowerCase().replace(/\s+/g, '-') || 'team'
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://gaffer.app'}/league/${slug}`

  return (
    <motion.div
      key="share"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-[#181928] flex flex-col items-center pt-12 px-4 md:px-6 pb-32 text-center flex-1"
    >
      <button
        onClick={onBack}
        className="absolute left-6 top-[52px] w-6 h-6 rounded-full border border-white flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors"
        style={{ pointerEvents: 'auto' }}
      >
        <ChevronLeft size={14} strokeWidth={2.5} />
      </button>

      <h2 className="text-[17px] font-bold tracking-[0.05em] mb-10 mt-1">{name}</h2>

      <div className="w-[60px] h-[60px] shrink-0 rounded-full overflow-hidden bg-black/20 mb-8 border border-white/5 shadow-xl">
        <img
          src={selectedTeam?.logo || logoPreview || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'}
          className="w-full h-full object-cover"
          alt=""
        />
      </div>

      <h1 className="text-[32px] font-bold tracking-[0.05em] uppercase mb-4">{name}</h1>

      <p className="text-[#E2E8F0] text-[13.5px] leading-[1.6] max-w-[280px] mb-8">
        Copy the Link and Share the link with players to capture player data.
      </p>

      <div className="w-full max-w-[340px] bg-[#1C2130] rounded-[16px] p-4 flex items-center justify-between border border-[#2C3140]">
        <span className="text-[13px] text-white/80 truncate pr-4 text-left">{shareUrl}</span>
        <button
          aria-label="Copy link"
          onClick={() => navigator.clipboard.writeText(shareUrl)}
          className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <Copy size={18} className="text-white" />
        </button>
      </div>
    </motion.div>
  )
}
