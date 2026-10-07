'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hqService, type HqNews, type HqNewsStatus } from '@/lib/services/hq.service'
import { ImageField } from '@/components/hq/ImageField'
import { ApiError } from '@/lib/api'

const TABS: { id: HqNewsStatus; label: string }[] = [
  { id: 'active', label: 'Live' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'unpublished', label: 'Pulled back' },
]

const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Try again.')

/** The browser's datetime-local value for a Date, in the viewer's timezone. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Composer({ editing, onDone }: { editing: HqNews | null; onDone: () => void }) {
  const qc = useQueryClient()
  const sent = editing && (editing.status === 'active' || !!editing.pushedAt)
  const [title, setTitle] = useState(editing?.title ?? '')
  const [body, setBody] = useState(editing?.body ?? '')
  const [imageUrl, setImageUrl] = useState(editing?.imageUrl ?? '')
  const [pinned, setPinned] = useState(editing?.isPinned ?? false)
  const [push, setPush] = useState(editing?.push ?? true)
  const [later, setLater] = useState(editing?.status === 'scheduled')
  const [when, setWhen] = useState(toLocalInput(editing?.publishAt))
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      const publishAt = later && when ? new Date(when).toISOString() : undefined
      if (later && !when) throw new ApiError(400, 'TIME_REQUIRED', 'Choose when to send it')
      if (editing) {
        await hqService.updateNews(editing.id, {
          title: title.trim(),
          body: body.trim(),
          imageUrl,
          pinned,
          ...(editing.status === 'scheduled' ? { push, publishAt } : {}),
        })
        return 'Saved.'
      }
      const res = await hqService.createNews({ title: title.trim() || undefined, body: body.trim(), imageUrl: imageUrl || undefined, pinned, push, publishAt })
      if (res.news.status === 'scheduled') return `Scheduled for ${new Date(res.news.publishAt!).toLocaleString()}.`
      return res.sent ? `Sent. ${res.sent.notified} people were notified and ${res.sent.pushed} phones got a push.` : 'Published.'
    },
    onSuccess: (message) => {
      qc.invalidateQueries({ queryKey: ['hq', 'news'] })
      if (editing) onDone()
      else {
        setResult(message)
        setTitle(''); setBody(''); setImageUrl(''); setPinned(false); setLater(false); setWhen('')
      }
    },
    onError: (e) => setError(errorText(e)),
  })

  const field = 'mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white'

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setError(null); setResult(null); save.mutate() }}
      className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3"
    >
      <h2 className="font-display font-bold text-xl">{editing ? 'Edit this post' : 'New Gaffer news'}</h2>
      <label className="block text-sm font-body text-gaffer-muted">Headline
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={field} />
      </label>
      <label className="block text-sm font-body text-gaffer-muted">Message
        <textarea required rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} className={field} />
      </label>
      <ImageField value={imageUrl} onChange={setImageUrl} />

      <label className="flex items-center gap-2 font-body text-sm">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin to the top until I unpin it
      </label>

      {!sent && (
        <>
          <label className="flex items-center gap-2 font-body text-sm">
            <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} /> Also send a notification to everyone
          </label>
          {!editing && (
            <label className="flex items-center gap-2 font-body text-sm">
              <input type="checkbox" checked={later} onChange={(e) => setLater(e.target.checked)} /> Schedule it for later
            </label>
          )}
          {(later || editing?.status === 'scheduled') && (
            <label className="block text-sm font-body text-gaffer-muted">Send at
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={field} />
            </label>
          )}
        </>
      )}
      {sent && editing && <p className="text-sm font-body text-gaffer-muted">This is already live, so the notification setting and send time can&apos;t change. Edits show for everyone straight away.</p>}

      {error && <p role="alert" className="text-sm font-body text-red-400">{error}</p>}
      {result && <p role="status" className="text-sm font-body text-green-300">{result}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={save.isPending || !body.trim()} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50">
          {save.isPending ? 'Working…' : editing ? 'Save changes' : later ? 'Schedule' : 'Send to everyone'}
        </button>
        {editing && <button type="button" onClick={onDone} className="px-3 py-2 font-body text-gaffer-muted hover:text-white">Cancel</button>}
      </div>
    </form>
  )
}

export default function HqNewsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<HqNewsStatus>('active')
  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState<HqNews | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['hq', 'news', tab], queryFn: () => hqService.listNews(tab) })

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => { setError(null); setConfirmDelete(null); qc.invalidateQueries({ queryKey: ['hq', 'news'] }) },
    onError: (e) => setError(errorText(e)),
  })

  const Btn = ({ label, onClick, tone }: { label: string; onClick: () => void; tone?: 'bad' }) => (
    <button onClick={onClick} disabled={act.isPending} className={`px-3 py-1.5 rounded-xl text-sm font-body font-semibold border disabled:opacity-50 ${tone === 'bad' ? 'border-red-500/40 text-red-300' : 'border-gaffer-border text-white hover:bg-gaffer-card'}`}>{label}</button>
  )

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display font-extrabold text-3xl">Gaffer news</h1>
        <button onClick={() => { setComposing(true); setEditing(null) }} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold">New post</button>
      </div>
      <p className="text-sm font-body text-gaffer-muted">Posts here go to every user and every organisation as official Gaffer news.</p>

      {composing && !editing && <Composer key="new" editing={null} onDone={() => setComposing(false)} />}
      {editing && <Composer key={editing.id} editing={editing} onDone={() => setEditing(null)} />}

      <div role="tablist" aria-label="News status" className="flex gap-1">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-xl px-3 py-1.5 text-sm font-body font-semibold ${tab === t.id ? 'bg-gaffer-card text-white border border-gaffer-orange' : 'text-gaffer-muted border border-transparent hover:text-white'}`}>{t.label}</button>
        ))}
      </div>

      {error && <p role="alert" className="text-sm font-body text-red-400">{error}</p>}

      {isLoading ? <p className="text-gaffer-muted font-body">Loading…</p>
        : !data || data.news.length === 0 ? <p className="text-gaffer-muted font-body">Nothing here.</p>
        : (
          <ul className="space-y-3">
            {data.news.map((n) => (
              <li key={n.id} className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-lg">{n.title || '(no headline)'}{n.isPinned && <span className="ml-2 text-xs font-body font-semibold text-gaffer-orange border border-gaffer-orange/50 rounded-full px-2 py-0.5">Pinned</span>}</p>
                    <p className="text-sm font-body text-gaffer-muted">
                      {n.status === 'scheduled' ? `Goes out ${new Date(n.publishAt!).toLocaleString()}` : new Date(n.createdAt).toLocaleString()}
                      {n.push ? ' · with notification' : ''}
                    </p>
                  </div>
                  {n.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.imageUrl} alt="" className="h-16 w-24 object-cover rounded-lg border border-gaffer-border" />
                  )}
                </div>
                <p className="text-sm font-body whitespace-pre-line line-clamp-4">{n.body}</p>
                <div className="flex flex-wrap gap-2">
                  <Btn label="Edit" onClick={() => { setEditing(n); setComposing(false) }} />
                  {n.status === 'active' && <Btn label={n.isPinned ? 'Unpin' : 'Pin'} onClick={() => act.mutate(() => hqService.updateNews(n.id, { pinned: !n.isPinned }))} />}
                  {n.status === 'active' && <Btn label="Pull back" onClick={() => act.mutate(() => hqService.unpublishNews(n.id))} />}
                  {n.status === 'unpublished' && <Btn label="Publish again" onClick={() => act.mutate(() => hqService.publishNews(n.id))} />}
                  {n.status === 'scheduled' && <Btn label="Send now" onClick={() => act.mutate(() => hqService.publishNews(n.id, n.push))} />}
                  {confirmDelete === n.id
                    ? (<><Btn tone="bad" label="Yes, delete" onClick={() => act.mutate(() => hqService.deleteNews(n.id))} /><Btn label="Keep" onClick={() => setConfirmDelete(null)} /></>)
                    : <Btn tone="bad" label="Delete" onClick={() => setConfirmDelete(n.id)} />}
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}
