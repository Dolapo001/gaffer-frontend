'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Check, ShieldCheck } from 'lucide-react'
import { votePoll, type FeedItem } from '@/lib/services/feed.service'
import { useToast } from '@/store/toastStore'
import { ApiError, getErrorMessage, getImageUrl } from '@/lib/api'
import { timeAgo } from '@/lib/newsCardProps'
import { nameOf } from '@/lib/displayName'

function closesIn(endsAt?: string | null): string {
  if (!endsAt) return ''
  const ms = new Date(endsAt).getTime() - Date.now()
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3_600_000)
  if (h < 1) return `Closes in ${Math.max(1, Math.round(ms / 60_000))} min`
  if (h < 48) return `Closes in ${h}h`
  return `Closes in ${Math.round(h / 24)} days`
}

/** A poll: pick one option. The numbers appear once you have voted or the poll has closed. */
export function PollCard({ item }: { item: FeedItem }) {
  const qc = useQueryClient()
  const { addToast } = useToast()
  const poll = item.poll
  const [showAll, setShowAll] = useState(false)
  const [picked, setPicked] = useState<string | null>(item.myVote ?? null)

  const author = item.authorId
  const name = nameOf(author, 'Gaffer')
  const avatar = author?.logoUrl || author?.avatarUrl || null

  const vote = useMutation({
    mutationFn: (optionId: string) => votePoll(item._id, optionId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['home-feed'] }) },
    onError: (e, optionId) => {
      if (e instanceof ApiError && e.code === 'ALREADY_VOTED') { addToast('You have already voted in this poll', 'info'); qc.invalidateQueries({ queryKey: ['home-feed'] }) }
      else { setPicked(null); addToast(getErrorMessage(e), 'error') }
      void optionId
    },
  })

  if (!poll) return null
  const closed = !!poll.closed
  const myVote = picked ?? item.myVote ?? null
  const reveal = closed || !!myVote
  const total = poll.totalVotes ?? poll.options.reduce((s, o) => s + (o.votes ?? 0), 0)
  const options = reveal ? [...poll.options].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0)) : poll.options
  const long = options.length > 6
  const visible = reveal && long && !showAll ? options.slice(0, 5) : options

  return (
    <article className="rounded-3xl bg-[#1E2032] border border-white/5 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center overflow-hidden shrink-0 text-black font-black">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getImageUrl(avatar)} alt="" className="w-full h-full object-cover" />
          ) : name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-white font-bold text-[15px] leading-tight truncate">
            {name} <ShieldCheck size={14} className="text-orange-400 shrink-0" />
          </p>
          <p className="text-xs text-white/40">{timeAgo(item.createdAt)} · Poll</p>
        </div>
        <BarChart3 size={18} className="text-orange-400 shrink-0 mt-1" aria-hidden="true" />
      </div>

      <h3 className="text-white font-bold text-lg leading-snug mt-3">{item.body}</h3>

      <ul className={`mt-3 space-y-2 ${!reveal && long ? 'max-h-72 overflow-y-auto pr-1' : ''}`}>
        {visible.map((o) => {
          const pct = total ? Math.round(((o.votes ?? 0) / total) * 100) : 0
          const mine = myVote === o._id
          if (!reveal) {
            return (
              <li key={o._id}>
                <button
                  onClick={() => { if (!vote.isPending) { setPicked(o._id); vote.mutate(o._id) } }}
                  disabled={vote.isPending}
                  className="w-full text-left min-h-[48px] px-4 py-2.5 rounded-2xl border border-white/15 text-white font-semibold text-sm hover:border-orange-400/60 active:scale-[0.99] transition disabled:opacity-60"
                >
                  {o.text}
                </button>
              </li>
            )
          }
          return (
            <li key={o._id} className="relative min-h-[48px] rounded-2xl border border-white/10 overflow-hidden">
              <div className={`absolute inset-y-0 left-0 ${mine ? 'bg-orange-500/35' : 'bg-white/10'}`} style={{ width: `${pct}%` }} />
              <div className="relative flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-white font-semibold min-w-0">
                  {mine && <Check size={16} className="text-orange-300 shrink-0" aria-label="Your vote" />}
                  <span className="truncate">{o.text}</span>
                </span>
                <span className="text-white/80 font-bold shrink-0">{pct}%</span>
              </div>
            </li>
          )
        })}
      </ul>

      {reveal && long && (
        <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs font-bold text-orange-400">
          {showAll ? 'Show fewer' : `Show all ${options.length}`}
        </button>
      )}

      <p className="mt-3 text-xs text-white/50">
        {reveal ? `${total} ${total === 1 ? 'vote' : 'votes'}` : 'Vote to see the results'}
        {closed ? ' · Final results' : closesIn(poll.endsAt) ? ` · ${closesIn(poll.endsAt)}` : ''}
      </p>
    </article>
  )
}
