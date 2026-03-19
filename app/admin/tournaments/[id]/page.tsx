'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Trophy, Users, Calendar, MapPin,
  BarChart2, Trash2,
} from 'lucide-react'
import { getCompetition, archiveCompetition } from '@/lib/services/competition.service'
import { listFixtures, type Fixture } from '@/lib/services/fixture.service'
import { getStandings } from '@/lib/services/standings.service'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { FantasyAdminPanel } from '@/components/admin/FantasyAdminPanel'

function teamLabel(side: Fixture['homeTeamId']) {
  if (typeof side === 'string') return 'TBD'
  return side.shortName ?? side.name
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatKickoff(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }
}

type Tab = 'overview' | 'schedule' | 'standings' | 'fantasy'

export default function TournamentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const qc = useQueryClient()
  const toast = useToastStore()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showDelete, setShowDelete] = useState(false)

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition', id],
    queryFn: () => getCompetition(id),
  })

  const { data: fixtures } = useQuery({
    queryKey: ['fixtures', id],
    queryFn: () => listFixtures(id),
    enabled: activeTab === 'schedule',
  })

  const { data: standingsData } = useQuery({
    queryKey: ['standings', id],
    queryFn: () => getStandings(id),
    enabled: activeTab === 'standings',
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveCompetition(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competitions'] })
      toast.addToast('Tournament archived', 'success')
      router.replace('/admin/tournaments')
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-gaffer-orange border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!competition) {
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

  const standings = standingsData?.standings ?? []
  const allFixtures = fixtures ?? []
  const completed = allFixtures.filter((f) => f.status === 'completed')
  const upcoming = allFixtures.filter((f) => f.status !== 'completed')

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
              <h1 className="font-display font-bold text-white text-base truncate">{competition.name}</h1>
            </div>
            <button onClick={() => setShowDelete(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <Trash2 size={15} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 px-4 pb-0 overflow-x-auto no-scrollbar">
            {(['overview', 'schedule', 'standings', 'fantasy'] as Tab[]).map((tab) => (
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
                <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gaffer-surface flex items-center justify-center text-3xl flex-shrink-0">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-display font-bold text-xl text-white leading-tight">{competition.name}</h2>
                      <span className={`inline-flex mt-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded-full border capitalize ${
                        competition.status === 'published'
                          ? 'text-green-400 bg-green-400/10 border-green-400/30'
                          : competition.status === 'archived'
                          ? 'text-gaffer-subtle bg-gaffer-card border-gaffer-border'
                          : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
                      }`}>
                        {competition.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Calendar, label: 'Start', value: formatDate(competition.startDate) },
                      { icon: Calendar, label: 'End', value: formatDate(competition.endDate) },
                      { icon: BarChart2, label: 'Sport', value: competition.sport },
                      { icon: Users, label: 'Gender', value: competition.gender },
                    ].map((item) => (
                      <div key={item.label} className="bg-gaffer-surface rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <item.icon size={12} className="text-gaffer-subtle" />
                          <span className="text-gaffer-subtle text-[10px] font-body uppercase tracking-wide">{item.label}</span>
                        </div>
                        <p className="text-white font-body font-medium text-xs leading-tight capitalize">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {competition.format && (
                    <div className="bg-gaffer-surface rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin size={12} className="text-gaffer-subtle" />
                        <span className="text-gaffer-subtle text-[10px] font-body uppercase tracking-wide">Format</span>
                      </div>
                      <p className="text-white font-body font-medium text-xs">{competition.format}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SCHEDULE ── */}
            {activeTab === 'schedule' && (
              <motion.div key="sc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {upcoming.length > 0 && (
                  <div>
                    <p className="text-gaffer-muted text-[10px] font-body uppercase tracking-widest mb-2">Upcoming</p>
                    <div className="space-y-3">
                      {upcoming.map((f, i) => {
                        const { date, time } = formatKickoff(f.kickoffAt)
                        return (
                          <motion.div key={f._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-1 text-right">
                                <p className="text-white font-body font-semibold text-sm">{teamLabel(f.homeTeamId)}</p>
                              </div>
                              <div className="px-3 py-1 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20">
                                <p className="font-display font-black text-base leading-none text-center text-gaffer-orange">vs</p>
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-body font-semibold text-sm">{teamLabel(f.awayTeamId)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-gaffer-subtle text-xs font-body">
                              <div className="flex items-center gap-1"><Calendar size={11} />{date}</div>
                              <span>·</span>
                              <span>{time}</span>
                              {f.venue && <><span>·</span><div className="flex items-center gap-1"><MapPin size={11} />{f.venue}</div></>}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {completed.length > 0 && (
                  <div>
                    <p className="text-gaffer-muted text-[10px] font-body uppercase tracking-widest mb-2">Results</p>
                    <div className="space-y-3">
                      {completed.map((f, i) => (
                        <motion.div key={f._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                          className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 text-right">
                              <p className="text-white font-body font-semibold text-sm">{teamLabel(f.homeTeamId)}</p>
                            </div>
                            <div className="px-3 py-1 rounded-xl bg-gaffer-surface">
                              <p className="font-display font-black text-base leading-none text-center text-white">
                                {f.score.home} - {f.score.away}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-body font-semibold text-sm">{teamLabel(f.awayTeamId)}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {allFixtures.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-gaffer-muted text-sm font-body">No fixtures scheduled yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STANDINGS ── */}
            {activeTab === 'standings' && (
              <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {standings.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gaffer-muted text-sm font-body">No standings data yet</p>
                  </div>
                ) : (
                  <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[2rem_1fr_repeat(5,2.5rem)] gap-1 px-4 py-2.5 border-b border-gaffer-border bg-gaffer-surface">
                      {['#', 'Team', 'P', 'W', 'D', 'L', 'Pts'].map((h) => (
                        <span key={h} className="text-gaffer-muted text-[10px] font-body font-semibold uppercase tracking-wide text-center first:text-left">{h}</span>
                      ))}
                    </div>
                    {standings.map((row, i) => (
                      <motion.div key={row.teamId._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                        className={`grid grid-cols-[2rem_1fr_repeat(5,2.5rem)] gap-1 px-4 py-3.5 items-center ${i < standings.length - 1 ? 'border-b border-gaffer-border' : ''} ${i === 0 ? 'bg-gaffer-orange/5' : ''}`}>
                        <span className={`font-display font-bold text-sm text-center ${i < 2 ? 'text-gaffer-orange' : 'text-gaffer-muted'}`}>{i + 1}</span>
                        <span className="text-white font-body font-medium text-sm truncate">{row.teamId.name}</span>
                        {[row.played, row.won, row.drawn, row.lost, row.points].map((val, j) => (
                          <span key={j} className={`font-body text-sm text-center ${j === 4 ? 'text-gaffer-orange font-bold' : 'text-gaffer-muted'}`}>{val}</span>
                        ))}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {/* ── FANTASY ── */}
            {activeTab === 'fantasy' && (
              <motion.div key="fy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FantasyAdminPanel competitionId={id} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Archive Tournament?"
        message={`This will archive "${competition.name}" and remove it from active tournaments.`}
        confirmLabel="Archive"
        destructive
        onConfirm={() => archiveMutation.mutate()}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}
