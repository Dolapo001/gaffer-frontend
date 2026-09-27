'use client'

import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { tokenStore } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { InboxNotification } from '@/lib/services/notifications.service'

type InboxCache = {
  notifications: InboxNotification[]
  total: number
  page: number
  unreadCount: number
}

type AppSocket = ReturnType<typeof io>

let socketInstance: AppSocket | null = null
let socketListeners: Array<(s: AppSocket) => void> = []
// One shared connection for every component that calls useNotificationSocket
// (app layout, admin layout, NotificationBell): ref-counted so a second mount
// doesn't open a second socket and an unmount doesn't close someone else's.
let refCount = 0
let socketUserId: string | null = null

export function getSocket() {
  return socketInstance
}

export function onSocketInitialized(cb: (s: AppSocket) => void) {
  if (socketInstance && socketInstance.connected) {
    cb(socketInstance)
  } else {
    socketListeners.push(cb)
  }

  return () => {
    socketListeners = socketListeners.filter((fn) => fn !== cb)
  }
}

function openSocket(qc: QueryClient, userId: string) {
  const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
    // A function, so every (re)connect sends the current access token — it
    // rotates on refresh, and a captured value would go stale
    auth: (cb) => cb({ token: tokenStore.get() }),
    reconnectionAttempts: 5,
    transports: ['websocket'],
  })

  socketInstance = socket
  socketUserId = userId

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
    console.info('[socket] connected/reconnected — invalidating stale queries & flushing listeners')
    socketListeners.forEach((cb) => cb(socket))
    socketListeners = []

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
}

function closeSocket() {
  if (!socketInstance) return
  socketInstance.off('notification:new')
  socketInstance.off('connect')
  socketInstance.off('disconnect')
  socketInstance.disconnect()
  socketInstance = null
  socketUserId = null
}

/**
 * Keeps the realtime socket open while a user is signed in.
 *
 * Depends on the auth store, not a one-off token read: after a full page load
 * the access token is restored asynchronously (it lives in memory only), so
 * reading it once on mount found nothing and the socket never opened — live
 * scores then only arrived through polling. Now it connects as soon as the
 * token is back, reconnects for a different user, and closes on logout.
 */
export function useNotificationSocket() {
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const hasToken = useAuthStore((s) => !!s.accessToken)

  useEffect(() => {
    if (!userId || !hasToken || !tokenStore.get()) return

    if (socketInstance && socketUserId !== userId) closeSocket() // account switch
    if (!socketInstance) openSocket(qc, userId)
    refCount++

    return () => {
      refCount--
      if (refCount <= 0) {
        refCount = 0
        closeSocket()
      }
    }
  }, [userId, hasToken, qc])
}
