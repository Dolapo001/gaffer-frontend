'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Trophy, Users, Calendar, MapPin,
  BarChart2, Trash2, Star, Pencil, Check, LayoutGrid, Plus, Copy,
  RefreshCw, Settings, Share2
} from 'lucide-react'

const slugify = (text: string) => text.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '')
import { getCompetition, deleteCompetition, publishCompetition, listCompetitionTeams, registerTeams, type CompetitionTeam } from '@/lib/services/competition.service'
import { api } from '@/lib/api'
import { listTeams } from '@/lib/services/team.service'
import { listFixtures, type Fixture } from '@/lib/services/fixture.service'
import { getStandings } from '@/lib/services/standings.service'
import {
  getTeamPricing,
  validateTeamPricing,
  finalizeTeamPricing,
  finalizeAllPricing,
} from '@/lib/services/fantasy.service'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage, getImageUrl } from '@/lib/api'
import { FantasyAdminPanel } from '@/components/admin/FantasyAdminPanel'
import { EditTournamentModal } from '@/components/tournament/EditTournamentModal'
import { RecordEventModal } from '@/components/admin/RecordEventModal'

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
  const [showEdit, setShowEdit] = useState(false)
  const [pricingStatus, setPricingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [pricingMessage, setPricingMessage] = useState('')
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedEnrollTeam, setSelectedEnrollTeam] = useState('')
  const [activeFixtureForEvent, setActiveFixtureForEvent] = useState<Fixture | null>(null)
  const { hideNavbar, showNavbar } = useUIStore() // Added this line

  useEffect(() => {
    if (showEnrollModal) {
      hideNavbar()
      document.body.setAttribute('data-nav-hidden', 'true')
    } else {
      showNavbar()
      document.body.removeAttribute('data-nav-hidden')
    }
    return () => {
      showNavbar()
      document.body.removeAttribute('data-nav-hidden')
    }
  }, [showEnrollModal, hideNavbar, showNavbar]) // Added this useEffect block

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

  const { data: teamPricingData } = useQuery({
    queryKey: ['team-pricing', id],
    queryFn: () => getTeamPricing(id),
    enabled: activeTab === 'fantasy',
  })

  const { data: compTeams } = useQuery({
    queryKey: ['competition-teams', id],
    queryFn: () => listCompetitionTeams(id),
  })

  const { data: orgTeams } = useQuery({
    queryKey: ['org-teams', competition?.orgId],
    queryFn: () => {
      const orgId = typeof competition?.orgId === 'object'
        ? (competition.orgId as any)._id
        : competition?.orgId;
      return listTeams(orgId!);
    },
    enabled: !!competition?.orgId && showEnrollModal,
  })

  // Filter out teams already in the competition
  const availableTeams = orgTeams?.filter(ot =>
    !compTeams?.some(ct => ct.teamId === ot._id)
  ) || []

  const enrollMutation = useMutation({
    mutationFn: (teamId: string) => registerTeams(id, [{ teamId }]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competition-teams', id] })
      toast.addToast('Team enrolled successfully', 'success')
      setShowEnrollModal(false)
      setSelectedEnrollTeam('')
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCompetition(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competitions'] })
      toast.addToast('Tournament deleted', 'success')
      router.replace('/admin/tournaments')
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const publishMutation = useMutation({
    mutationFn: () => publishCompetition(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['competition', id] })
      toast.addToast('Tournament published successfully!', 'success')
      router.push(`/admin/tournaments/${id}/success`)
    },
    onError: (err: unknown) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const handleFinalizePricing = async () => {
    const teams = (teamPricingData as { teams?: { id: string }[] } | null)?.teams ?? []
    setPricingStatus('loading')
    setPricingMessage('')
    try {
      // Validate each team first
      for (const team of teams) {
        const result = await validateTeamPricing(id, team.id)
        if (!result.valid) {
          setPricingStatus('error')
          setPricingMessage(`Validation failed: ${(result.errors ?? ['Unknown error']).join(', ')}`)
          return
        }
      }
      // Finalize each team
      for (const team of teams) {
        await finalizeTeamPricing(id, team.id)
      }
      // Global finalize
      await finalizeAllPricing(id)
      setPricingStatus('success')
      setPricingMessage('All pricing finalized successfully')
      qc.invalidateQueries({ queryKey: ['team-pricing', id] })
    } catch (err: unknown) {
      setPricingStatus('error')
      setPricingMessage(getErrorMessage(err))
    }
  }

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
          className="px-4 md:px-6 py-3 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm">
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
      <div className="min-h-screen bg-gaffer-bg" data-nav-hidden={showEdit || showDelete ? 'true' : undefined}>
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
          <div className="flex gap-8 px-4 md:px-6 pb-0 overflow-x-auto no-scrollbar">
            {(['overview', 'schedule', 'standings', 'fantasy'] as Tab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative py-3 text-[11px] font-display font-bold uppercase tracking-[0.1em] transition-all duration-300 ${activeTab === tab ? 'text-gaffer-orange' : 'text-gaffer-subtle hover:text-white/80'
                  }`}>
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tourney-tab-line"
                    className="absolute bottom-0 inset-x-0 h-0.5 rounded-full bg-gaffer-orange shadow-[0_0_8px_rgba(255,107,0,0.4)]" />
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
                {/* ── UNIFIED TOURNAMENT CARD ── */}
                <div className="bg-gaffer-card border border-gaffer-border rounded-[32px] overflow-hidden shadow-2xl">
                  {/* Banner/Header */}
                  <div className="bg-gradient-to-br from-[#2D304E] to-[#1E2032] p-6 relative">
                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 backdrop-blur-sm">
                        {competition.bannerUrl ? (
                          <img src={getImageUrl(competition.bannerUrl)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl text-gaffer-orange/40">🏆</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-display font-black uppercase tracking-widest border ${competition.status === 'draft' ? 'bg-white/5 border-white/10 text-gaffer-subtle' :
                              'bg-gaffer-orange/10 border-gaffer-orange/20 text-gaffer-orange'
                            }`}>
                            {competition.status}
                          </span>
                        </div>
                        <h1 className="text-2xl font-display font-black text-white uppercase tracking-tight leading-tight truncate">
                          {competition.name}
                        </h1>
                      </div>
                    </div>

                    {/* Buttons Row */}
                    <div className="relative z-10 grid grid-cols-2 gap-3 mt-5">
                      {competition.status === 'draft' && (
                        <button
                          onClick={() => {
                            if (confirm('Are you ready to publish this tournament? This will make it publicly visible.')) {
                              publishMutation.mutate()
                            }
                          }}
                          disabled={publishMutation.isPending}
                          className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-4 bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white rounded-2xl text-[11px] font-chakra font-black uppercase tracking-[0.2em] hover:scale-[1.01] transition-all shadow-[0_10px_30px_rgba(231,0,11,0.3)] active:scale-[0.98] mb-1"
                        >
                          {publishMutation.isPending ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <>
                              <Check size={14} className="shrink-0" />
                              <span>Publish Tournament</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setShowEdit(true)}
                        className="flex items-center justify-center gap-1.5 px-3 py-3 bg-gaffer-orange text-white rounded-xl text-[9px] font-chakra font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,107,0,0.2)]"
                      >
                        <Pencil size={12} className="shrink-0" />
                        <span className="truncate">Edit Tourney</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Recalculate all stats and standings? This may take a moment.')) {
                            api.post(`/tournaments/${id}/rebuild`, {}).then(() => {
                              toast.addToast('Tournament stats rebuilt successfully', 'success')
                              qc.invalidateQueries({ queryKey: ['standings', id] })
                            }).catch(err => toast.addToast(getErrorMessage(err), 'error'))
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-3 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded-xl text-[9px] font-chakra font-black uppercase tracking-widest transition-all hover:bg-white/10"
                      >
                        <RefreshCw size={12} className="text-gaffer-orange shrink-0" />
                        <span className="truncate">Recalculate</span>
                      </button>
                    </div>
                  </div>

                  {/* Info Grid - Sleek & Compact */}
                  <div className="p-6 grid grid-cols-2 gap-px bg-gaffer-border/30">
                    {[
                      { icon: Calendar, label: 'Start Date', value: formatDate(competition.startDate) },
                      { icon: Calendar, label: 'End Date', value: formatDate(competition.endDate) },
                      { icon: Star, label: 'Competition', value: competition.sport },
                      { icon: Users, label: 'Category', value: competition.gender },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-gaffer-card p-4 first:rounded-tl-xl last:rounded-br-xl">
                        <div className="flex items-center gap-2 text-gaffer-subtle mb-1">
                          <item.icon size={12} strokeWidth={2.5} />
                          <span className="text-[10px] font-display font-black uppercase tracking-widest opacity-60">{item.label}</span>
                        </div>
                        <p className="text-sm font-body font-bold text-white uppercase">{item.value}</p>
                      </div>
                    ))}
                    <div className="col-span-2 bg-gaffer-card p-4 border-t border-gaffer-border/30">
                      <div className="flex items-center gap-2 text-gaffer-orange mb-1">
                        <LayoutGrid size={12} strokeWidth={2.5} />
                        <span className="text-[10px] font-display font-black uppercase tracking-widest opacity-60">Structure</span>
                      </div>
                      <p className="text-sm font-body font-bold text-white uppercase">
                        {competition.format?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── SHARE INFO (If Published) ── */}
                {competition.status !== 'draft' && (
                  <motion.div
                    key="share-section"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gaffer-card border border-gaffer-border rounded-[24px] p-6 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-gaffer-orange/10 flex items-center justify-center">
                        <Share2 size={12} className="text-gaffer-orange" />
                      </div>
                      <h3 className="font-display font-black text-[10px] text-white uppercase tracking-[0.2em] opacity-80">Share & Invite</h3>
                    </div>

                    <div className="space-y-4">
                      {/* Public Link Section */}
                      <div className="group relative">
                        <label className="block text-[8px] font-display font-black text-gaffer-subtle uppercase tracking-[0.25em] mb-2 ml-1 opacity-50">Tournament Join Link</label>
                        <div className="flex items-center gap-3 bg-gaffer-surface border border-gaffer-border rounded-xl pl-4 pr-3 py-3 hover:border-gaffer-orange/30 transition-all shadow-inner">
                          <p className="text-[11px] text-white/60 font-medium truncate flex-1 font-body">
                            {typeof window !== 'undefined' ? `${window.location.origin}/app/${slugify(competition.name)}/${competition.joinCode}` : `/app/${slugify(competition.name)}/${competition.joinCode}`}
                          </p>
                          <button 
                            onClick={() => {
                              const url = typeof window !== 'undefined' ? `${window.location.origin}/app/${slugify(competition.name)}/${competition.joinCode}` : `/app/${slugify(competition.name)}/${competition.joinCode}`
                              navigator.clipboard.writeText(url)
                              toast.addToast('Link copied!', 'success')
                            }}
                            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gaffer-orange/10 flex items-center justify-center text-white/40 hover:text-gaffer-orange border border-white/5 hover:border-gaffer-orange/20 transition-all active:scale-90"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Join Code Section */}
                      <div className="group relative">
                        <label className="block text-[8px] font-display font-black text-gaffer-subtle uppercase tracking-[0.25em] mb-2 ml-1 opacity-50">Invitation Code</label>
                        <div className="flex items-center gap-3 bg-gaffer-surface border border-gaffer-border rounded-xl pl-4 pr-3 py-3 hover:border-gaffer-orange/30 transition-all shadow-inner">
                          <div className="flex-1">
                            <p className={`text-xl font-chakra font-black tracking-[0.25em] ${competition.joinCode ? 'text-white' : 'text-white/10'}`}>
                              {competition.joinCode || 'PENDING'}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              if (competition.joinCode) {
                                navigator.clipboard.writeText(competition.joinCode)
                                toast.addToast('Code copied!', 'success')
                              } else {
                                toast.addToast('Wait for code to generate...', 'info')
                              }
                            }}
                            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gaffer-orange/10 flex items-center justify-center text-white/40 hover:text-gaffer-orange border border-white/5 hover:border-gaffer-orange/20 transition-all active:scale-90"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        {!competition.joinCode && competition.status === 'published' && (
                          <p className="text-[9px] text-gaffer-orange/60 font-medium mt-2 ml-1 italic opacity-80">Generation failed. Contact support.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── ROSTER LIST ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2 mb-4">
                    <h3 className="font-display font-black text-[11px] text-gaffer-subtle uppercase tracking-widest">
                      Tournament Roster
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowEnrollModal(true)}
                        className="text-[9px] font-display font-black text-gaffer-orange bg-gaffer-orange/10 px-3 py-1.5 rounded-full border border-gaffer-orange/20 uppercase hover:bg-gaffer-orange/20 transition-all active:scale-95"
                      >
                        Enroll Existing Team
                      </button>
                      <div className="text-[9px] font-body font-black text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-tighter">
                        {compTeams?.length || 0} teams
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {compTeams?.map((tm) => {
                      const isAssigned = !!tm.groupName
                      return (
                        <div key={tm._id} className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                          <div className="w-12 h-12 rounded-xl bg-gaffer-surface border border-gaffer-border p-2.5 shrink-0">
                            <img src={getImageUrl(tm.logoUrl) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tm.name}`} alt="" className="w-full h-full object-contain" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-body font-bold text-sm text-white truncate uppercase">{tm.name}</p>
                              {tm.seed && <span className="text-[9px] font-display font-black text-gaffer-subtle">#{tm.seed}</span>}
                            </div>
                            <p className="text-[11px] font-body text-gaffer-muted">@{tm.handle}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="bg-gaffer-surface border border-gaffer-border rounded-xl px-4 py-2 flex flex-col items-center justify-center min-w-[70px]">
                              <p className="font-display font-black text-sm text-white leading-none">
                                {tm.playerCount || 0}
                                <span className="text-gaffer-subtle font-body font-bold text-[10px] ml-1">/ {tm.maxPlayers || 25}</span>
                              </p>
                              <p className="text-[8px] font-display font-black text-gaffer-subtle uppercase tracking-widest mt-1 opacity-60">Players</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
                                const compName = slugify(competition?.name || 'tournament')
                                const groupName = tm.groupName && tm.groupName !== 'unassigned' ? slugify(tm.groupName) : null
                                const teamHandle = tm.handle || tm.teamId
                                const link = groupName ? `${baseUrl}/${compName}/${groupName}/${teamHandle}` : `${baseUrl}/${compName}/${teamHandle}`
                                navigator.clipboard.writeText(link)
                                toast.addToast(`Recruitment link for ${tm.name} copied!`, 'success')
                              }}
                              className="w-10 h-10 rounded-xl bg-gaffer-surface border border-gaffer-border flex items-center justify-center text-gaffer-subtle hover:text-white transition-all shadow-lg active:scale-95 group"
                              title="Copy recruitment link"
                            >
                              <Copy size={16} className="group-hover:text-gaffer-orange transition-colors" />
                            </button>
                          </div>
                        </div>
                      )
                    })}

                    {(!compTeams || compTeams.length === 0) && (
                      <div className="py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Users size={32} strokeWidth={1} className="mx-auto text-gaffer-subtle mb-3 opacity-20" />
                        <p className="text-xs font-body text-gaffer-subtle font-bold uppercase tracking-widest">No teams registered yet</p>
                      </div>
                    )}
                  </div>
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
                            className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 cursor-pointer hover:border-gaffer-orange/40 transition-all group"
                            onClick={() => setActiveFixtureForEvent(f)}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-1 text-right">
                                <p className="text-white font-body font-semibold text-sm truncate">{teamLabel(f.homeTeamId)}</p>
                              </div>
                              <div className="px-3 py-1 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20">
                                <p className="font-display font-black text-base leading-none text-center text-gaffer-orange">vs</p>
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-body font-semibold text-sm truncate">{teamLabel(f.awayTeamId)}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-gaffer-subtle text-[11px] font-body">
                                <div className="flex items-center gap-1 font-black uppercase tracking-widest"><Calendar size={11} />{date}</div>
                                <span className="opacity-20">·</span>
                                <span className="font-black uppercase tracking-widest">{time}</span>
                              </div>
                              <span className="text-[10px] text-gaffer-orange font-chakra font-black uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">Record Event &rarr;</span>
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
        title="Delete Tournament?"
        message={`This will permanently delete "${competition.name}" and all its related records.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
      />

      <AnimatePresence>
        {showEdit && (
          <EditTournamentModal
            competition={competition}
            onClose={() => setShowEdit(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEnrollModal && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-12 sm:pb-24">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEnrollModal(false)} />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="relative w-full max-w-lg bg-[#1C2130] rounded-t-[40px] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Enroll Team</h3>
                <button onClick={() => setShowEnrollModal(false)} className="text-gaffer-subtle hover:text-white"><Plus className="rotate-45" size={24} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-display font-black text-gaffer-subtle uppercase tracking-widest mb-2 block">Available Teams</label>
                  <select
                    value={selectedEnrollTeam}
                    onChange={(e) => setSelectedEnrollTeam(e.target.value)}
                    className="w-full h-14 bg-[#181928] border border-white/5 rounded-2xl px-4 md:px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select an existing team</option>
                    {availableTeams.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                    {availableTeams.length === 0 && <option value="" disabled>No more teams available for enrollment</option>}
                  </select>
                </div>

                <button
                  disabled={!selectedEnrollTeam || enrollMutation.isPending}
                  onClick={() => enrollMutation.mutate(selectedEnrollTeam)}
                  className="w-full py-4 bg-orange-gradient-btn text-white font-display font-black text-base uppercase tracking-wider rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Team'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeFixtureForEvent && (
          <RecordEventModal
            fixtureId={activeFixtureForEvent._id}
            homeTeam={{
              id: typeof activeFixtureForEvent.homeTeamId === 'string' ? activeFixtureForEvent.homeTeamId : activeFixtureForEvent.homeTeamId._id,
              name: teamLabel(activeFixtureForEvent.homeTeamId),
            }}
            awayTeam={{
              id: typeof activeFixtureForEvent.awayTeamId === 'string' ? activeFixtureForEvent.awayTeamId : activeFixtureForEvent.awayTeamId._id,
              name: teamLabel(activeFixtureForEvent.awayTeamId),
            }}
            onClose={() => setActiveFixtureForEvent(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
