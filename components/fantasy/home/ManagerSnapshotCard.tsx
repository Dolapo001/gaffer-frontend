'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface ManagerSnapshotCardProps {
  competitionId: string
  teamName: string
  totalPoints: number
  rank: number | null
}

export function ManagerSnapshotCard({ competitionId, teamName, totalPoints, rank }: ManagerSnapshotCardProps) {
  const router = useRouter()

  return (
    <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-5">
      <p className="text-gaffer-muted text-[10px] font-black uppercase tracking-widest mb-1">{teamName || 'Your team'}</p>
      <div className="flex items-center justify-around py-3">
        <div className="flex flex-col items-center">
          <span className="text-white text-3xl font-display font-black leading-none">{totalPoints}</span>
          <span className="text-gaffer-muted text-[10px] font-bold uppercase tracking-widest mt-2">Points</span>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="flex flex-col items-center">
          <span className="text-white text-3xl font-display font-black leading-none">{rank ? `#${rank}` : '—'}</span>
          <span className="text-gaffer-muted text-[10px] font-bold uppercase tracking-widest mt-2">Rank</span>
        </div>
      </div>
      <button
        onClick={() => router.push(`/app/fantasy/${competitionId}/team`)}
        className="w-full mt-2 bg-orange-gradient-btn text-white py-3.5 rounded-xl font-display font-black uppercase tracking-widest text-sm shadow-orange-glow flex items-center justify-center gap-2"
      >
        Manage Team
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
