'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { hqService } from '@/lib/services/hq.service'

const LABEL: Record<string, string> = {
  'org.approve': 'Approved organisation',
  'org.reject': 'Rejected organisation',
  'org.suspend': 'Suspended organisation',
  'org.unsuspend': 'Lifted suspension',
  'org.delete': 'Deleted organisation',
  'org.undelete': 'Restored organisation',
  'org.create': 'Added organisation',
  'news.publish': 'Published news',
  'news.schedule': 'Scheduled news',
  'news.edit': 'Edited news',
  'news.unpublish': 'Pulled news',
  'news.republish': 'Republished news',
  'news.delete': 'Deleted news',
  'welcome.update': 'Changed the welcome message',
  'chips.global.update': 'Changed the chip rules',
  'chips.competition.update': 'Changed a tournament\'s chip rules',
  'chips.competition.reset': 'Reset a tournament\'s chip rules',
  'chips.give': 'Gave chips',
  'org.purge': 'Deleted organisation for good',
  'user.suspend': 'Suspended user',
  'user.restore': 'Restored user',
  'user.delete': 'Deleted user',
  'user.coins': 'Changed a user\'s coins',
  'tournament.hide': 'Hid tournament',
  'tournament.unhide': 'Showed tournament again',
  'tournament.delete': 'Deleted tournament',
  'content.remove': 'Removed a post',
  'content.comment.remove': 'Removed a comment',
}

export default function HqAuditPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useQuery({ queryKey: ['hq', 'audit', page], queryFn: () => hqService.audit({ page }) })

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="font-display font-extrabold text-3xl">Audit log</h1>
      <p className="text-sm text-gaffer-muted font-body">Every HQ action: who did it, to what, and when.</p>

      {isLoading ? <p className="text-gaffer-muted font-body">Loading…</p>
        : error || !data ? <p role="alert" className="text-red-400 font-body">Could not load the audit log.</p>
        : data.entries.length === 0 ? <p className="text-gaffer-muted font-body">No actions yet.</p>
        : (
          <ul className="space-y-2">
            {data.entries.map((e) => (
              <li key={e.id} className="rounded-2xl bg-gaffer-card border border-gaffer-border p-3 font-body text-sm">
                <p className="font-semibold text-white">
                  {LABEL[e.action] ?? e.action}
                  {e.targetLabel ? `: ${e.targetLabel}` : ''}
                </p>
                <p className="text-gaffer-muted">
                  {e.actorEmail || 'unknown'} · {new Date(e.createdAt).toLocaleString()}
                  {typeof e.metadata?.reason === 'string' ? ` · reason: ${e.metadata.reason}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}

      {data && data.total > data.pageSize && (
        <div className="flex items-center gap-3 font-body text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-xl border border-gaffer-border disabled:opacity-40">Newer</button>
          <span className="text-gaffer-muted">Page {page} of {Math.ceil(data.total / data.pageSize)}</span>
          <button disabled={page >= Math.ceil(data.total / data.pageSize)} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-xl border border-gaffer-border disabled:opacity-40">Older</button>
        </div>
      )}
    </div>
  )
}
