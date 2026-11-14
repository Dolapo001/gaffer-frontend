'use client'

import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/dates'

/** Shown instead of the "My Team" numbers when someone hasn't picked a fantasy squad yet. */
export function PickSquadCard({ competitionId, squadSize = 15, deadline }: { competitionId: string; squadSize?: number; deadline?: Date | null }) {
  const router = useRouter()
  // Only mention a deadline that is still ahead
  const upcoming = deadline && deadline.getTime() > Date.now() ? formatDateTime(deadline) : null
  return (
    <button
      onClick={() => router.push(`/app/fantasy/${competitionId}/team`)}
      className="flex w-full items-center gap-4 rounded-2xl bg-[#1B1D25] p-4 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-body text-[17px] font-semibold text-white">Pick your squad</span>
        <span className="mt-1 block font-body text-[13px] leading-snug text-white/55">
          Choose {squadSize} players from this tournament to start scoring points{upcoming ? ` before ${upcoming}` : ''}.
        </span>
      </span>
      <span className="shrink-0 rounded-xl bg-gaffer-orange px-4 py-2.5 font-body text-[14px] font-bold text-white">Start</span>
    </button>
  )
}
