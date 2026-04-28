'use client'

import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { tokenStore } from '@/lib/api'
import type { InboxNotification } from '@/lib/services/notifications.service'

type InboxCache = {
  notifications: InboxNotification[]
  total: number
  page: number
  unreadCount: number
}

let socketInstance: ReturnType<typeof io> | null = null

export function getSocket() {
  return socketInstance
}

export function useNotificationSocket() {
  const qc = useQueryClient()

  useEffect(() => {
    const token = tokenStore.get()
    if (!token) return

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      auth: { token },
      reconnectionAttempts: 5,
      transports: ['websocket'],
    })

    socketInstance = socket

    socket.on('notification:new', (notification: InboxNotification) => {
      // Prepend to inbox cache — no network request
      qc.setQueryData<InboxCache>(['notifications-inbox'], (old) => {
        if (!old) return old
        return {
          ...old,
          notifications: [notification, ...old.notifications],
          unreadCount: old.unreadCount + 1,
        }
      })
      // Increment badge count — no network request
      qc.setQueryData<number>(['notifications-unread-count'], (old = 0) => old + 1)
    })

    socket.on('connect', () => {
      console.info('[socket] reconnected — invalidating stale queries')
      qc.invalidateQueries({
        predicate: (q) =>
          ['match-events', 'league-fixtures', 'match', 'fixtures'].includes(
            q.queryKey[0] as string
          ),
      })
    })

    socket.on('disconnect', (reason) => {
      console.info('[socket] disconnected —', reason)
    })

    return () => {
      socket.off('notification:new')
      socket.off('connect')
      socket.off('disconnect')
      socket.disconnect()
      socketInstance = null
    }
  }, [qc])
}
