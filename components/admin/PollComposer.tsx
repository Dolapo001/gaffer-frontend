'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { publishPoll } from '@/lib/services/feed.service'
import { listFixtures } from '@/lib/services/fixture.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const input = 'w-full bg-[#141523] text-white text-sm font-chakra font-medium px-4 py-3 rounded-xl border border-white/5 outline-none focus:border-[#FF8904]/50 transition-all placeholder:text-white/20'
const label = 'block text-[11px] font-chakra font-bold text-white/50 uppercase tracking-wider mb-1.5'

const CLOSES = [
  { value: '', label: 'Stays open' },
  { value: '24', label: 'Closes in 24 hours' },
  { value: '48', label: 'Closes in 2 days' },
  { value: '168', label: 'Closes in 7 days' },
]

const teamName = (t: any) => (t && typeof t === 'object' ? (t.shortName || t.name || 'Team') : 'Team')

/** Write a poll: a question and 2 to 6 options, or Man of the Match for one of your matches. */
export function PollComposer({ orgId, competitions }: { orgId: string; competitions: { _id: string; name: string }[] }) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [closes, setCloses] = useState('')
  const [motm, setMotm] = useState(false)
  const [compId, setCompId] = useState('')
  const [fixtureId, setFixtureId] = useState('')

  const { data: fixtures } = useQuery({
    queryKey: ['poll-fixtures', compId],
    queryFn: () => listFixtures(compId),
    enabled: motm && !!compId,
  })
  const playedOrLive = (fixtures ?? []).filter((f) => ['completed', 'live', 'halftime'].includes(f.status))

  const publish = useMutation({
    mutationFn: () => publishPoll({
      orgId,
      question: question.trim(),
      options: motm ? [] : options.map((o) => o.trim()).filter(Boolean),
      endsAt: closes ? new Date(Date.now() + Number(closes) * 3_600_000).toISOString() : undefined,
      motm,
      fixtureId: motm ? fixtureId : undefined,
    }),
    onSuccess: () => {
      setQuestion(''); setOptions(['', '']); setCloses(''); setMotm(false); setCompId(''); setFixtureId('')
      qc.invalidateQueries({ queryKey: ['org-feed', orgId] })
      qc.invalidateQueries({ queryKey: ['home-feed'] })
      toast.addToast('Poll published.', 'success')
    },
    onError: (e: unknown) => toast.addToast(getErrorMessage(e), 'error'),
  })

  const filled = options.map((o) => o.trim()).filter(Boolean)
  const ready = question.trim().length >= 3 && (motm ? !!fixtureId : filled.length >= 2)

  return (
    <div className="space-y-4">
      <div className="bg-[#1E2032] border border-white/5 rounded-[24px] p-6 space-y-4 shadow-2xl">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-chakra font-bold text-white/80">
          <input type="checkbox" checked={motm} onChange={(e) => { setMotm(e.target.checked); if (e.target.checked && !question) setQuestion('Who was your Man of the Match?') }} className="w-4 h-4 accent-[#FF8904]" />
          Man of the Match (the options are the players in that match)
        </label>

        <div>
          <label className={label} htmlFor="poll-q">Question</label>
          <input id="poll-q" className={input} value={question} maxLength={300} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Who will win the league?" />
        </div>

        {motm ? (
          <>
            <div>
              <label className={label} htmlFor="poll-comp">Tournament</label>
              <select id="poll-comp" className={input} value={compId} onChange={(e) => { setCompId(e.target.value); setFixtureId('') }}>
                <option value="">Choose a tournament</option>
                {competitions.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="poll-fx">Match</label>
              <select id="poll-fx" className={input} value={fixtureId} onChange={(e) => setFixtureId(e.target.value)} disabled={!compId}>
                <option value="">{compId ? (playedOrLive.length ? 'Choose a match' : 'No played or live matches yet') : 'Choose a tournament first'}</option>
                {playedOrLive.map((f) => (
                  <option key={f._id} value={f._id}>{teamName(f.homeTeamId)} {f.score?.home ?? 0} - {f.score?.away ?? 0} {teamName(f.awayTeamId)}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className={label}>Options (2 to 6)</p>
            {options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input aria-label={`Option ${i + 1}`} className={input} value={o} maxLength={80} placeholder={`Option ${i + 1}`} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} />
                {options.length > 2 && (
                  <button type="button" onClick={() => setOptions(options.filter((_, j) => j !== i))} aria-label={`Remove option ${i + 1}`} className="w-12 shrink-0 rounded-xl border border-white/10 text-white/50 hover:text-white flex items-center justify-center"><X size={16} /></button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button type="button" onClick={() => setOptions([...options, ''])} className="flex items-center gap-1.5 text-xs font-chakra font-black text-[#FF8904]"><Plus size={14} /> Add option</button>
            )}
          </div>
        )}

        <div>
          <label className={label} htmlFor="poll-closes">Closing</label>
          <select id="poll-closes" className={input} value={closes} onChange={(e) => setCloses(e.target.value)}>
            {CLOSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={() => ready && publish.mutate()}
        disabled={!ready || publish.isPending}
        className="w-full py-4 rounded-xl font-chakra font-black text-sm bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {publish.isPending ? 'Publishing...' : 'Publish Poll'}
      </button>
    </div>
  )
}
