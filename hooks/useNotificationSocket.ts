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

    return () => {
      socket.off('notification:new')
      socket.disconnect()
    }
  }, [qc])
}
