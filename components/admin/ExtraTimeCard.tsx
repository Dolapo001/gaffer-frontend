'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { endMatch } from '@/lib/services/fixture.service'
import { useToast } from '@/store/toastStore'

/**
 * Shown while a level knockout match is in extra time. Record goals and cards as usual (minutes 91 and up).
 * When extra time is over, End extra time: the match then ends, or goes to penalties if it is still level.
 * There is no clock, so the admin says when it ended (optional; it sets the full-time minute for fantasy minutes played).
 */
export function ExtraTimeCard({ fixtureId, onDone }: { fixtureId: string; onDone: () => void }) {
  const { addToast } = useToast()
  const [minute, setMinute] = useState('')

  const end = useMutation({
    mutationFn: () => endMatch(fixtureId, minute ? Number(minute) : undefined),
    onSuccess: (fixture) => {
      addToast(fixture.isFinalized ? 'Match ended' : 'Extra time over. Still level: penalties next.', 'success')
      onDone()
    },
    onError: (err: any) => addToast(err?.message || 'Could not end extra time', 'error'),
  })

  return (
    <section aria-label="Extra time" className="mt-4 rounded-2xl bg-[#1E2032] border border-orange-500/30 p-5 space-y-4">
      <div>
        <p className="text-orange-400 text-[11px] font-bold uppercase tracking-widest">Extra time</p>
        <p className="text-white text-sm mt-1">The match was level, so it is in extra time. Record goals and cards as normal. They count.</p>
      </div>
      <label className="block text-xs text-white/50">
        Minute extra time ended (optional)
        <input
          inputMode="numeric"
          value={minute}
          onChange={(e) => setMinute(e.target.value.replace(/\D/g, '').slice(0, 3))}
          placeholder="e.g. 120"
          className="mt-1 w-full h-12 bg-[#181928] border border-white/10 rounded-xl px-4 text-white text-sm"
        />
      </label>
      <button
        onClick={() => end.mutate()}
        disabled={end.isPending}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white font-bold disabled:opacity-60"
      >
        {end.isPending ? 'Ending…' : 'End extra time'}
      </button>
    </section>
  )
}
