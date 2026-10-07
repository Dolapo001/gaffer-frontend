'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hqService, type HqUser } from '@/lib/services/hq.service'
import { ActionButton, Pager, Pill, ReasonDialog, errorText } from '@/components/hq/ui'

const STATUS: Record<HqUser['status'], { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }> = {
  active: { label: 'Active', tone: 'good' },
  pending: { label: 'Pending', tone: 'warn' },
  suspended: { label: 'Suspended', tone: 'bad' },
  deleted: { label: 'Deleted', tone: 'bad' },
}

function UserDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['hq', 'user', id], queryFn: () => hqService.getUser(id) })
  const [dialog, setDialog] = useState<'suspend' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const done = (text?: string) => { setDialog(null); setConfirmDelete(false); setError(null); setNote(text ?? null); qc.invalidateQueries({ queryKey: ['hq'] }) }
  const act = useMutation({ mutationFn: (fn: () => Promise<unknown>) => fn(), onSuccess: () => done(), onError: (e) => setError(errorText(e)) })
  const coins = useMutation({
    mutationFn: () => hqService.adjustCoins(id, Number(amount), reason.trim()),
    onSuccess: (r) => { setAmount(''); setReason(''); done(`Done. They now have ${r.balance} coins.`) },
    onError: (e) => setError(errorText(e)),
  })

  if (isLoading || !data) return <p className="text-gaffer-muted font-body p-4">Loading…</p>
  const { user, leagues, fantasyTeams, organisations, wallet, transactions } = data
  const isHq = user.platformRole === 'platform_admin'
  const s = STATUS[user.status]
  const field = 'rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white'

  return (
    <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display font-extrabold text-2xl truncate">{user.fullName || user.email}</h2>
          <p className="text-sm text-gaffer-muted font-body break-all">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill label={s.label} tone={s.tone} />
          <button onClick={onClose} aria-label="Close" className="text-gaffer-muted hover:text-white">✕</button>
        </div>
      </div>

      <dl className="grid md:grid-cols-3 gap-3 text-sm font-body">
        <div><dt className="text-gaffer-muted">Joined Gaffer</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd></div>
        <div><dt className="text-gaffer-muted">Last login</dt><dd>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</dd></div>
        <div><dt className="text-gaffer-muted">Coins</dt><dd className="font-chakra font-bold text-lg">{wallet.balance}</dd></div>
      </dl>

      <div className="grid md:grid-cols-2 gap-4 text-sm font-body">
        <div>
          <p className="text-gaffer-muted mb-1">Leagues joined ({leagues.length})</p>
          {leagues.length ? <ul className="space-y-1">{leagues.map((l) => <li key={l.id}>{l.name} <span className="text-gaffer-muted">· {l.status}</span></li>)}</ul> : <p>None.</p>}
        </div>
        <div>
          <p className="text-gaffer-muted mb-1">Fantasy teams ({fantasyTeams.length})</p>
          {fantasyTeams.length ? <ul className="space-y-1">{fantasyTeams.map((t) => <li key={t.id}>{t.name} <span className="text-gaffer-muted">· {t.tournament ?? '—'} · {t.points} pts{t.hidden ? ' · hidden from tables' : ''}</span></li>)}</ul> : <p>None.</p>}
        </div>
        <div>
          <p className="text-gaffer-muted mb-1">Organisations they own ({organisations.length})</p>
          {organisations.length ? <ul className="space-y-1">{organisations.map((o) => <li key={o.id}>{o.name} <span className="text-gaffer-muted">· {o.lifecycleStatus === 'active' ? o.verificationStatus : o.lifecycleStatus}</span></li>)}</ul> : <p>None.</p>}
        </div>
        <div>
          <p className="text-gaffer-muted mb-1">Latest coin movements</p>
          {transactions.length ? <ul className="space-y-1">{transactions.map((t) => <li key={t.id}>{t.type === 'credit' ? '+' : '−'}{t.coins} <span className="text-gaffer-muted">· {t.source.replace('_', ' ')} · {new Date(t.createdAt).toLocaleDateString()}</span></li>)}</ul> : <p>None.</p>}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setError(null); setNote(null); coins.mutate() }} className="rounded-xl border border-gaffer-border p-3 space-y-2">
        <p className="font-display font-bold">Give or take back coins</p>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Coins (negative takes back)" type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100 or -50" className={`${field} w-40`} />
          <input aria-label="Reason for the change" required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Reason" className={`${field} flex-1 min-w-[10rem]`} />
          <button type="submit" disabled={coins.isPending || !amount || Number(amount) === 0 || !reason.trim()} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50">{coins.isPending ? 'Saving…' : 'Apply'}</button>
        </div>
      </form>

      {note && <p role="status" className="text-sm text-green-300 font-body">{note}</p>}
      {error && !dialog && <p role="alert" className="text-sm text-red-400 font-body">{error}</p>}

      {isHq ? (
        <p className="text-sm font-body text-gaffer-muted">This is an HQ account, so it can&apos;t be suspended or deleted from here.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {user.status === 'active' && <ActionButton label="Suspend…" onClick={() => setDialog('suspend')} disabled={act.isPending} />}
          {(user.status === 'suspended' || user.status === 'deleted') && <ActionButton tone="good" label="Restore" onClick={() => act.mutate(() => hqService.restoreUser(id))} disabled={act.isPending} />}
          {user.status !== 'deleted' && (confirmDelete
            ? (<><ActionButton tone="bad" label="Yes, delete" onClick={() => act.mutate(() => hqService.deleteUser(id))} disabled={act.isPending} /><ActionButton label="Keep" onClick={() => setConfirmDelete(false)} /></>)
            : <ActionButton tone="bad" label="Delete…" onClick={() => setConfirmDelete(true)} />)}
        </div>
      )}
      {confirmDelete && <p className="text-sm font-body text-gaffer-muted">They are signed out everywhere and can&apos;t log in, and their fantasy teams leave the tables. You can restore them later.</p>}

      {dialog === 'suspend' && (
        <ReasonDialog title={`Suspend ${user.fullName || user.email}`} confirmLabel="Suspend" required={false} busy={act.isPending} error={error}
          onCancel={() => { setDialog(null); setError(null) }}
          onConfirm={(r) => act.mutate(() => hqService.suspendUser(id, r || undefined))} />
      )}
    </div>
  )
}

export default function HqUsersPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const { data, isLoading, error } = useQuery({ queryKey: ['hq', 'users', q, status, page], queryFn: () => hqService.listUsers({ q: q || undefined, status: status || undefined, page }) })

  return (
    <div className="space-y-4 max-w-5xl">
      <h1 className="font-display font-extrabold text-3xl">Users</h1>
      <div className="flex flex-wrap gap-2">
        <input type="search" aria-label="Search users" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search name, username or email" className="flex-1 min-w-[12rem] rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white" />
        <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white">
          <option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="deleted">Deleted</option><option value="pending">Pending</option>
        </select>
      </div>

      {selected && <UserDetail id={selected} onClose={() => setSelected(null)} />}

      {isLoading ? <p className="text-gaffer-muted font-body">Loading…</p>
        : error || !data ? <p role="alert" className="text-red-400 font-body">Could not load users.</p>
        : data.users.length === 0 ? <p className="text-gaffer-muted font-body">No users found.</p>
        : (
          <ul className="space-y-2">
            {data.users.map((u) => (
              <li key={u.id}>
                <button onClick={() => setSelected(u.id)} className={`w-full text-left rounded-2xl bg-gaffer-card border p-3 flex items-center justify-between gap-3 hover:border-gaffer-orange ${selected === u.id ? 'border-gaffer-orange' : 'border-gaffer-border'}`}>
                  <span className="min-w-0">
                    <span className="block font-display font-bold text-lg truncate">{u.fullName || u.email}</span>
                    <span className="block text-xs text-gaffer-muted font-body truncate">{u.email} · joined {new Date(u.createdAt).toLocaleDateString()} · {u.leaguesJoined ?? 0} {u.leaguesJoined === 1 ? 'league' : 'leagues'}{u.isOrgOwner ? ' · organisation owner' : ''}{u.platformRole ? ' · HQ' : ''}</span>
                  </span>
                  <Pill label={STATUS[u.status].label} tone={STATUS[u.status].tone} />
                </button>
              </li>
            ))}
          </ul>
        )}
      {data && <Pager page={page} total={data.total} pageSize={data.pageSize} onPage={setPage} />}
    </div>
  )
}
