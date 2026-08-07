'use client'

import { Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listChips } from '@/lib/services/chip.service'
import { useFantasyStore } from '@/store/fantasyStore'

const CHIP_LABELS: Record<string, string> = {
  wildcard: 'Wildcard',
  triple_captain: 'Triple Captain',
  bench_boost: 'Bench Boost',
  free_hit: 'Free Hit',
}

interface ActiveChipBannerProps {
  competitionId: string
  selectedGameweekId: string | null
  onOpen: () => void
}

export function ActiveChipBanner({ competitionId, selectedGameweekId, onOpen }: ActiveChipBannerProps) {
  const { data: chipsData } = useQuery({
    queryKey: ['chips', competitionId],
    queryFn: () => listChips(competitionId),
    enabled: !!competitionId,
  })

  const activeUsage = chipsData?.activeUsages?.find(
    (u) => u.gameweekId === selectedGameweekId
  )

  if (!activeUsage) return null

  const chipName = CHIP_LABELS[activeUsage.chipType] ?? activeUsage.chipType

  return (
    <button
      onClick={onOpen}
      className="w-full bg-orange-gradient-btn rounded-2xl shadow-orange-glow px-4 py-3 flex items-center gap-3 text-left transition-all hover:scale-[1.01]"
    >
      <Zap size={18} className="text-white flex-shrink-0" />
      <span className="text-white font-display font-black uppercase tracking-wide text-sm">
        {chipName} active this round
      </span>
    </button>
  )
}
