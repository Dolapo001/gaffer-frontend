'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { onSocketInitialized } from '@/hooks/useNotificationSocket'

/**
 * Live match page updates: joins the fixture's socket room and refreshes the
 * match state, commentary and lineups whenever the backend broadcasts a
 * `live:event` for it (kickoff, goals, cards, edits, deletions, full time).
 *
 * The socket is only opened for logged-in users (useNotificationSocket); for
 * guests this is a no-op and the page relies on its polling fallback.
 */
export function useLiveMatch(fixtureId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!fixtureId) return
    let socket: any = null
    let cancelled = false

    // Remove only our own listener: socket.off('live:event') without a handler
    // would also strip other components' listeners on the shared socket.
    const handler = (event: { fixtureId?: string }) => {
      if (event?.fixtureId !== fixtureId) return
      qc.invalidateQueries({ queryKey: ['match', fixtureId] })
      qc.invalidateQueries({ queryKey: ['match-events', fixtureId] })
      qc.invalidateQueries({ queryKey: ['lineups', fixtureId] })
    }

    onSocketInitialized((s) => {
      if (cancelled) return
      socket = s
      socket.emit('join:match', fixtureId)
      socket.on('live:event', handler)
    })

    return () => {
      cancelled = true
      if (socket) {
        socket.emit('leave:match', fixtureId)
        socket.off('live:event', handler)
      }
    }
  }, [fixtureId, qc])
}
