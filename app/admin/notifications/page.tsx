'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Bell, BellOff, Trophy, Users, Newspaper, Zap, Trash2 } from 'lucide-react'
import {
  getInboxNotifications,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
  type InboxNotification,
} from '@/lib/services/notifications.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const notifIcons: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  match:      { icon: Zap,       color: 'text-green-400',     bg: 'bg-green-400/10'     },
  transfer:   { icon: Users,     color: 'text-blue-400',      bg: 'bg-blue-400/10'      },
  league:     { icon: Trophy,    color: 'text-yellow-400',    bg: 'bg-yellow-400/10'    },
  tournament: { icon: Trophy,    color: 'text-gaffer-orange', bg: 'bg-gaffer-orange/10' },
  system:     { icon: Newspaper, color: 'text-gaffer-muted',  bg: 'bg-gaffer-card'      },
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToastStore()

  const { data: inbox, isLoading } = useQuery({
    queryKey: ['notifications-inbox'],
    queryFn: () => getInboxNotifications(1),
  })

  const notifications: InboxNotification[] = inbox?.notifications ?? []
  const unreadCount = inbox?.unreadCount ?? 0

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications-inbox'] }),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications-inbox'] }),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const clearMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] })
      toast.addToast('All notifications cleared', 'info')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-gaffer-border">
        <button onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-white text-base">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-gaffer-orange text-xs font-body">{unreadCount} unread</p>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-gaffer-orange text-xs font-body font-medium hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-gaffer-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
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
                const meta = notifIcons[notif.type] ?? notifIcons.system
                return (
                  <motion.div
                    key={notif._id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-gaffer-surface ${!notif.read ? 'bg-gaffer-surface/40' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <meta.icon size={18} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-body font-semibold text-sm leading-tight ${notif.read ? 'text-white/70' : 'text-white'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-gaffer-orange mt-1" />}
                      </div>
                      <p className="text-gaffer-muted text-xs font-body mt-1 leading-relaxed line-clamp-2">{notif.body}</p>
                      <p className="text-gaffer-subtle text-[10px] font-body mt-1.5">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(notif._id)}
                      disabled={deleteMutation.isPending}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gaffer-subtle hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}
        {notifications.length > 0 && (
          <div className="px-4 pt-4">
            <button
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              className="w-full py-3 rounded-xl border border-gaffer-border text-gaffer-muted font-body text-sm hover:border-red-500/30 hover:text-red-400 transition-all"
            >
              {clearMutation.isPending ? 'Clearing...' : 'Clear all notifications'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
