'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hqService, type HqContentItem } from '@/lib/services/hq.service'
import { ActionButton, Pager, Pill, ReasonDialog, errorText } from '@/components/hq/ui'

function Comments({ id }: { id: string }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['hq', 'comments', id], queryFn: () => hqService.listComments(id) })
  const [error, setError] = useState<string | null>(null)
  const remove = useMutation({
    mutationFn: (commentId: string) => hqService.removeComment(commentId),
    onSuccess: () => { setError(null); qc.invalidateQueries({ queryKey: ['hq', 'comments', id] }); qc.invalidateQueries({ queryKey: ['hq', 'content'] }) },
    onError: (e) => setError(errorText(e)),
  })
  if (isLoading) return <p className="text-sm text-gaffer-muted font-body">Loading comments…</p>
  if (!data || data.comments.length === 0) return <p className="text-sm text-gaffer-muted font-body">No comments.</p>
  return (
    <ul className="space-y-2">
      {error && <li role="alert" className="text-sm text-red-400 font-body">{error}</li>}
      {data.comments.map((c) => (
        <li key={c.id} className="rounded-xl border border-gaffer-border p-2 text-sm font-body flex items-start justify-between gap-3">
          <span className="min-w-0"><span className="block whitespace-pre-line">{c.body}</span><span className="block text-xs text-gaffer-muted">{c.user?.email ?? 'Unknown'} · {new Date(c.createdAt).toLocaleString()}</span></span>
          <ActionButton tone="bad" label="Remove" onClick={() => remove.mutate(c.id)} disabled={remove.isPending} />
        </li>
      ))}
    </ul>
  )
}

function EditDialog({ item, onClose }: { item: HqContentItem; onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState(item.title ?? '')
  const [body, setBody] = useState(item.body)
  const [error, setError] = useState<string | null>(null)
  const save = useMutation({
    mutationFn: () => hqService.editContent(item.id, { title, body }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hq'] }); onClose() },
    onError: (e) => setError(errorText(e)),
  })
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Edit post">
      <div className="w-full max-w-lg bg-gaffer-surface border border-gaffer-border rounded-3xl p-5 space-y-3">
        <h3 className="font-display font-bold text-xl">Edit this post</h3>
        <label className="block text-sm font-body text-gaffer-muted">Headline
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white" />
        </label>
        <label className="block text-sm font-body text-gaffer-muted">Text
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={5000} className="mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white" />
        </label>
        {error && <p role="alert" className="text-sm text-red-400 font-body">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl font-body text-gaffer-muted hover:text-white">Cancel</button>
          <button onClick={() => save.mutate()} disabled={save.isPending || !body.trim()} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50">{save.isPending ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  )
}

export default function HqContentPage() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [removing, setRemoving] = useState<HqContentItem | null>(null)
  const [editing, setEditing] = useState<HqContentItem | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const { data, isLoading, error: loadError } = useQuery({ queryKey: ['hq', 'content', q, type, page], queryFn: () => hqService.listContent({ q: q || undefined, type: type || undefined, page }) })
  const remove = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => hqService.removeContent(id, reason),
    onSuccess: () => { setRemoving(null); setError(null); setNote('Post removed for everyone.'); qc.invalidateQueries({ queryKey: ['hq'] }) },
    onError: (e) => setError(errorText(e)),
  })

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="font-display font-extrabold text-3xl">Moderation</h1>
      <p className="text-sm font-body text-gaffer-muted">Posts and news from organisations and teams. Removing one takes it out of everyone&apos;s feed. Gaffer&apos;s own news is managed under News.</p>
      <div className="flex flex-wrap gap-2">
        <input type="search" aria-label="Search posts" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search headline or text" className="flex-1 min-w-[12rem] rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white" />
        <select aria-label="Filter by type" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} className="rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white">
          <option value="">All</option><option value="news">News</option><option value="post">Posts</option><option value="repost">Reposts</option>
        </select>
      </div>
      {note && <p role="status" className="text-sm text-green-300 font-body">{note}</p>}

      {isLoading ? <p className="text-gaffer-muted font-body">Loading…</p>
        : loadError || !data ? <p role="alert" className="text-red-400 font-body">Could not load posts.</p>
        : data.items.length === 0 ? <p className="text-gaffer-muted font-body">Nothing to review.</p>
        : (
          <ul className="space-y-3">
            {data.items.map((i) => (
              <li key={i.id} className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-lg">{i.title || '(no headline)'}</p>
                    <p className="text-xs text-gaffer-muted font-body">{i.author}{i.organisation ? ` · ${i.organisation}` : ''} · {new Date(i.createdAt).toLocaleString()}</p>
                  </div>
                  <Pill label={i.type} tone="neutral" />
                </div>
                <p className="text-sm font-body whitespace-pre-line line-clamp-4">{i.body}</p>
                <div className="flex flex-wrap gap-2">
                  <ActionButton label="Edit" onClick={() => setEditing(i)} />
                  <ActionButton tone="bad" label="Remove…" onClick={() => { setError(null); setRemoving(i) }} />
                  {i.comments > 0 && <ActionButton label={open === i.id ? 'Hide comments' : `Comments (${i.comments})`} onClick={() => setOpen(open === i.id ? null : i.id)} />}
                </div>
                {open === i.id && <Comments id={i.id} />}
              </li>
            ))}
          </ul>
        )}
      {data && <Pager page={page} total={data.total} pageSize={data.pageSize} onPage={setPage} />}

      {editing && <EditDialog item={editing} onClose={() => setEditing(null)} />}
      {removing && (
        <ReasonDialog title="Remove this post" confirmLabel="Remove" required={false} busy={remove.isPending} error={error}
          onCancel={() => { setRemoving(null); setError(null) }} onConfirm={(reason) => remove.mutate({ id: removing.id, reason: reason || undefined })} />
      )}
    </div>
  )
}
