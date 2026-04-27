'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInboxNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  clearAllNotifications,
  getPreferences,
  updatePreferences,
  MUTABLE_EVENT_TYPES,
  type InboxNotification,
} from '@/lib/services/notifications.service'
import {
  ChevronLeft, Bell, BellOff, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, BellRing, Inbox, Settings, Trash2,
} from 'lucide-react'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { useGoBack } from '@/hooks/useGoBack'

type Tab = 'inbox' | 'settings'

const EVENT_LABELS: Record<string, string> = {
  goal: 'Goals',
  own_goal: 'Own Goals',
  penalty_scored: 'Penalties Scored',
  yellow_card: 'Yellow Cards',
  red_card: 'Red Cards',
  substitution: 'Substitutions',
  attempt_missed: 'Missed Attempts',
  penalty_awarded: 'Penalties Awarded',
  penalty_missed: 'Penalties Missed',
  corner: 'Corners',
  halftime: 'Half Time',
  fulltime: 'Full Time',
  match_suspended: 'Match Suspended',
  match_resumed: 'Match Resumed',
}

export default function NotificationsPage() {
  const goBack = useGoBack('/app/dashboard')
  const qc = useQueryClient()
  const toast = useToastStore()
  const [activeTab, setActiveTab] = useState<Tab>('inbox')
  const [showMuteSettings, setShowMuteSettings] = useState(false)
  const { isSubscribed, isPending: isPushPending, toggle: togglePush } = usePushNotifications()

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: inbox, isLoading: isLoadingInbox, isError: isInboxError, refetch: refetchInbox } = useQuery({
    queryKey: ['notifications-inbox'],
    queryFn: () => getInboxNotifications(1, 20),
    enabled: activeTab === 'inbox',
    staleTime: 30_000,
  })

  const { data: prefsData, isLoading: isLoadingPrefs } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences,
    enabled: activeTab === 'settings',
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  // Mark single notification as read — optimistic
  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['notifications-inbox'] })
      await qc.cancelQueries({ queryKey: ['notifications-unread-count'] })
      const prevInbox = qc.getQueryData<typeof inbox>(['notifications-inbox'])
      const prevCount = qc.getQueryData<number>(['notifications-unread-count'])
      qc.setQueryData(['notifications-inbox'], (old: typeof inbox) => {
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

  // Mark all as read — PATCH /notifications/read-all
  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] })
      qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      toast.addToast('All notifications marked as read.', 'success')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  // Delete single notification — DELETE /notifications/:id
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications-inbox'] }),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  // Clear all notifications — DELETE /notifications
  const clearAllMutation = useMutation({
    mutationFn: clearAllNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] })
      toast.addToast('All notifications cleared.', 'success')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  // Preferences mutation
  const prefsMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (res) => qc.setQueryData(['notification-preferences'], res),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const toggleMute = (eventType: string) => {
    const prefs = prefsData?.preferences
    if (!prefs) return
    const current = prefs.mutedEventTypes ?? []
    const next = current.includes(eventType)
      ? current.filter((t) => t !== eventType)
      : [...current, eventType]
    prefsMutation.mutate({ mutedEventTypes: next })
  }

  const notifications: InboxNotification[] = inbox?.notifications ?? []

  return (
    <div className="min-h-screen bg-[#181928] text-white flex flex-col font-inter">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#181928]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 px-6 pt-12 pb-4">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-chakra font-black uppercase tracking-tight">Activity</h1>
            <p className="text-[10px] text-white/30 font-chakra font-bold uppercase tracking-[2px]">
              Notifications & Alerts
            </p>
          </div>
          <div className="flex p-1 bg-white/5 rounded-2xl">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`p-2.5 rounded-xl transition-all ${activeTab === 'inbox' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <Inbox size={18} />
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-24 no-scrollbar">
        <AnimatePresence mode="wait">
          {/* ── INBOX TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'inbox' ? (
            <motion.div
              key="inbox"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Push prompt (only if unsubscribed) */}
              {!isSubscribed && (
                <div className="bg-gaffer-orange/10 border border-gaffer-orange/20 rounded-[32px] p-6 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gaffer-orange/20 flex items-center justify-center shrink-0">
                      <BellRing className="text-gaffer-orange" size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-chakra font-black text-[11px] uppercase tracking-widest text-gaffer-orange">
                        Enable Push Alerts
                      </h4>
                      <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                        Never miss a goal! Get real-time alerts even when the app is closed.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={togglePush}
                    disabled={isPushPending}
                    className="w-full h-12 rounded-2xl bg-gaffer-orange text-white font-chakra font-black text-[11px] uppercase tracking-widest shadow-lg shadow-gaffer-orange/20 active:scale-95 transition-all"
                  >
                    {isPushPending ? 'Syncing...' : 'Activate Now'}
                  </button>
                </div>
              )}

              {/* Notifications feed */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-chakra font-black uppercase tracking-[0.2em] text-white/40">
                    Recent Activity
                  </h3>
                  <div className="flex items-center gap-3">
                    {inbox && inbox.unreadCount > 0 && (
                      <>
                        <span className="text-[9px] font-chakra font-black text-gaffer-orange uppercase">
                          {inbox.unreadCount} Unread
                        </span>
                        {/* Mark all read — PATCH /notifications/read-all */}
                        <button
                          onClick={() => markAllReadMutation.mutate()}
                          disabled={markAllReadMutation.isPending}
                          className="text-[9px] font-chakra font-black text-white/30 uppercase hover:text-gaffer-orange transition-colors"
                        >
                          {markAllReadMutation.isPending ? '...' : 'Mark all read'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {isLoadingInbox ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-white/5 rounded-[24px] animate-pulse" />
                    ))
                  ) : isInboxError ? (
                    <div className="py-16 text-center space-y-4">
                      <AlertCircle className="text-white/20 mx-auto" size={32} />
                      <p className="font-chakra font-black uppercase text-white/20 text-xs tracking-widest">
                        Failed to load notifications
                      </p>
                      <button
                        onClick={() => refetchInbox()}
                        className="text-[10px] font-chakra font-black uppercase text-gaffer-orange"
                      >
                        Retry
                      </button>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="bg-[#1E2032] border border-white/5 rounded-[24px] overflow-hidden divide-y divide-white/5">
                      {notifications.map((n: InboxNotification) => (
                        <NotificationItem
                          key={n._id}
                          notification={n}
                          onRead={(id) => readMutation.mutate(id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <BellOff className="text-white/10" size={32} />
                      </div>
                      <p className="font-chakra font-black uppercase text-white/20 text-xs tracking-widest">
                        No notifications yet
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Clear all — DELETE /notifications */}
              {notifications.length > 0 && (
                <button
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                  className="w-full py-4 rounded-[20px] border border-white/5 text-white/20 font-chakra font-black text-[10px] uppercase tracking-widest hover:border-red-500/30 hover:text-red-400 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Trash2 size={13} />
                  {clearAllMutation.isPending ? 'Clearing...' : 'Clear All Notifications'}
                </button>
              )}
            </motion.div>
          ) : (
            /* ── SETTINGS TAB ───────────────────────────────────────────── */
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Push master switch */}
              <div className="bg-[#1E2032] border border-white/5 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSubscribed ? 'bg-green-500/10' : 'bg-white/5'}`}>
                      {isSubscribed ? <CheckCircle2 className="text-green-500" /> : <BellOff className="text-white/20" />}
                    </div>
                    <div>
                      <h4 className="font-chakra font-black text-xs uppercase tracking-widest">Web Push Delivery</h4>
                      <p className="text-[10px] text-white/30 font-bold uppercase mt-0.5">
                        {isSubscribed ? 'Subscription Active' : 'Not Subscribed'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={togglePush}
                    disabled={isPushPending}
                    className={`w-12 h-6 rounded-full relative transition-all ${isSubscribed ? 'bg-gaffer-orange' : 'bg-white/10'}`}
                  >
                    <motion.div
                      animate={{ x: isSubscribed ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                {/* Following summary */}
                <div className="pt-6 border-t border-white/5 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Matches',  count: prefsData?.preferences.followedMatches?.length ?? 0 },
                    { label: 'Teams',    count: prefsData?.preferences.followedTeams?.length ?? 0 },
                    { label: 'Leagues',  count: prefsData?.preferences.followedCompetitions?.length ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="text-center space-y-1">
                      <p className="text-[16px] font-chakra font-black text-white">{item.count}</p>
                      <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mute preferences */}
              <div className="bg-[#1E2032] border border-white/5 rounded-[32px] overflow-hidden">
                <button
                  onClick={() => setShowMuteSettings(!showMuteSettings)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-4 text-left">
                    <BellOff size={20} className="text-white/40" />
                    <div>
                      <h4 className="font-chakra font-black text-xs uppercase tracking-widest">Mute Events</h4>
                      <p className="text-[10px] text-white/30 font-bold uppercase mt-0.5">Control individual alert types</p>
                    </div>
                  </div>
                  {showMuteSettings ? <ChevronUp size={20} className="text-white/40" /> : <ChevronDown size={20} className="text-white/40" />}
                </button>

                <AnimatePresence>
                  {showMuteSettings && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/5 bg-black/20"
                    >
                      <div className="p-6 space-y-4">
                        {MUTABLE_EVENT_TYPES.map((type) => {
                          const isMuted = prefsData?.preferences.mutedEventTypes?.includes(type)
                          return (
                            <div key={type} className="flex items-center justify-between py-2">
                              <span className="text-[11px] font-chakra font-black uppercase text-white/60">
                                {EVENT_LABELS[type]}
                              </span>
                              <button
                                onClick={() => toggleMute(type)}
                                className={`w-10 h-5 rounded-full relative transition-all ${!isMuted ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                              >
                                <motion.div
                                  animate={{ x: !isMuted ? 20 : 4 }}
                                  className={`absolute top-0.5 w-4 h-4 rounded-full ${!isMuted ? 'bg-green-500' : 'bg-red-500'}`}
                                />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hint */}
              <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 flex items-start gap-4">
                <AlertCircle className="text-gaffer-orange shrink-0" size={18} />
                <p className="text-[10px] text-white/40 font-medium leading-relaxed uppercase tracking-wider">
                  Muted event types will not trigger push notifications even if you follow the match.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
