'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, ChevronLeft } from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'
import { useToast } from '@/store/toastStore'
import { useUIStore } from '@/store/uiStore'


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listFixtures, createFixture, listRounds, Round } from '@/lib/services/fixture.service'
import { listCompetitions, Competition, listCompetitionTeams, CompetitionTeam } from '@/lib/services/competition.service'
import { listOrgs } from '@/lib/services/org.service'
import { listTeams } from '@/lib/services/team.service' // Added listTeams import
import { useAuthStore } from '@/store/authStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { GroupedFixturesView } from '@/components/league/GroupedFixturesView'
import { AdminFixtureRow } from '@/components/admin/AdminFixtureRow'
import { CreateRoundModal } from '@/components/admin/CreateRoundModal'
import { DeciderToggles } from '@/components/admin/DeciderToggles'
import { setRoundDecider, type Decider } from '@/lib/services/fixture.service'

export default function SchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showCreateRoundModal, setShowCreateRoundModal] = useState(false)

  // Schedule form state
  // Selected tournament is seeded from the URL (?competitionId=) rather than
  // always starting blank, and kept in sync back to the URL below — so
  // navigating into a fixture and hitting back restores your selection
  // instead of resetting to the auto-picked default every time.
  const [formCompetitionId, setFormCompetitionId] = useState(() => searchParams.get('competitionId') || '')
  const [formRoundId, setFormRoundId] = useState('')
  const [formHomeTeamId, setFormHomeTeamId] = useState('')
  const [formAwayTeamId, setFormAwayTeamId] = useState('')
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [formTime, setFormTime] = useState('14:00')
  // What settles the match if it ends level. Untouched, a knockout match defaults to penalties and anything else to nothing.
  const [formDecider, setFormDecider] = useState<Decider | null>(null)
  // Two-leg ties: 0 = a single match, 1 = first leg, 2 = second leg (which names the first)
  const [formLeg, setFormLeg] = useState<0 | 1 | 2>(0)
  const [formFirstLegId, setFormFirstLegId] = useState('')

  // 1. Fetch Org
  const { data: orgs, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrgs,
    enabled: !!user,
    throwOnError: false,
  })

  const orgId = orgs?.[0]?._id
  
  // 2. Fetch Competitions - Sort to find the "current/ongoing" one
  const { data: competitions, isLoading: isLoadingComps } = useQuery({
    queryKey: ['competitions', orgId],
    queryFn: () => listCompetitions(orgId!),
    enabled: !!orgId,
    throwOnError: false,
  })

  // Determine the best default competition (Most recent + Live > Published > Draft)
  const sortedComps = (competitions || []).slice().sort((a: any, b: any) => {
    const statusPriority: Record<string, number> = { live: 3, published: 2, draft: 1, completed: 0 }
    const pA = statusPriority[a.status] ?? 0
    const pB = statusPriority[b.status] ?? 0
    if (pA !== pB) return pB - pA
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })

  const competitionId = formCompetitionId || (sortedComps?.[0]?._id as string)

  const selectedComp = competitions?.find(c => c._id === (formCompetitionId || competitionId))
  
  // 3. Fetch Rounds (for selection)
  const { data: rounds } = useQuery({
    queryKey: ['rounds', formCompetitionId],
    queryFn: () => listRounds(formCompetitionId!),
    enabled: !!formCompetitionId
  })

  useEffect(() => {
    if (sortedComps?.length && !formCompetitionId) {
       setFormCompetitionId(sortedComps[0]._id)
    }
  }, [sortedComps, formCompetitionId])

  // Keep the URL's competitionId in sync with the current selection (replace,
  // not push, so switching tournaments doesn't spam browser history) — this
  // is what lets "back" from a fixture restore the tournament you were on.
  useEffect(() => {
    if (!formCompetitionId) return
    if (searchParams.get('competitionId') === formCompetitionId) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('competitionId', formCompetitionId)
    router.replace(`/admin/schedule?${params.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formCompetitionId])

  useEffect(() => {
    if (rounds?.length && !formRoundId) {
       setFormRoundId(rounds[0]._id)
    }
  }, [rounds, formRoundId])

  // Mutate: Create Fixture
  const createFixtureMutation = useMutation({
    mutationFn: (payload: any) => createFixture(payload.competitionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixtures', competitionId] })
      addToast('Game scheduled successfully!', 'success')
      setShowScheduleForm(false)
      setFormHomeTeamId('')
      setFormAwayTeamId('')
      setFormDecider(null)
      setFormLeg(0)
      setFormFirstLegId('')
    },
    onError: (err: any) => {
      addToast(err?.message || 'Failed to schedule game', 'error')
    }
  })

  // 3. Fetch Fixtures
  const { data: backendFixtures, isLoading: isLoadingFixtures } = useQuery({
    queryKey: ['fixtures', competitionId],
    queryFn: () => listFixtures(competitionId!),
    enabled: !!competitionId,
    throwOnError: false,
  })

  // 4. Fetch Teams (specifically for the selected tournament)
  const { data: teams } = useQuery({
    queryKey: ['competition-teams', formCompetitionId],
    queryFn: () => listCompetitionTeams(formCompetitionId!),
    enabled: !!formCompetitionId
  })

  const isEmpty = !backendFixtures?.length || !competitionId

  const formRound = rounds?.find((r: Round) => r._id === formRoundId)
  const formStageType = formRound?.stageType || (selectedComp?.format === 'knockout' ? 'knockout' : selectedComp?.format === 'groups' ? 'groups' : 'league')
  const effectiveDecider: Decider = formDecider ?? { extraTime: false, penalties: formStageType === 'knockout' }
  // First legs this second leg can belong to: same two teams, no second leg yet
  const sameTwoTeams = (f: any) => {
    const h = typeof f.homeTeamId === 'object' ? f.homeTeamId._id : f.homeTeamId
    const a = typeof f.awayTeamId === 'object' ? f.awayTeamId._id : f.awayTeamId
    return [h, a].sort().join() === [formHomeTeamId, formAwayTeamId].sort().join()
  }
  const firstLegChoices = (backendFixtures ?? []).filter((f: any) => f.leg === 1 && sameTwoTeams(f) && !(backendFixtures ?? []).some((g: any) => g.leg === 2 && g.tieId === f.tieId))
  const applyToRound = useMutation({
    mutationFn: () => setRoundDecider(formRoundId, effectiveDecider),
    onSuccess: (r) => { queryClient.invalidateQueries({ queryKey: ['fixtures', competitionId] }); addToast(`Applied to ${r.updated} unplayed ${r.updated === 1 ? 'match' : 'matches'} in this round`, 'success') },
    onError: (err: any) => addToast(err?.message || 'Could not apply to the round', 'error'),
  })

  if (isLoadingOrgs || isLoadingComps || isLoadingFixtures) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181928] pb-32 flex flex-col overflow-x-hidden relative">
      {/* Header */}
      {!showScheduleForm && (
        <div 
          className="flex flex-col gap-4 px-4 md:px-6 mb-8 shrink-0"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-chakra font-black text-white uppercase tracking-tighter">Your Schedule</h1>
            </div>
          </div>
          
          <div className="relative group/select">
            <select
              value={competitionId}
              onChange={(e) => setFormCompetitionId(e.target.value)}
              className="w-full h-12 bg-[#1E2032] border border-white/5 rounded-xl px-4 text-white text-[13px] font-chakra font-black uppercase tracking-widest focus:outline-none appearance-none cursor-pointer transition-all hover:border-[#FF4D00]/30"
            >
              <option value="">Select Tournament</option>
              {sortedComps?.map((c: Competition) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none group-hover/select:text-[#FF4D00]/50 transition-colors" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {showScheduleForm ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 space-y-8"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowScheduleForm(false)}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-chakra font-black text-xl uppercase tracking-tight">Schedule Game</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-4 text-white text-sm focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] text-white/50 font-medium ml-1">Start Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-4 text-white text-sm focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Tournament</label>
                <div className="relative">
                  <select
                    value={formCompetitionId}
                    onChange={(e) => {
                      setFormCompetitionId(e.target.value)
                      setFormRoundId('')
                      setFormHomeTeamId('')
                      setFormAwayTeamId('')
                    }}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select Tournament</option>
                    {sortedComps?.map((c: Competition) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic Round Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[13px] text-white/50 font-medium uppercase tracking-wider">
                    {selectedComp?.format === 'knockout' ? 'Tournament Stage' :
                     selectedComp?.format === 'groups' ? 'Group Stage' :
                     ['round_robin', 'league_knockout'].includes(selectedComp?.format || '') ? 'Matchday' : 'Round'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCreateRoundModal(true)}
                    disabled={!formCompetitionId}
                    className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 hover:bg-orange-500/20 transition-colors disabled:opacity-30"
                    aria-label="Create new round"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={formRoundId}
                    onChange={(e) => setFormRoundId(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select {selectedComp?.format === 'knockout' ? 'Stage' : 'Round'}</option>
                    {rounds?.map((r: Round) => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Home Team</label>
                <div className="relative">
                  <select
                    value={formHomeTeamId}
                    onChange={(e) => setFormHomeTeamId(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select Home Team</option>
                    {teams?.map((t: CompetitionTeam) => (
                      <option key={t.teamId} value={t.teamId}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Away Team</label>
                <div className="relative">
                  <select
                    value={formAwayTeamId}
                    onChange={(e) => setFormAwayTeamId(e.target.value)}
                    className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium"
                  >
                    <option value="">Select Away Team</option>
                    {teams?.map((t: CompetitionTeam) => (
                      <option key={t.teamId} value={t.teamId} disabled={t.teamId === formHomeTeamId}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <DeciderToggles value={effectiveDecider} onChange={setFormDecider} />
                {formRoundId && (
                  <button type="button" onClick={() => applyToRound.mutate()} disabled={applyToRound.isPending} className="text-xs text-white/50 underline hover:text-white">
                    {applyToRound.isPending ? 'Applying…' : 'Use these for every unplayed match in this round'}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Home and away</label>
                <div className="grid grid-cols-3 gap-2">
                  {([[0, 'Single match'], [1, 'First leg'], [2, 'Second leg']] as const).map(([v, label]) => (
                    <button key={v} type="button" onClick={() => { setFormLeg(v); setFormFirstLegId('') }}
                      className={`h-12 rounded-xl text-sm font-semibold border ${formLeg === v ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#1E2032] text-white/70 border-white/5'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {formLeg === 2 && (
                  <div className="relative">
                    <select value={formFirstLegId} onChange={(e) => setFormFirstLegId(e.target.value)} className="w-full h-14 bg-[#1E2032] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none appearance-none font-medium">
                      <option value="">{formHomeTeamId && formAwayTeamId ? (firstLegChoices.length ? 'Pick the first leg' : 'No first leg between these teams yet') : 'Pick both teams first'}</option>
                      {firstLegChoices.map((f: any) => (
                        <option key={f._id} value={f._id}>{`${typeof f.homeTeamId === 'object' ? f.homeTeamId.name : 'Home'} v ${typeof f.awayTeamId === 'object' ? f.awayTeamId.name : 'Away'} · ${new Date(f.kickoffAt).toLocaleDateString()}`}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                )}
                {formLeg > 0 && <p className="text-xs text-white/40 ml-1">Extra time and penalties apply after the second leg, when the two matches together are level.</p>}
              </div>

              <div className="pt-4">
                <GradientButton
                  onClick={async () => {
                    if (!competitionId) {
                      addToast('No competition found. Create a tournament first.', 'error')
                      return
                    }
                    if (!formHomeTeamId || !formAwayTeamId) {
                      addToast('Please select both teams', 'error')
                      return
                    }
                    if (formHomeTeamId === formAwayTeamId) {
                      addToast('Home and away teams must be different', 'error')
                      return
                    }

                    if (formLeg === 2 && !formFirstLegId) {
                      addToast('Pick the first leg this match belongs to', 'error')
                      return
                    }
                    const round = rounds?.find(r => r._id === formRoundId)
                    const payload = {
                      decider: effectiveDecider,
                      ...(formLeg ? { leg: formLeg } : {}),
                      ...(formLeg === 2 ? { tieWithFixtureId: formFirstLegId } : {}),
                      competitionId: formCompetitionId,
                      homeTeamId: formHomeTeamId,
                      awayTeamId: formAwayTeamId,
                      kickoffAt: new Date(`${formDate}T${formTime}`).toISOString(),
                      roundId: formRoundId || undefined,
                      stageType: round?.stageType || (selectedComp?.format === 'knockout' ? 'knockout' : selectedComp?.format === 'groups' ? 'groups' : 'league'),
                      venue: 'Main Stadium',
                    }
                    createFixtureMutation.mutate(payload)
                  }}
                  loading={createFixtureMutation.isPending}
                  className="h-14 w-full rounded-2xl font-chakra font-black text-base uppercase tracking-wider"
                >
                  Schedule Game
                </GradientButton>
              </div>
            </div>
          </motion.div>
        ) : isEmpty ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-10 text-center"
          >
            <h2 className="text-white text-3xl font-chakra font-black mb-4 uppercase leading-tight tracking-tighter">
              What&apos;s up next?
            </h2>
            <p className="text-white/40 text-sm font-medium leading-relaxed max-w-[240px]">
              Manage your schedule for matches, ceremonies, Schedule now and for later
            </p>
          </motion.div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <GroupedFixturesView
              fixtures={backendFixtures}
              compTeams={teams}
              onFixtureClick={(id) => router.push(`/admin/schedule/${id}`)}
              renderRow={(fixture, onClick) => <AdminFixtureRow fixture={fixture} onClick={onClick} />}
            />
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!showScheduleForm && (
        <button 
          onClick={() => setShowScheduleForm(true)}
          className="fixed bottom-32 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FF0000] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(255,138,0,0.4)] z-40 active:scale-95 transition-transform"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}

      {/* Background Blur Overlay for form */}
      <AnimatePresence>
        {showScheduleForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md -z-10"
          />
        )}
      </AnimatePresence>

      {showCreateRoundModal && formCompetitionId && (
        <CreateRoundModal
          competitionId={formCompetitionId}
          format={selectedComp?.format}
          stages={selectedComp?.stages}
          existingRounds={rounds || []}
          onClose={() => setShowCreateRoundModal(false)}
          onCreated={(round) => {
            queryClient.invalidateQueries({ queryKey: ['rounds', formCompetitionId] })
            setFormRoundId(round._id)
            setShowCreateRoundModal(false)
            addToast(`${round.name} created`, 'success')
          }}
        />
      )}
    </div>
  )
}
