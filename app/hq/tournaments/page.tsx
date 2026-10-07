'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hqService, type HqTournament } from '@/lib/services/hq.service'
import { ActionButton, Pager, Pill, ReasonDialog, TypeNameDialog, errorText } from '@/components/hq/ui'

export default function HqTournamentsPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [hiddenOnly, setHiddenOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [hiding, setHiding] = useState<HqTournament | null>(null)
  const [deleting, setDeleting] = useState<HqTournament | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['hq', 'tournaments', q, status, hiddenOnly, page],
    queryFn: () => hqService.listTournaments({ q: q || undefined, status: status || undefined, hidden: hiddenOnly ? 'true' : undefined, page }),
  })

  const done = (text?: string) => { setHiding(null); setDeleting(null); setError(null); setNote(text ?? null); qc.invalidateQueries({ queryKey: ['hq'] }) }
  const act = useMutation({ mutationFn: (fn: () => Promise<unknown>) => fn(), onSuccess: () => done(), onError: (e) => setError(errorText(e)) })
  const remove = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => hqService.deleteTournament(id, name),
    onSuccess: () => done('Tournament deleted.'),
    onError: (e) => setError(errorText(e)),
  })

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="font-display font-extrabold text-3xl">Tournaments</h1>
      <p className="text-sm font-body text-gaffer-muted">Every tournament across every organisation. Hiding takes one off all public lists and join pages while its organisation can still see it.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <input type="search" aria-label="Search tournaments" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search by name" className="flex-1 min-w-[12rem] rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white" />
        <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white">
          <option value="">Any status</option><option value="draft">Draft</option><option value="published">Published</option><option value="live">Live</option><option value="completed">Completed</option>
        </select>
        <label className="flex items-center gap-2 font-body text-sm"><input type="checkbox" checked={hiddenOnly} onChange={(e) => { setHiddenOnly(e.target.checked); setPage(1) }} /> Hidden only</label>
      </div>

      {note && <p role="status" className="text-sm text-green-300 font-body">{note}</p>}
      {error && !hiding && !deleting && <p role="alert" className="text-sm text-red-400 font-body">{error}</p>}

      {isLoading ? <p className="text-gaffer-muted font-body">Loading…</p>
        : loadError || !data ? <p role="alert" className="text-red-400 font-body">Could not load tournaments.</p>
        : data.tournaments.length === 0 ? <p className="text-gaffer-muted font-body">No tournaments found.</p>
        : (
          <ul className="space-y-2">
            {data.tournaments.map((t) => (
              <li key={t.id} className="rounded-2xl bg-gaffer-card border border-gaffer-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-lg truncate">{t.name}</p>
                    <p className="text-xs text-gaffer-muted font-body">{t.organisation ? `${t.organisation.name} (@${t.organisation.handle})` : 'No organisation'} · {t.playersJoined} {t.playersJoined === 1 ? 'player' : 'players'} joined</p>
                    {t.hidden && t.hiddenReason && <p className="text-xs text-gaffer-muted font-body">Hidden: {t.hiddenReason}</p>}
                  </div>
                  <div className="flex gap-2"><Pill label={t.status} tone="neutral" />{t.hidden && <Pill label="Hidden" tone="bad" />}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.hidden ? <ActionButton tone="good" label="Show again" onClick={() => act.mutate(() => hqService.unhideTournament(t.id))} disabled={act.isPending} /> : <ActionButton label="Hide…" onClick={() => { setError(null); setHiding(t) }} />}
                  <ActionButton tone="bad" label="Delete…" onClick={() => { setError(null); setDeleting(t) }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      {data && <Pager page={page} total={data.total} pageSize={data.pageSize} onPage={setPage} />}

      {hiding && <ReasonDialog title={`Hide ${hiding.name}`} confirmLabel="Hide" required={false} busy={act.isPending} error={error} onCancel={() => { setHiding(null); setError(null) }} onConfirm={(r) => act.mutate(() => hqService.hideTournament(hiding.id, r || undefined))} />}
      {deleting && (
        <TypeNameDialog title="Delete this tournament for good" name={deleting.name} confirmLabel="Delete forever" busy={remove.isPending} error={error}
          warning="This removes the tournament and everything in it: fixtures, results, standings, fantasy teams and stats. It can't be undone. To just take it off the app, hide it instead."
          onCancel={() => { setDeleting(null); setError(null) }} onConfirm={(typed) => remove.mutate({ id: deleting.id, name: typed })} />
      )}
    </div>
  )
}
