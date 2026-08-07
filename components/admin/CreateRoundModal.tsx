'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { GradientButton } from '@/components/GradientButton'
import { createRound, type Round } from '@/lib/services/fixture.service'
import type { Stage } from '@/lib/services/competition.service'

const KNOCKOUT_ORDER = ['round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'final'] as const
const KNOCKOUT_LABELS: Record<string, string> = {
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarterfinal: 'Quarterfinal',
  semifinal: 'Semifinal',
  final: 'Final',
}

// Formats that mix a league/group phase with a knockout phase — these are
// the only ones that need to ask "which kind of round is this?" up front.
const HYBRID_FORMATS = new Set(['group_knockout', 'league_knockout', 'league_playoff'])

interface CreateRoundModalProps {
  competitionId: string
  format?: string
  stages?: Stage[]
  existingRounds: Round[]
  onClose: () => void
  onCreated: (round: Round) => void
}

type Phase = 'league' | 'knockout' | 'custom'

export function CreateRoundModal({ competitionId, format, stages, existingRounds, onClose, onCreated }: CreateRoundModalProps) {
  const isHybrid = HYBRID_FORMATS.has(format || '')
  const isPureKnockout = format === 'knockout'
  const isGroups = format === 'groups'
  const isCustomFormat = format === 'custom' || !format

  // Single-phase formats already imply the phase — only hybrids need the choice screen.
  const impliedPhase: Phase | null = isPureKnockout
    ? 'knockout'
    : isCustomFormat
      ? 'custom'
      : !isHybrid
        ? 'league' // round_robin, groups (leagueStageType handles the 'groups' distinction below)
        : null
  const [phase, setPhase] = useState<Phase | null>(impliedPhase)

  const leagueStageType: 'groups' | 'league' = isGroups ? 'groups' : 'league'
  const leagueLabel = isGroups ? 'Group Round' : 'Matchday'
  const leagueCount = existingRounds.filter((r) => r.stageType === leagueStageType).length
  const suggestedLeagueName = `${leagueLabel} ${leagueCount + 1}`
  const [leagueName, setLeagueName] = useState('')

  const knockoutStartingRound = stages?.find((s) => s.type === 'knockout')?.startingRound
  const knockoutOptions = useMemo(() => {
    const startIdx = knockoutStartingRound ? KNOCKOUT_ORDER.indexOf(knockoutStartingRound as (typeof KNOCKOUT_ORDER)[number]) : 0
    const order = startIdx >= 0 ? KNOCKOUT_ORDER.slice(startIdx) : KNOCKOUT_ORDER
    const existingNames = new Set(existingRounds.filter((r) => r.stageType === 'knockout').map((r) => r.name))
    return order.map((k) => KNOCKOUT_LABELS[k]).filter((label) => !existingNames.has(label))
  }, [knockoutStartingRound, existingRounds])
  const [knockoutName, setKnockoutName] = useState('')

  const [customName, setCustomName] = useState('')
  const [customStageType, setCustomStageType] = useState<'league' | 'groups' | 'knockout'>('league')

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    let name = ''
    let stageType: 'league' | 'groups' | 'knockout' = 'league'
    if (phase === 'league') {
      name = leagueName.trim() || suggestedLeagueName
      stageType = leagueStageType
    } else if (phase === 'knockout') {
      name = knockoutName
      stageType = 'knockout'
    } else if (phase === 'custom') {
      name = customName.trim()
      stageType = customStageType
    }
    if (!name) {
      setError('Please choose or enter a name for this round')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const round = await createRound(competitionId, {
        name,
        order: existingRounds.length + 1,
        stageType,
      })
      onCreated(round)
    } catch (err: any) {
      setError(err?.message || 'Failed to create round')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
      // Bottom-anchor above the fixed admin nav bar (64px + safe area, z-index
      // 100) instead of behind/underneath it — see components/BottomNavbar.tsx.
      style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="w-full md:max-w-md bg-[#1E2032] border border-white/10 rounded-t-3xl md:rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-chakra font-black text-lg uppercase tracking-tight">New Round</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {phase === null && (
          <div className="space-y-3">
            <p className="text-white/50 text-sm">What kind of round is this?</p>
            <button
              onClick={() => setPhase('league')}
              className="w-full h-14 rounded-2xl bg-[#181928] border border-white/10 text-white font-medium text-sm hover:border-orange-500/50 transition-colors"
            >
              {leagueLabel}
            </button>
            <button
              onClick={() => setPhase('knockout')}
              className="w-full h-14 rounded-2xl bg-[#181928] border border-white/10 text-white font-medium text-sm hover:border-orange-500/50 transition-colors"
            >
              Knockout Stage
            </button>
          </div>
        )}

        {phase === 'league' && (
          <div className="space-y-2">
            <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">{leagueLabel} Name</label>
            <input
              type="text"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              placeholder={suggestedLeagueName}
              className="w-full h-14 bg-[#181928] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none font-medium"
            />
          </div>
        )}

        {phase === 'knockout' && (
          <div className="space-y-2">
            <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Knockout Stage</label>
            {knockoutOptions.length === 0 ? (
              <p className="text-white/40 text-sm">All knockout stages for this tournament have already been created.</p>
            ) : (
              <div className="space-y-2">
                {knockoutOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setKnockoutName(opt)}
                    className={`w-full h-12 rounded-xl border text-sm font-medium transition-colors ${
                      knockoutName === opt ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-white/10 text-white/70'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === 'custom' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Round Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Matchday 4"
                className="w-full h-14 bg-[#181928] border border-white/5 rounded-2xl px-6 text-white text-sm focus:outline-none font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] text-white/50 font-medium ml-1 uppercase tracking-wider">Type</label>
              <div className="flex gap-2">
                {(['league', 'groups', 'knockout'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setCustomStageType(st)}
                    className={`flex-1 h-11 rounded-xl border text-xs font-bold uppercase transition-colors ${
                      customStageType === st ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-white/10 text-white/60'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        {phase !== null && (
          <div className="flex gap-3 pt-2">
            {isHybrid && (
              <button
                onClick={() => setPhase(null)}
                className="h-12 px-5 rounded-xl border border-white/10 text-white/60 text-sm font-medium"
              >
                Back
              </button>
            )}
            <GradientButton onClick={handleCreate} loading={isSaving} className="flex-1 h-12 rounded-xl font-chakra font-black text-sm uppercase tracking-wider">
              Create Round
            </GradientButton>
          </div>
        )}
      </div>
    </div>
  )
}
