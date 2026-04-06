'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useGoBack } from '@/hooks/useGoBack'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInboxNotifications,
  markNotificationRead,
  markAllRead,
  clearAllNotifications,
  type InboxNotification,
} from '@/lib/services/notifications.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import {
  ChevronLeft, Bell, BellOff, Trophy, Zap, Newspaper, X, Trash2,
} from 'lucide-react'

type NotifType = 'match_event' | 'league' | 'system' | string

const notifMeta = (type: NotifType) => {
  switch (type) {
    case 'match_event': return { icon: Zap,       color: 'text-green-400',     bg: 'bg-green-400/10'     }
    case 'league':      return { icon: Trophy,    color: 'text-yellow-400',    bg: 'bg-yellow-400/10'    }
    case 'system':      return { icon: Newspaper, color: 'text-gaffer-muted',  bg: 'bg-gaffer-card'      }
    default:            return { icon: Bell,       color: 'text-gaffer-muted',  bg: 'bg-gaffer-card'      }
  }
}

export default function AdminNotificationsPage() {
  const goBack = useGoBack('/admin')
  const qc = useQueryClient()
  const toast = useToastStore()

  // ── Fetch inbox — GET /notifications ──────────────────────────────────────
  const { data: inbox, isLoading } = useQuery({
    queryKey: ['admin-notifications-inbox'],
    queryFn: () => getInboxNotifications(1),
    staleTime: 30_000,
  })

  const notifications: InboxNotification[] = inbox?.notifications ?? []
  const unreadCount = inbox?.unreadCount ?? 0

  // ── Mark single read — PATCH /notifications/:id/read ──────────────────────
  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-notifications-inbox'] }),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  // ── Mark all read — PATCH /notifications/read-all ─────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications-inbox'] })
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  // ── Clear all — DELETE /notifications ─────────────────────────────────────
  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications-inbox'] })
      toast.addToast('All notifications cleared.', 'success')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-gaffer-border">
        <button
          onClick={goBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-white text-base">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-gaffer-orange text-xs font-body">{unreadCount} unread</p>
          )}
        </div>
        {/* Mark all read — PATCH /notifications/read-all */}
        {notifications.length > 0 && unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="text-gaffer-orange text-xs font-body font-medium hover:underline disabled:opacity-50"
          >
            {markAllReadMutation.isPending ? '...' : 'Mark all read'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* Loading skeleton */}
        {isLoading ? (
          <div className="divide-y divide-gaffer-border">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4">
                <div className="w-10 h-10 rounded-xl bg-gaffer-card animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gaffer-card rounded animate-pulse w-2/3" />
                  <div className="h-2.5 bg-gaffer-card rounded animate-pulse w-full" />
                  <div className="h-2 bg-gaffer-card rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
            <div className="w-16 h-16 rounded-2xl bg-gaffer-card border border-gaffer-border flex items-center justify-center">
              <BellOff size={28} className="text-gaffer-subtle" />
            </div>
            <div className="text-center">
              <p className="text-white font-body font-medium">No notifications</p>
              <p className="text-gaffer-muted text-sm font-body mt-1">You&apos;re all caught up!</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <div className="divide-y divide-gaffer-border">
              {notifications.map((notif, i) => {
                const meta = notifMeta(notif.type)
                const Icon = meta.icon
                return (
                  <motion.div
                    key={notif._id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className={`w-full flex items-start gap-3 px-4 py-4 transition-colors ${!notif.read ? 'bg-gaffer-surface/40' : ''}`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon size={18} className={meta.color} />
                    </div>

                    {/* Content — tap to mark read */}
                    <button
                      onClick={() => !notif.read && readMutation.mutate(notif._id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-body font-semibold text-sm leading-tight ${notif.read ? 'text-white/70' : 'text-white'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-gaffer-orange mt-1" />
                        )}
                      </div>
                      <p className="text-gaffer-muted text-xs font-body mt-1 leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="text-gaffer-subtle text-[10px] font-body mt-1.5">
                        {new Date(notif.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Clear all — DELETE /notifications */}
        {notifications.length > 0 && (
          <div className="px-4 pt-4">
            <button
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
              className="w-full py-3 rounded-xl border border-gaffer-border text-gaffer-muted font-body text-sm flex items-center justify-center gap-2 hover:border-red-500/30 hover:text-red-400 transition-all disabled:opacity-40"
            >
              <Trash2 size={14} />
              {clearAllMutation.isPending ? 'Clearing...' : 'Clear all notifications'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
