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
  ChevronLeft, Bell, BellOff, CheckCircle2, Trophy, Flame, AlertCircle,
  ChevronDown, ChevronUp, BellRing, Inbox, Settings, Trash2, X,
} from 'lucide-react'
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
  const { data: inbox, isLoading: isLoadingInbox } = useQuery({
    queryKey: ['notifications-inbox'],
    queryFn: () => getInboxNotifications(1),
    enabled: activeTab === 'inbox',
  })

  const { data: prefsData, isLoading: isLoadingPrefs } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences,
    enabled: activeTab === 'settings',
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  // Mark single notification as read
  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications-inbox'] }),
  })

  // Mark all as read — PATCH /notifications/read-all
  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-inbox'] })
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'match_event': return <Flame className="text-gaffer-orange" size={20} />
      case 'league':      return <Trophy className="text-yellow-500" size={20} />
      case 'system':      return <AlertCircle className="text-blue-500" size={20} />
      default:            return <Bell className="text-white/40" size={20} />
    }
  }

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
                  ) : notifications.length > 0 ? (
                    notifications.map((n: InboxNotification) => (
                      <div
                        key={n._id}
                        className={`w-full bg-[#1E2032] border border-white/5 rounded-[24px] p-5 flex items-start gap-4 transition-all relative ${
                          !n.read ? 'border-l-4 border-l-gaffer-orange bg-gaffer-orange/5' : 'opacity-40'
                        }`}
                      >
                        {/* Tap to mark read */}
                        <button
                          className="absolute inset-0 rounded-[24px]"
                          onClick={() => !n.read && readMutation.mutate(n._id)}
                          aria-label="Mark as read"
                        />
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 relative z-10 pointer-events-none">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 space-y-1 relative z-10 pointer-events-none">
                          <h4 className="font-chakra font-black text-sm uppercase leading-tight tracking-tight text-white">
                            {n.title}
                          </h4>
                          <p className="text-xs text-white/40 font-medium leading-normal line-clamp-2">
                            {n.body}
                          </p>
                          <span className="text-[9px] text-white/20 font-black uppercase inline-block pt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {/* Delete single notification — DELETE /notifications/:id */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMutation.mutate(n._id)
                          }}
                          className="relative z-10 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                          aria-label="Delete notification"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))
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
