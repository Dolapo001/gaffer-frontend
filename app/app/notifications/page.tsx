'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPreferences,
  updatePreferences,
  MUTABLE_EVENT_TYPES,
} from '@/lib/services/notifications.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import {
  ChevronLeft,
  Bell,
  BellOff,
  Settings,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Mute Toggle ─────────────────────────────────────────────────────────────

function EventMuteRow({
  eventType,
  muted,
  onToggle,
}: {
  eventType: string
  muted: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gaffer-border/40 last:border-0">
      <span className="text-white text-sm font-body">
        {EVENT_LABELS[eventType] ?? eventType}
      </span>
      <button
        onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-all relative ${
          muted ? 'bg-gaffer-border' : 'bg-gaffer-orange'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
            muted ? '' : 'translate-x-5'
          }`}
        />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter()
  const toast = useToastStore()
  const queryClient = useQueryClient()
  const [showMuteSettings, setShowMuteSettings] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences,
  })

  const prefs = data?.preferences

  const mutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (res) => {
      queryClient.setQueryData(['notification-preferences'], res)
    },
    onError: (err) => {
      toast.addToast({ type: 'error', message: getErrorMessage(err) })
    },
  })

  const toggleEnabled = () => {
    if (!prefs) return
    mutation.mutate({ enabled: !prefs.enabled })
  }

  const toggleMute = (eventType: string) => {
    if (!prefs) return
    const current = prefs.mutedEventTypes ?? []
    const next = current.includes(eventType)
      ? current.filter((t) => t !== eventType)
      : [...current, eventType]
    mutation.mutate({ mutedEventTypes: next })
  }

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-gaffer-border">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-white text-base">Notifications</h1>
        </div>
        <Settings size={18} className="text-gaffer-muted" />
      </div>

      <div className="flex-1 overflow-y-auto pb-12 space-y-4 px-4 pt-4">
        {/* Master toggle */}
        <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center">
              <Bell size={18} className="text-gaffer-orange" />
            </div>
            <div>
              <p className="text-white font-body font-medium text-sm">Push Notifications</p>
              <p className="text-gaffer-muted text-xs font-body">
                {prefs?.enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="w-10 h-5 bg-gaffer-border rounded-full animate-pulse" />
          ) : (
            <button
              onClick={toggleEnabled}
              disabled={mutation.isPending}
              className={`w-10 h-5 rounded-full transition-all relative disabled:opacity-50 ${
                prefs?.enabled ? 'bg-gaffer-orange' : 'bg-gaffer-border'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${
                  prefs?.enabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          )}
        </div>

        {/* Event type muting */}
        {prefs?.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setShowMuteSettings((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-gaffer-border"
            >
              <div className="flex items-center gap-3">
                <BellOff size={16} className="text-gaffer-muted" />
                <span className="text-white font-body font-medium text-sm">Mute Event Types</span>
              </div>
              {showMuteSettings ? (
                <ChevronUp size={16} className="text-gaffer-muted" />
              ) : (
                <ChevronDown size={16} className="text-gaffer-muted" />
              )}
            </button>

            <AnimatePresence>
              {showMuteSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 overflow-hidden"
                >
                  <p className="text-gaffer-muted text-xs font-body py-3">
                    Muted events will not trigger push notifications.
                  </p>
                  {MUTABLE_EVENT_TYPES.map((type) => (
                    <EventMuteRow
                      key={type}
                      eventType={type}
                      muted={(prefs?.mutedEventTypes ?? []).includes(type)}
                      onToggle={() => toggleMute(type)}
                    />
                  ))}
                  <div className="h-3" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Followed items summary */}
        {prefs && (
          <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 space-y-3">
            <p className="text-white font-body font-medium text-sm">Following</p>
            {[
              { label: 'Matches', count: prefs.followedMatches?.length ?? 0 },
              { label: 'Teams', count: prefs.followedTeams?.length ?? 0 },
              { label: 'Competitions', count: prefs.followedCompetitions?.length ?? 0 },
            ].map(({ label, count }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-gaffer-muted text-sm font-body">{label}</span>
                <span className="text-gaffer-orange font-display font-bold text-sm">{count}</span>
              </div>
            ))}
            <p className="text-gaffer-subtle text-xs font-body">
              Follow/unfollow from match, team, or competition pages.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 bg-gaffer-card border border-gaffer-border rounded-2xl animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
