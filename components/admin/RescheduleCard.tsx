'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateFixture, type Fixture } from '@/lib/services/fixture.service'
import { useToast } from '@/store/toastStore'

const pad = (n: number) => String(n).padStart(2, '0')
const dateOf = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
const timeOf = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

/**
 * Change when and where a match that has not started is played. Any time is allowed. If another match is close,
 * you get a heads-up after saving, never a block.
 */
export function RescheduleCard({ fixture, onSaved }: { fixture: Fixture; onSaved: () => void }) {
  const { addToast } = useToast()
  const [date, setDate] = useState(() => dateOf(fixture.kickoffAt))
  const [time, setTime] = useState(() => timeOf(fixture.kickoffAt))
  const [venue, setVenue] = useState(fixture.venue ?? '')

  const original = `${dateOf(fixture.kickoffAt)}|${timeOf(fixture.kickoffAt)}|${fixture.venue ?? ''}`
  const dirty = `${date}|${time}|${venue}` !== original

  const save = useMutation({
    mutationFn: () => updateFixture(fixture._id, { kickoffAt: new Date(`${date}T${time}`).toISOString(), venue: venue.trim() || undefined }),
    onSuccess: (updated) => {
      addToast('Match time and venue saved', 'success')
      const warnings = updated.schedulingWarnings ?? []
      if (warnings.length) addToast({ message: `Heads-up: ${warnings.join(' ')}`, type: 'warning', duration: 7000 })
      onSaved()
    },
    onError: (err: any) => addToast(err?.message || 'Could not save the new time', 'error'),
  })

  return (
    <section aria-label="When and where" className="rounded-2xl bg-[#1E2032] border border-white/5 p-5 space-y-4">
      <p className="text-[13px] text-white/50 font-medium uppercase tracking-wider">When and where</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-white/50">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full h-12 bg-[#181928] border border-white/10 rounded-xl px-3 text-white text-sm" />
        </label>
        <label className="text-xs text-white/50">
          Kick-off
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full h-12 bg-[#181928] border border-white/10 rounded-xl px-3 text-white text-sm" />
        </label>
      </div>
      <label className="block text-xs text-white/50">
        Venue (optional)
        <input value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={200} placeholder="e.g. Pitch 2" className="mt-1 w-full h-12 bg-[#181928] border border-white/10 rounded-xl px-3 text-white text-sm" />
      </label>
      <button
        onClick={() => save.mutate()}
        disabled={!dirty || !date || !time || save.isPending}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white font-bold disabled:opacity-40"
      >
        {save.isPending ? 'Saving…' : 'Save time and venue'}
      </button>
    </section>
  )
}
