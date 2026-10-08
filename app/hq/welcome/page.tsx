'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hqService } from '@/lib/services/hq.service'
import { ImageField } from '@/components/hq/ImageField'
import { ApiError } from '@/lib/api'

export default function HqWelcomePage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['hq', 'welcome'], queryFn: hqService.getWelcome })
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (data) {
      setTitle(data.title)
      setBody(data.body)
      setImageUrl(data.imageUrl ?? '')
    }
  }, [data])

  const save = useMutation({
    mutationFn: () => hqService.setWelcome({ title: title.trim(), body: body.trim(), imageUrl: imageUrl || undefined }),
    onSuccess: (res) => {
      setMessage({ ok: true, text: `Saved. It now shows for ${res.postsUpdated ?? 0} existing users, and every new user will get it.` })
      qc.invalidateQueries({ queryKey: ['hq', 'welcome'] })
    },
    onError: (e) => setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'Could not save. Try again.' }),
  })

  const field = 'mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white'

  if (isLoading) return <p className="text-gaffer-muted font-body">Loading…</p>

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setMessage(null); save.mutate() }}
      className="max-w-3xl space-y-4"
    >
      <h1 className="font-display font-extrabold text-3xl">Welcome message</h1>
      <p className="text-sm font-body text-gaffer-muted">
        The first news every new player sees. Saving rewrites it for everyone who already has it too.
      </p>
      <label className="block text-sm font-body text-gaffer-muted">Headline
        <input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={field} />
      </label>
      <label className="block text-sm font-body text-gaffer-muted">Message
        <textarea required rows={8} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} className={field} />
      </label>
      <ImageField value={imageUrl} onChange={setImageUrl} />
      {message && <p role={message.ok ? 'status' : 'alert'} className={`text-sm font-body ${message.ok ? 'text-green-300' : 'text-red-400'}`}>{message.text}</p>}
      <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded-xl bg-gaffer-orange text-black font-display font-bold disabled:opacity-50">
        {save.isPending ? 'Saving…' : 'Save welcome message'}
      </button>
    </form>
  )
}
