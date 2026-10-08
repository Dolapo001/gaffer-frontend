'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hqService, type HqOrg, type NewOrgInput } from '@/lib/services/hq.service'
import { ApiError } from '@/lib/api'
import { TypeNameDialog } from '@/components/hq/ui'

type Tab = 'pending' | 'approved' | 'rejected' | 'suspended' | 'deleted' | 'all'
const TABS: { id: Tab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'deleted', label: 'Deleted' },
  { id: 'all', label: 'All' },
]

function filterFor(tab: Tab) {
  switch (tab) {
    case 'pending':
    case 'approved':
    case 'rejected':
      return { verificationStatus: tab } as const
    case 'suspended':
    case 'deleted':
      return { lifecycleStatus: tab } as const
    default:
      return {}
  }
}

function errorText(err: unknown) {
  return err instanceof ApiError ? err.message : 'Something went wrong. Try again.'
}

function StatusPill({ org }: { org: HqOrg }) {
  const label =
    org.lifecycleStatus === 'deleted' ? 'Deleted'
    : org.lifecycleStatus === 'suspended' ? 'Suspended'
    : org.verificationStatus === 'approved' ? 'Approved'
    : org.verificationStatus === 'rejected' ? 'Rejected'
    : 'Pending'
  const tone =
    label === 'Approved' ? 'text-green-300 border-green-500/40'
    : label === 'Pending' ? 'text-yellow-300 border-yellow-500/40'
    : 'text-red-300 border-red-500/40'
  return <span className={`text-xs font-body font-semibold border rounded-full px-2 py-0.5 ${tone}`}>{label}</span>
}

function ReasonDialog({
  title, confirmLabel, required, onCancel, onConfirm, busy, error,
}: {
  title: string; confirmLabel: string; required: boolean
  onCancel: () => void; onConfirm: (reason: string) => void; busy: boolean; error: string | null
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md bg-gaffer-surface border border-gaffer-border rounded-3xl p-5 space-y-3">
        <h3 className="font-display font-bold text-xl">{title}</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder={required ? 'What should they fix?' : 'Reason (optional)'}
          className="w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white"
        />
        {error && <p role="alert" className="text-sm text-red-400 font-body">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl font-body text-gaffer-muted hover:text-white">Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy || (required && !reason.trim())}
            className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50"
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function OrgDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['hq', 'org', id], queryFn: () => hqService.getOrg(id) })
  const [dialog, setDialog] = useState<'reject' | 'suspend' | 'purge' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const done = () => {
    setDialog(null)
    setConfirmDelete(false)
    setError(null)
    qc.invalidateQueries({ queryKey: ['hq'] })
  }
  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: done,
    onError: (e) => setError(errorText(e)),
  })

  const purge = useMutation({
    mutationFn: (name: string) => hqService.purgeOrg(id, name),
    onSuccess: () => { done(); onClose() },
    onError: (e) => setError(errorText(e)),
  })

  if (isLoading || !data) return <p className="text-gaffer-muted font-body p-4">Loading…</p>
  const { org, competitions, playersJoined } = data
  const deleted = org.lifecycleStatus === 'deleted'
  const suspended = org.lifecycleStatus === 'suspended'
  const app = org.application || {}

  const Btn = ({ label, onClick, tone = 'neutral' }: { label: string; onClick: () => void; tone?: 'neutral' | 'good' | 'bad' }) => (
    <button
      onClick={onClick}
      disabled={act.isPending}
      className={`px-3 py-2 rounded-xl text-sm font-body font-semibold border disabled:opacity-50 ${
        tone === 'good' ? 'bg-green-500/15 border-green-500/40 text-green-300'
        : tone === 'bad' ? 'bg-red-500/15 border-red-500/40 text-red-300'
        : 'border-gaffer-border text-white hover:bg-gaffer-card'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-2xl">{org.name}</h2>
          <p className="text-sm text-gaffer-muted font-body">@{org.handle}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill org={org} />
          <button onClick={onClose} aria-label="Close" className="text-gaffer-muted hover:text-white">✕</button>
        </div>
      </div>

      <dl className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm font-body">
        <div><dt className="text-gaffer-muted">Owner</dt><dd>{org.owner?.fullName || '—'} · {org.owner?.email || '—'}</dd></div>
        <div><dt className="text-gaffer-muted">Phone</dt><dd>{app.phone || '—'}</dd></div>
        <div className="md:col-span-2">
          <dt className="text-gaffer-muted">Social links</dt>
          <dd>
            {app.socialLinks?.length
              ? app.socialLinks.map((l) => (
                  <a key={l} href={/^https?:\/\//.test(l) ? l : `https://${l}`} target="_blank" rel="noopener noreferrer" className="block text-gaffer-orange underline break-all">{l}</a>
                ))
              : '—'}
          </dd>
        </div>
        <div className="md:col-span-2"><dt className="text-gaffer-muted">About</dt><dd>{org.description || '—'}</dd></div>
        {org.logoUrl && !app.proofUrl && (
          <div className="md:col-span-2">
            <dt className="text-gaffer-muted">Logo</dt>
            <dd>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={org.logoUrl} alt={`${org.name} logo`} className="mt-1 max-h-32 rounded-xl border border-gaffer-border" />
            </dd>
          </div>
        )}
        {app.proofUrl && (
          <div className="md:col-span-2">
            <dt className="text-gaffer-muted">Photo or logo proof</dt>
            <dd>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={app.proofUrl} alt={`Proof from ${org.name}`} className="mt-1 max-h-48 rounded-xl border border-gaffer-border" />
            </dd>
          </div>
        )}
        {app.rejectionReason && org.verificationStatus === 'rejected' && (
          <div className="md:col-span-2"><dt className="text-gaffer-muted">Rejection reason</dt><dd>{app.rejectionReason}</dd></div>
        )}
        {suspended && org.suspension?.reason && (
          <div className="md:col-span-2"><dt className="text-gaffer-muted">Suspension reason</dt><dd>{org.suspension.reason}</dd></div>
        )}
        <div><dt className="text-gaffer-muted">Applied</dt><dd>{app.submittedAt ? new Date(app.submittedAt).toLocaleString() : new Date(org.createdAt).toLocaleString()}</dd></div>
        <div><dt className="text-gaffer-muted">Players joined</dt><dd>{playersJoined}</dd></div>
      </dl>

      <div>
        <p className="text-sm text-gaffer-muted font-body mb-1">Tournaments ({competitions.length})</p>
        {competitions.length === 0 ? (
          <p className="text-sm font-body">None yet.</p>
        ) : (
          <ul className="text-sm font-body space-y-1">
            {competitions.map((c) => (
              <li key={c.id}>{c.name} <span className="text-gaffer-muted">· {c.status}</span></li>
            ))}
          </ul>
        )}
      </div>

      {error && !dialog && <p role="alert" className="text-sm text-red-400 font-body">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {!deleted && org.verificationStatus !== 'approved' && <Btn tone="good" label="Approve" onClick={() => act.mutate(() => hqService.approveOrg(id))} />}
        {!deleted && org.verificationStatus !== 'rejected' && <Btn tone="bad" label="Reject…" onClick={() => setDialog('reject')} />}
        {!deleted && !suspended && <Btn label="Suspend…" onClick={() => setDialog('suspend')} />}
        {suspended && <Btn tone="good" label="Lift suspension" onClick={() => act.mutate(() => hqService.restoreOrg(id))} />}
        {deleted ? (
          <>
            <Btn tone="good" label="Restore" onClick={() => act.mutate(() => hqService.restoreOrg(id))} />
            <Btn tone="bad" label="Delete forever…" onClick={() => { setError(null); setDialog('purge') }} />
          </>
        ) : confirmDelete ? (
          <>
            <Btn tone="bad" label="Yes, delete" onClick={() => act.mutate(() => hqService.deleteOrg(id))} />
            <Btn label="Keep" onClick={() => setConfirmDelete(false)} />
          </>
        ) : (
          <Btn tone="bad" label="Delete…" onClick={() => setConfirmDelete(true)} />
        )}
      </div>
      {confirmDelete && (
        <p className="text-sm font-body text-gaffer-muted">
          This hides the organisation and blocks its sign-in to the organisation side. You can restore it later.
        </p>
      )}

      {dialog === 'reject' && (
        <ReasonDialog
          title={`Reject ${org.name}`} confirmLabel="Reject" required
          busy={act.isPending} error={error}
          onCancel={() => { setDialog(null); setError(null) }}
          onConfirm={(reason) => act.mutate(() => hqService.rejectOrg(id, reason))}
        />
      )}
      {dialog === 'purge' && (
        <TypeNameDialog
          title="Delete this organisation for good" name={org.name} confirmLabel="Delete forever" busy={purge.isPending} error={error}
          warning="This permanently removes the organisation and all of its tournaments, fixtures, standings, fantasy teams, teams, players and posts. It can't be undone. The owner keeps their Gaffer account."
          onCancel={() => { setDialog(null); setError(null) }} onConfirm={(typed) => purge.mutate(typed)}
        />
      )}
      {dialog === 'suspend' && (
        <ReasonDialog
          title={`Suspend ${org.name}`} confirmLabel="Suspend" required={false}
          busy={act.isPending} error={error}
          onCancel={() => { setDialog(null); setError(null) }}
          onConfirm={(reason) => act.mutate(() => hqService.suspendOrg(id, reason || undefined))}
        />
      )}
    </div>
  )
}

function AddOrg({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState<NewOrgInput & { social: string }>({ name: '', handle: '', ownerEmail: '', ownerName: '', description: '', phone: '', social: '' })
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ name: string; inviteLink: string | null } | null>(null)
  const [copied, setCopied] = useState(false)

  const create = useMutation({
    mutationFn: () => {
      const { social, ...rest } = form
      return hqService.createOrg({
        ...rest,
        ownerName: rest.ownerName || undefined,
        description: rest.description || undefined,
        phone: rest.phone || undefined,
        socialLinks: social.trim() ? [social.trim()] : undefined,
      })
    },
    onSuccess: (res) => {
      setResult({ name: res.org.name, inviteLink: res.inviteLink })
      qc.invalidateQueries({ queryKey: ['hq'] })
    },
    onError: (e) => setError(errorText(e)),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })
  const input = 'mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white'

  if (result) {
    return (
      <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
        <h2 className="font-display font-bold text-xl">{result.name} is added and approved</h2>
        {result.inviteLink ? (
          <>
            <p className="text-sm font-body text-gaffer-muted">
              Send this link to the owner so they can choose a password. It works for 7 days. We also tried to email it, which only reaches inboxes once a sending domain is set up.
            </p>
            <input readOnly value={result.inviteLink} onFocus={(e) => e.currentTarget.select()} aria-label="Invite link" className={input} />
            <button
              onClick={async () => { await navigator.clipboard.writeText(result.inviteLink!); setCopied(true) }}
              className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold"
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </>
        ) : (
          <p className="text-sm font-body text-gaffer-muted">The owner already has a Gaffer account, so no invite is needed. They will see the organisation next time they open it.</p>
        )}
        <div><button onClick={onClose} className="text-sm font-body text-gaffer-muted hover:text-white">Done</button></div>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setError(null); create.mutate() }}
      className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3"
    >
      <div className="flex justify-between"><h2 className="font-display font-bold text-xl">Add an organisation</h2><button type="button" onClick={onClose} aria-label="Close" className="text-gaffer-muted">✕</button></div>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block text-sm font-body text-gaffer-muted">Organisation name<input required value={form.name} onChange={set('name')} className={input} /></label>
        <label className="block text-sm font-body text-gaffer-muted">Handle (letters, numbers, underscore)<input required minLength={3} pattern="[a-zA-Z0-9_]+" value={form.handle} onChange={set('handle')} className={input} /></label>
        <label className="block text-sm font-body text-gaffer-muted">Owner email<input required type="email" value={form.ownerEmail} onChange={set('ownerEmail')} className={input} /></label>
        <label className="block text-sm font-body text-gaffer-muted">Owner name<input value={form.ownerName} onChange={set('ownerName')} className={input} /></label>
        <label className="block text-sm font-body text-gaffer-muted">Phone<input value={form.phone} onChange={set('phone')} className={input} /></label>
        <label className="block text-sm font-body text-gaffer-muted">Social link<input value={form.social} onChange={set('social')} className={input} /></label>
        <label className="block text-sm font-body text-gaffer-muted md:col-span-2">About<textarea rows={3} maxLength={500} value={form.description} onChange={set('description')} className={input} /></label>
      </div>
      {error && <p role="alert" className="text-sm text-red-400 font-body">{error}</p>}
      <button type="submit" disabled={create.isPending} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50">
        {create.isPending ? 'Adding…' : 'Add and approve'}
      </button>
    </form>
  )
}

function Organisations() {
  const params = useSearchParams()
  const initial = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'pending') as Tab
  const [tab, setTab] = useState<Tab>(initial)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['hq', 'orgs', tab, q, page],
    queryFn: () => hqService.listOrgs({ ...filterFor(tab), q: q || undefined, page }),
  })

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display font-extrabold text-3xl">Organisations</h1>
        <button onClick={() => { setAdding(true); setSelected(null) }} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold">Add organisation</button>
      </div>

      <div role="tablist" aria-label="Organisation status" className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); setPage(1); setSelected(null) }}
            className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-body font-semibold ${tab === t.id ? 'bg-gaffer-card text-white border border-gaffer-orange' : 'text-gaffer-muted border border-transparent hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search name, handle or email"
        aria-label="Search organisations"
        className="w-full rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white"
      />

      {adding && <AddOrg onClose={() => setAdding(false)} />}
      {selected && <OrgDetail id={selected} onClose={() => setSelected(null)} />}

      {isLoading ? <p className="text-gaffer-muted font-body">Loading…</p>
        : error || !data ? <p role="alert" className="text-red-400 font-body">Could not load organisations.</p>
        : data.orgs.length === 0 ? <p className="text-gaffer-muted font-body">{tab === 'pending' ? 'Nothing is waiting for approval.' : 'No organisations here.'}</p>
        : (
          <ul className="space-y-2">
            {data.orgs.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => { setSelected(o.id); setAdding(false) }}
                  className={`w-full text-left rounded-2xl bg-gaffer-card border p-3 flex items-center justify-between gap-3 hover:border-gaffer-orange ${selected === o.id ? 'border-gaffer-orange' : 'border-gaffer-border'}`}
                >
                  <span className="min-w-0">
                    <span className="block font-display font-bold text-lg truncate">{o.name}</span>
                    <span className="block text-xs text-gaffer-muted font-body truncate">@{o.handle} · {o.owner?.email || 'no owner email'} · applied {new Date(o.application?.submittedAt || o.createdAt).toLocaleDateString()}</span>
                  </span>
                  <StatusPill org={o} />
                </button>
              </li>
            ))}
          </ul>
        )}

      {data && data.total > data.pageSize && (
        <div className="flex items-center gap-3 font-body text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-xl border border-gaffer-border disabled:opacity-40">Previous</button>
          <span className="text-gaffer-muted">Page {page} of {Math.ceil(data.total / data.pageSize)}</span>
          <button disabled={page >= Math.ceil(data.total / data.pageSize)} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-xl border border-gaffer-border disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}

export default function HqOrganisationsPage() {
  return (
    <Suspense fallback={<p className="text-gaffer-muted font-body">Loading…</p>}>
      <Organisations />
    </Suspense>
  )
}
