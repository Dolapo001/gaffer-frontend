'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTournamentStore } from '@/store/tournamentStore'
import {
  ChevronLeft, Trophy, Users, Calendar, MapPin,
  BarChart2, Edit2, Trash2, AlertCircle,
} from 'lucide-react'

const statusStyles = {
  upcoming:  { bg: 'bg-blue-500/10',  border: 'border-blue-500/30',  text: 'text-blue-400',  label: 'Upcoming'  },
  ongoing:   { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', label: 'Live Now'  },
  completed: { bg: 'bg-gaffer-card',  border: 'border-gaffer-border', text: 'text-gaffer-muted', label: 'Ended' },
}

const sportEmoji: Record<string, string> = {
  football: '⚽', basketball: '🏀', cricket: '🏏', tennis: '🎾', other: '🏆',
}

const MOCK_SCHEDULE = [
  { id: 'm1', home: 'Team Alpha', away: 'Team Beta',  date: 'Mar 20', time: '3:00 PM', venue: 'Main Ground',   homeScore: 2, awayScore: 1, played: true  },
  { id: 'm2', home: 'Team Gamma', away: 'Team Delta', date: 'Mar 21', time: '4:00 PM', venue: 'Ground B',      homeScore: 0, awayScore: 0, played: true  },
  { id: 'm3', home: 'Team Alpha', away: 'Team Gamma', date: 'Mar 25', time: '3:00 PM', venue: 'Main Ground',   homeScore: null, awayScore: null, played: false },
  { id: 'm4', home: 'Team Beta',  away: 'Team Delta', date: 'Mar 26', time: '4:00 PM', venue: 'Ground B',      homeScore: null, awayScore: null, played: false },
]

const STANDINGS = [
  { pos: 1, team: 'Team Alpha', p: 2, w: 2, d: 0, l: 0, gf: 4, ga: 1, pts: 6 },
  { pos: 2, team: 'Team Gamma', p: 2, w: 1, d: 1, l: 0, gf: 3, ga: 1, pts: 4 },
  { pos: 3, team: 'Team Beta',  p: 2, w: 1, d: 0, l: 1, gf: 2, ga: 3, pts: 3 },
  { pos: 4, team: 'Team Delta', p: 2, w: 0, d: 1, l: 1, gf: 1, ga: 4, pts: 1 },
]

type Tab = 'overview' | 'schedule' | 'standings'

export default function TournamentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { tournaments, deleteTournament, updateTournament } = useTournamentStore()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showDelete, setShowDelete] = useState(false)

  const tournament = tournaments.find((t) => t.id === params.id)

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex flex-col items-center justify-center gap-4 px-8">
        <Trophy size={48} className="text-gaffer-subtle" />
        <p className="text-white font-display font-bold text-xl text-center">Tournament not found</p>
        <button onClick={() => router.push('/admin/tournaments')}
          className="px-6 py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm">
          Back to Tournaments
        </button>
      </div>
    )
  }

  const style = statusStyles[tournament.status]
  const progress = Math.round((tournament.registeredTeams / tournament.maxTeams) * 100)

  const handleDelete = () => {
    deleteTournament(tournament.id)
    router.replace('/admin/tournaments')
  }

  const toggleStatus = () => {
    const next = tournament.status === 'upcoming' ? 'ongoing'
      : tournament.status === 'ongoing' ? 'completed' : 'upcoming'
    updateTournament(tournament.id, { status: next })
  }

  return (
    <>
      <div className="min-h-screen bg-gaffer-bg">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gaffer-bg/95 backdrop-blur-md border-b border-gaffer-border/50">
          <div className="flex items-center gap-3 px-4 pt-12 pb-3">
            <button onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white">
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-white text-base truncate">{tournament.name}</h1>
            </div>
            <button onClick={() => setShowDelete(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <Trash2 size={15} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 px-4 pb-0">
            {(['overview', 'schedule', 'standings'] as Tab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative flex-1 py-3 text-xs font-body font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'text-gaffer-orange' : 'text-gaffer-subtle'
                }`}>
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tourney-tab-line"
                    className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-gaffer-orange" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-5 pb-28">
          <AnimatePresence mode="wait">
            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && (
              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Hero card */}
                <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gaffer-surface flex items-center justify-center text-3xl flex-shrink-0">
                      {sportEmoji[tournament.sport] || '🏆'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display font-bold text-xl text-white leading-tight">{tournament.name}</h2>
                      <span className={`inline-flex mt-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Calendar, label: 'Start', value: new Date(tournament.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                      { icon: Calendar, label: 'End',   value: new Date(tournament.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) },
                      { icon: MapPin, label: 'Venue',  value: tournament.location },
                      { icon: BarChart2, label: 'Format', value: tournament.format.replace('+', ' + ') },
                    ].map((item) => (
                      <div key={item.label} className="bg-gaffer-surface rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <item.icon size={12} className="text-gaffer-subtle" />
                          <span className="text-gaffer-subtle text-[10px] font-body uppercase tracking-wide">{item.label}</span>
                        </div>
                        <p className="text-white font-body font-medium text-xs leading-tight">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Capacity bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-gaffer-subtle" />
                        <span className="text-gaffer-muted text-xs font-body">
                          {tournament.registeredTeams} / {tournament.maxTeams} teams
                        </span>
                      </div>
                      <span className="text-gaffer-orange text-xs font-body font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gaffer-surface rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-orange-gradient-btn rounded-full" />
                    </div>
                  </div>
                </div>

                {tournament.description && (
                  <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4">
                    <p className="text-xs font-body font-semibold text-gaffer-muted uppercase tracking-widest mb-2">About</p>
                    <p className="text-white/70 font-body text-sm leading-relaxed">{tournament.description}</p>
                  </div>
                )}

                {/* Status action */}
                <button onClick={toggleStatus}
                  className="w-full py-4 rounded-xl bg-gaffer-card border border-gaffer-border text-white font-body font-medium text-sm hover:border-gaffer-orange/40 transition-all flex items-center justify-center gap-2">
                  <Edit2 size={15} className="text-gaffer-orange" />
                  Mark as {tournament.status === 'upcoming' ? 'Live' : tournament.status === 'ongoing' ? 'Completed' : 'Upcoming'}
                </button>
              </motion.div>
            )}

            {/* ── SCHEDULE ── */}
            {activeTab === 'schedule' && (
              <motion.div key="sc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {MOCK_SCHEDULE.map((match, i) => (
                  <motion.div key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4">
                    {/* Teams row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 text-right">
                        <p className="text-white font-body font-semibold text-sm">{match.home}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-xl ${match.played ? 'bg-gaffer-surface' : 'bg-gaffer-orange/10 border border-gaffer-orange/20'}`}>
                        <p className={`font-display font-black text-base leading-none text-center ${match.played ? 'text-white' : 'text-gaffer-orange'}`}>
                          {match.played ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-body font-semibold text-sm">{match.away}</p>
                      </div>
                    </div>
                    {/* Meta */}
                    <div className="flex items-center gap-3 text-gaffer-subtle text-xs font-body">
                      <div className="flex items-center gap-1"><Calendar size={11} />{match.date}</div>
                      <span>·</span>
                      <span>{match.time}</span>
                      <span>·</span>
                      <div className="flex items-center gap-1"><MapPin size={11} />{match.venue}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ── STANDINGS ── */}
            {activeTab === 'standings' && (
              <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[2rem_1fr_repeat(5,2.5rem)] gap-1 px-4 py-2.5 border-b border-gaffer-border bg-gaffer-surface">
                    {['#', 'Team', 'P', 'W', 'D', 'L', 'Pts'].map((h) => (
                      <span key={h} className="text-gaffer-muted text-[10px] font-body font-semibold uppercase tracking-wide text-center first:text-left">{h}</span>
                    ))}
                  </div>
                  {STANDINGS.map((row, i) => (
                    <motion.div key={row.team} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className={`grid grid-cols-[2rem_1fr_repeat(5,2.5rem)] gap-1 px-4 py-3.5 items-center ${i < STANDINGS.length - 1 ? 'border-b border-gaffer-border' : ''} ${row.pos === 1 ? 'bg-gaffer-orange/5' : ''}`}>
                      <span className={`font-display font-bold text-sm text-center ${row.pos <= 2 ? 'text-gaffer-orange' : 'text-gaffer-muted'}`}>{row.pos}</span>
                      <span className="text-white font-body font-medium text-sm truncate">{row.team}</span>
                      {[row.p, row.w, row.d, row.l, row.pts].map((val, j) => (
                        <span key={j} className={`font-body text-sm text-center ${j === 4 ? 'text-gaffer-orange font-bold' : 'text-gaffer-muted'}`}>{val}</span>
                      ))}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDelete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={() => setShowDelete(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-50 bg-gaffer-surface border border-gaffer-border rounded-3xl p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="font-display font-bold text-white text-lg">Delete Tournament?</h3>
                <p className="text-gaffer-muted text-sm font-body mt-1 leading-relaxed">
                  This will permanently delete <span className="text-white font-medium">{tournament.name}</span> and all its data.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowDelete(false)}
                  className="py-3.5 rounded-xl border border-gaffer-border text-white font-body font-medium text-sm hover:bg-gaffer-card transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="py-3.5 rounded-xl bg-red-500 text-white font-display font-bold text-sm hover:bg-red-600 transition-colors">
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
