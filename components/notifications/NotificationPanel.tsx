'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BellOff, RefreshCw, CheckCheck } from 'lucide-react'
import {
  getInboxNotifications,
  markNotificationRead,
  markAllRead,
  type InboxNotification,
} from '@/lib/services/notifications.service'
import { NotificationItem } from './NotificationItem'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose: _ }: NotificationPanelProps) {
  const qc = useQueryClient()

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['notifications-inbox'],
    queryFn: () => getInboxNotifications(1, 20),
    enabled: open,
    staleTime: 30_000,
  })

  const notifications: InboxNotification[] = data?.notifications ?? []
  const allRead = notifications.length > 0 && notifications.every((n) => n.isRead)

  // ── Optimistic markAsRead (G12) ────────────────────────────────────────────
  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications-inbox'] })
      await qc.cancelQueries({ queryKey: ['notifications-unread-count'] })

      const prevInbox = qc.getQueryData<typeof data>(['notifications-inbox'])
      const prevCount = qc.getQueryData<number>(['notifications-unread-count'])

      qc.setQueryData(['notifications-inbox'], (old: typeof data) => {
        if (!old) return old
        return {
          ...old,
          notifications: old.notifications.map((n) =>
            n._id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, (old.unreadCount ?? 1) - 1),
        }
      })
      qc.setQueryData(['notifications-unread-count'], (old: number = 0) =>
        Math.max(0, old - 1)
      )

      return { prevInbox, prevCount }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevInbox !== undefined)
        qc.setQueryData(['notifications-inbox'], ctx.prevInbox)
      if (ctx?.prevCount !== undefined)
        qc.setQueryData(['notifications-unread-count'], ctx.prevCount)
    },
  })

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  if (!open) return null

  const permissionGranted =
    typeof Notification !== 'undefined' && Notification.permission === 'granted'

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-[#1E2032] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-[11px] font-chakra font-black uppercase tracking-widest text-white">
          Notifications
        </h3>
        <button
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending || allRead}
          className="flex items-center gap-1 text-[10px] font-chakra font-black uppercase text-gaffer-orange disabled:text-white/20 transition-colors"
        >
          <CheckCheck size={12} />
          {markAllMutation.isPending ? '...' : 'Mark all read'}
        </button>
      </div>

      {/* Enable push prompt — only when permission not granted */}
      {!permissionGranted && (
        <button
          onClick={() => Notification.requestPermission()}
          className="w-full px-4 py-2 text-left text-[10px] font-chakra font-black uppercase text-gaffer-orange bg-gaffer-orange/10 hover:bg-gaffer-orange/20 transition-colors"
        >
          Enable push notifications
        </button>
      )}

      {/* Body */}
      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 mx-4 my-2 bg-white/5 rounded-xl animate-pulse" />
          ))
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-8 px-4">
            <p className="text-xs text-white/40 font-chakra uppercase">Failed to load</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-[10px] text-gaffer-orange font-chakra font-black uppercase"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <BellOff size={28} className="text-white/10" />
            <p className="text-[10px] font-chakra font-black uppercase text-white/20">
              You're all caught up
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((n) => (
              <NotificationItem
                key={n._id}
                notification={n}
                onRead={(id) => readMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
