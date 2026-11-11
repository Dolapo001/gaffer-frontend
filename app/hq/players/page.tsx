'use client'

import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hqService, type HqDupPlayer, type HqDuplicatePair } from '@/lib/services/hq.service'
import { ActionButton, Pill, errorText } from '@/components/hq/ui'
import { getImageUrl } from '@/lib/api'

const REASON: Record<string, string> = { email: 'Same email', phone: 'Same phone number', name: 'Same name' }

function PlayerCard({ p, chosen, onChoose, disabled }: { p: HqDupPlayer; chosen: boolean; onChoose: () => void; disabled: boolean }) {
  return (
    <label className={`flex-1 min-w-0 rounded-2xl border p-3 space-y-2 cursor-pointer ${chosen ? 'border-gaffer-orange bg-gaffer-orange/10' : 'border-gaffer-border bg-gaffer-bg'} ${disabled ? 'cursor-default' : ''}`}>
      <div className="flex items-center gap-3">
        <input type="radio" className="accent-[#FF6B00]" checked={chosen} onChange={onChoose} disabled={disabled} aria-label={`Keep ${p.name}`} />
        <div className="w-10 h-10 rounded-full bg-gaffer-card overflow-hidden flex items-center justify-center font-display font-bold shrink-0">
          {p.photoUrl ? <img src={getImageUrl(p.photoUrl)} alt="" className="w-full h-full object-cover" /> : p.name[0]}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold truncate">{p.name}</p>
          <p className="text-xs text-gaffer-muted font-body truncate">{[p.nickname && `“${p.nickname}”`, p.position].filter(Boolean).join(' · ') || 'No nickname'}</p>
        </div>
      </div>
      <ul className="text-xs font-body text-gaffer-muted space-y-0.5">
        {p.teams.length ? p.teams.map((t, i) => <li key={i}><span className="text-white">{t.team}</span>{t.tournament ? ` in ${t.tournament}` : ''}</li>) : <li>No team</li>}
      </ul>
      <p className="text-xs font-body text-gaffer-muted">{p.matches} matches · {p.goals} goals · {p.hasAccount ? 'linked to an account' : 'no account linked'}</p>
      <p className="text-xs font-body text-gaffer-muted truncate">{[p.email, p.phone].filter(Boolean).join(' · ') || 'No email or phone'}</p>
    </label>
  )
}

function Pair({ pair }: { pair: HqDuplicatePair }) {
  const qc = useQueryClient()
  // Keep the record with more history by default
  const [keep, setKeep] = useState<'a' | 'b'>(pair.a.matches + pair.a.teams.length >= pair.b.matches + pair.b.teams.length ? 'a' : 'b')
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const kept = keep === 'a' ? pair.a : pair.b
  const label = (p: HqDupPlayer) => (p.teams[0] ? `${p.name} (${p.teams[0].team})` : `${p.name} (no team)`)
  const other = keep === 'a' ? pair.b : pair.a
  const refresh = () => qc.invalidateQueries({ queryKey: ['hq', 'players'] })
  const merge = useMutation({
    mutationFn: () => hqService.mergePlayers(kept.id, other.id, pair.reasons),
    onSuccess: () => { setConfirm(false); refresh() },
    onError: (e) => setError(errorText(e)),
  })
  const dismiss = useMutation({ mutationFn: () => hqService.dismissDuplicate(pair.a.id, pair.b.id), onSuccess: refresh, onError: (e) => setError(errorText(e)) })

  return (
    <li className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {pair.reasons.map((r) => <Pill key={r} label={REASON[r] ?? r} tone={r === 'name' ? 'neutral' : 'warn'} />)}
        {pair.strength === 'name only' && <span className="text-xs text-gaffer-muted font-body">Only the name matches: check the teams and photos before merging.</span>}
      </div>
      <div className="flex flex-col md:flex-row gap-3">
        <PlayerCard p={pair.a} chosen={keep === 'a'} onChoose={() => setKeep('a')} disabled={!pair.canMerge} />
        <PlayerCard p={pair.b} chosen={keep === 'b'} onChoose={() => setKeep('b')} disabled={!pair.canMerge} />
      </div>
      {!pair.canMerge ? (
        <p className="text-sm font-body text-yellow-300">Both are in {pair.sharedTournaments.join(', ')}, so they can't be merged. If it's the same person, the organiser should remove the extra one from the squad.</p>
      ) : confirm ? (
        <div className="rounded-xl border border-gaffer-orange/40 bg-gaffer-orange/10 p-3 space-y-2">
          <p className="text-sm font-body">Merge <b>{label(other)}</b> into <b>{label(kept)}</b>? Their teams, matches, stats, Fantasy and followers move to the kept record. You can undo this for 30 days.</p>
          <div className="flex gap-2">
            <ActionButton tone="good" label={merge.isPending ? 'Merging…' : 'Merge'} onClick={() => merge.mutate()} disabled={merge.isPending} />
            <ActionButton label="Cancel" onClick={() => setConfirm(false)} />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-body text-gaffer-muted mr-auto">Keep <span className="text-white font-semibold">{kept.name}</span> and merge the other into it.</p>
          <ActionButton tone="good" label="Merge…" onClick={() => { setError(null); setConfirm(true) }} />
          <ActionButton label="Not the same person" onClick={() => dismiss.mutate()} disabled={dismiss.isPending} />
        </div>
      )}
      {!pair.canMerge && <div><ActionButton label="Not the same person" onClick={() => dismiss.mutate()} disabled={dismiss.isPending} /></div>}
      {error && <p role="alert" className="text-sm text-red-400 font-body">{error}</p>}
    </li>
  )
}

export default function HqPlayersPage() {
  const qc = useQueryClient()
  const dups = useInfiniteQuery({
    queryKey: ['hq', 'players', 'duplicates'],
    queryFn: ({ pageParam }) => hqService.duplicatePlayers(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
  })
  const pairs = dups.data?.pages.flatMap((p) => p.pairs) ?? []
  const total = dups.data?.pages[0]?.total ?? 0
  const merges = useQuery({ queryKey: ['hq', 'players', 'merges'], queryFn: () => hqService.playerMerges() })
  const [note, setNote] = useState<string | null>(null)
  const undo = useMutation({
    mutationFn: (id: string) => hqService.undoPlayerMerge(id),
    onSuccess: (r) => { setNote(r.message); qc.invalidateQueries({ queryKey: ['hq', 'players'] }) },
    onError: (e) => setNote(errorText(e)),
  })

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display font-bold text-3xl">Players</h1>
        <p className="text-sm font-body text-gaffer-muted mt-1">Players who signed up again for another tournament show up twice. Merge them so search and their profile show one player with all their tournaments.</p>
      </div>

      <section className="space-y-3" aria-label="Possible duplicates">
        <h2 className="font-display font-bold text-xl">Possible duplicates</h2>
        {dups.isLoading ? <p className="text-gaffer-muted font-body">Looking…</p>
          : dups.isError ? <p role="alert" className="text-red-400 font-body">{errorText(dups.error)}</p>
          : pairs.length === 0 ? <p className="text-gaffer-muted font-body">No duplicates found. New sign-ups with the same email or phone are joined automatically.</p>
          : (
            <>
              <p className="text-sm font-body text-gaffer-muted">{total} possible {total === 1 ? 'pair' : 'pairs'}. Same email or phone first, then same name only.</p>
              <ul className="space-y-3">{pairs.map((p) => <Pair key={`${p.a.id}:${p.b.id}`} pair={p} />)}</ul>
              {dups.hasNextPage && <ActionButton label={dups.isFetchingNextPage ? 'Loading…' : `Show more (${total - pairs.length} left)`} onClick={() => dups.fetchNextPage()} disabled={dups.isFetchingNextPage} />}
            </>
          )}
      </section>

      <section className="space-y-3" aria-label="Recent merges">
        <h2 className="font-display font-bold text-xl">Recent merges</h2>
        {note && <p role="status" className="text-sm font-body text-green-300">{note}</p>}
        {(merges.data?.merges.length ?? 0) === 0 ? <p className="text-gaffer-muted font-body">No merges yet.</p> : (
          <ul className="space-y-2">
            {merges.data!.merges.map((m) => (
              <li key={m.id} className="rounded-2xl bg-gaffer-card border border-gaffer-border p-3 flex flex-wrap items-center gap-3">
                <div className="mr-auto min-w-0">
                  <p className="font-body text-sm"><b>{m.mergedName}</b> merged into <b>{m.keepName}</b></p>
                  <p className="text-xs text-gaffer-muted font-body">{new Date(m.at).toLocaleString('en-GB')} by {m.by ?? 'HQ'}{m.reasons.length ? ` · ${m.reasons.map((r) => REASON[r] ?? r).join(', ')}` : ''}</p>
                </div>
                {m.undoneAt ? <Pill label="Undone" tone="neutral" /> : m.canUndo ? <ActionButton label="Undo" onClick={() => undo.mutate(m.id)} disabled={undo.isPending} /> : <Pill label="Final" tone="neutral" />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
