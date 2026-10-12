'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listRounds, listFixtures, type Round, type Fixture, penaltiesSuffix } from '@/lib/services/fixture.service'
import { getImageUrl } from '@/lib/api'
import { Trophy, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

// ─── Props ────────────────────────────────────────────────────────────────────

interface TournamentBracketProps {
  competitionId: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTeamId(side: Fixture['homeTeamId']): string {
  return typeof side === 'string' ? side : side?._id ?? ''
}

function toTeamLabel(side: Fixture['homeTeamId']): string {
  if (!side || typeof side === 'string') return 'TBD'
  return side.shortName ?? side.name ?? 'TBD'
}

function toTeamLogo(side: Fixture['homeTeamId']): string | undefined {
  if (!side || typeof side === 'string') return undefined
  return (side as any).logoUrl ?? undefined
}

function toRoundId(fixture: Fixture): string {
  const r = fixture.roundId
  return typeof r === 'string' ? r : r?._id ?? ''
}

/** Returns true if the fixture has kicked off — used for the UX lock overlay. */
function isKickedOff(fixture: Fixture): boolean {
  if (fixture.status !== 'scheduled') return true
  return Date.now() >= new Date(fixture.kickoffAt).getTime()
}

function formatKickoffDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const THIRD_PLACE_RE = /3rd|third[\s-]?place|bronze/i

// ─── Layout constants ────────────────────────────────────────────────────────
// The tree is a two-sided, converging bracket (SofaScore "cup tree" structure):
// each half's rounds narrow toward a shared Final in the middle — Round of 16
// splits into a top half and a bottom half, each independently narrowing
// (top half descending toward the Final, bottom half mirrored below it),
// exactly like a standard single-elimination draw.
//
// Everything is sized in PERCENT of the container width, not fixed pixels, so
// the widest row (e.g. 4 Round-of-16 matches per side) always fits the screen
// with no horizontal scrolling — cards just shrink to fit.

const GAP_PCT = 2.5    // % of container width — horizontal gap between cards in a row
const CONNECTOR_H = 32 // px — vertical space reserved for the connector between rows

function rowWidthPct(count: number, matchPct: number): number {
  const n = Math.max(count, 1)
  return n * matchPct + (n - 1) * GAP_PCT
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * TournamentBracket — C1 implementation
 *
 * Renders a knockout bracket reconstructed purely from existing `Round`/
 * `Fixture` data as a two-sided, converging tree: each pre-final round's
 * matches are split in half — the first half forms a "top" stack narrowing
 * down toward the Final, the second half forms a mirrored "bottom" stack
 * narrowing up toward it from below — with the Final (and, if a round whose
 * name matches /3rd|third place|bronze/i exists, the third-place playoff)
 * shared in the middle. No new backend model required; `stageType ===
 * 'knockout'` rounds are filtered from the standard endpoints, and a round's
 * fixture order is assumed to reflect bracket seeding order (adjacent pairs
 * feed the same next-round match) — the same assumption the connector math
 * already relied on.
 *
 * `teamsRemaining` is derived client-side from completed fixture scores —
 * informational only, see BACKEND_CONTRACT.md §1.
 */
export function TournamentBracket({ competitionId }: TournamentBracketProps) {
  const { data: rounds, isLoading: roundsLoading } = useQuery({
    queryKey: ['rounds', competitionId],
    queryFn: () => listRounds(competitionId),
    enabled: !!competitionId,
  })

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ['fixtures', competitionId],
    queryFn: () => listFixtures(competitionId),
    enabled: !!competitionId,
  })

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (roundsLoading || fixturesLoading) {
    return (
      <div className="bg-black/20 rounded-3xl border border-white/5 p-4 space-y-4 min-h-[280px]">
        {[4, 2, 1].map((count, i) => (
          <div key={i} className="flex justify-center gap-2">
            {Array.from({ length: count }).map((_, j) => (
              <div key={j} className="h-[92px] flex-1 max-w-[100px] bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  // ── Data prep ─────────────────────────────────────────────────────────────

  const knockoutRounds: Round[] = (rounds ?? [])
    .filter((r) => r.stageType === 'knockout')
    .sort((a, b) => a.order - b.order)

  const knockoutFixtures: Fixture[] = (fixtures ?? []).filter(
    (f) => f.stageType === 'knockout',
  )

  // ── Empty state ───────────────────────────────────────────────────────────

  if (knockoutRounds.length === 0) {
    return (
      <div className="py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
        <Trophy
          size={32}
          strokeWidth={1}
          className="mx-auto text-gaffer-subtle mb-3 opacity-20"
        />
        <p className="text-xs font-body text-gaffer-subtle font-bold uppercase tracking-widest">
          No knockout rounds scheduled yet
        </p>
      </div>
    )
  }

  // ── Derive teams-remaining (display-only) ─────────────────────────────────
  // Real elimination tracking requires a backend field — see BACKEND_CONTRACT.md §1.

  const teamsInBracket = new Set<string>()
  const eliminatedTeams = new Set<string>()

  knockoutFixtures.forEach((f) => {
    const homeId = toTeamId(f.homeTeamId)
    const awayId = toTeamId(f.awayTeamId)
    if (homeId) teamsInBracket.add(homeId)
    if (awayId) teamsInBracket.add(awayId)
    if (f.status === 'completed') {
      const winner = f.winnerTeamId ? String(f.winnerTeamId) : null
      if (winner) {
        // Decided by the server: score, extra time, penalties, or the aggregate of a two-leg tie
        if (winner === homeId) eliminatedTeams.add(awayId)
        else if (winner === awayId) eliminatedTeams.add(homeId)
      } else if (f.score.home > f.score.away) eliminatedTeams.add(awayId)
      else if (f.score.away > f.score.home) eliminatedTeams.add(homeId)
      // a level match with no winner yet (e.g. the first leg of a two-leg tie): nobody is out
    }
  })

  const teamsRemaining = Math.max(teamsInBracket.size - eliminatedTeams.size, 0)

  // ── Split into main progression + third-place playoff ────────────────────

  const thirdPlaceRound = knockoutRounds.find((r) => THIRD_PLACE_RE.test(r.name))
  const mainRounds = knockoutRounds.filter((r) => r._id !== thirdPlaceRound?._id)
  const thirdPlaceMatch = thirdPlaceRound
    ? knockoutFixtures.find((f) => toRoundId(f) === thirdPlaceRound._id)
    : undefined

  const mainRoundMatches: Fixture[][] = mainRounds.map((r) =>
    knockoutFixtures.filter((f) => toRoundId(f) === r._id),
  )

  // Find explicit Final round (named "Final" or similar, excluding semi/quarter/3rd)
  const explicitFinalIndex = mainRounds.findIndex(
    (r) => /^final$/i.test(r.name.trim()) || (/final/i.test(r.name) && !/semi|quarter|3rd|third/i.test(r.name)),
  )

  let finalRound: Round | undefined = undefined
  let finalMatch: Fixture | undefined = undefined
  let preFinalRounds: Round[] = []
  let preFinalMatches: Fixture[][] = []

  if (explicitFinalIndex !== -1) {
    finalRound = mainRounds[explicitFinalIndex]
    finalMatch = mainRoundMatches[explicitFinalIndex]?.[0]
    preFinalRounds = mainRounds.slice(0, explicitFinalIndex)
    preFinalMatches = mainRoundMatches.slice(0, explicitFinalIndex)
  } else {
    // No explicit Final round created in DB yet (e.g. only Semifinals/Quarterfinals created so far)
    finalRound = undefined
    finalMatch = undefined
    preFinalRounds = mainRounds
    preFinalMatches = mainRoundMatches
  }

  // First half of each pre-final round narrows down into the Final from
  // above; second half mirrors it, narrowing up into the Final from below.
  const topMatches = preFinalMatches.map((m) => m.slice(0, Math.ceil(m.length / 2)))
  const bottomMatches = preFinalMatches.map((m) => m.slice(Math.ceil(m.length / 2)))
  const hasBottomHalf = bottomMatches.some((m) => m.length > 0)

  // ── Shared canvas coordinate math (all in %, container is always 100%) ────
  // Every row (top-half rows, the Final, bottom-half rows) is centered within
  // the same 100%-wide canvas, sized off the widest row (maxCount cards) so
  // cards shrink to fit any screen with no horizontal scrolling. Connector
  // lines between any two adjacent rows are then computed analytically.

  const allRowCounts = [
    ...topMatches.map((m) => m.length),
    1,
    ...(hasBottomHalf ? bottomMatches.map((m) => m.length) : []),
  ]
  const maxCount = Math.max(...allRowCounts, 1)
  const matchPct = (100 - (maxCount - 1) * GAP_PCT) / maxCount

  // The Final (+ third place) row only ever has 1-2 cards, so it doesn't
  // need to share the cramped width the widest round (e.g. 4-wide Round of
  // 16) forces on every other row — let it use the leftover space and render
  // noticeably bigger, same as the reference. This only changes how wide the
  // cards are drawn; centerXFor(1, 0) below always resolves to 50% regardless
  // of which match-width is passed in, so the connector alignment to/from the
  // Final is unaffected.
  const finalRowCount = 1 + (thirdPlaceMatch ? 1 : 0)
  const rawFinalPct = (100 - (finalRowCount - 1) * GAP_PCT) / finalRowCount
  // Final card is centered at exactly 50% via a left spacer (see render below);
  // if a third-place card sits beside it, both must still fit within the row,
  // i.e. 50 + finalMatchPct/2 + GAP_PCT + finalMatchPct ≤ 100.
  const finalMatchPctMax = thirdPlaceMatch ? (50 - GAP_PCT) / 1.5 : 50
  const finalMatchPct = Math.min(rawFinalPct, matchPct * 1.6, finalMatchPctMax)
  const finalRowSpacerPct = 50 - finalMatchPct / 2 - GAP_PCT

  function centerXFor(count: number, index: number): number {
    const offset = (100 - rowWidthPct(count, matchPct)) / 2
    return offset + index * (matchPct + GAP_PCT) + matchPct / 2
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <p className="text-[10px] font-display font-black text-gaffer-subtle uppercase tracking-widest">
          Knockout Bracket
        </p>
        {teamsInBracket.size > 0 && (
          <span
            className="text-[9px] font-display font-black text-gaffer-orange bg-gaffer-orange/10 px-2.5 py-1 rounded-full border border-gaffer-orange/20 uppercase tracking-wide"
            title="Estimated from completed fixture scores — not an authoritative elimination record. See BACKEND_CONTRACT.md §1."
          >
            ~{teamsRemaining} teams remaining
          </span>
        )}
      </div>

      {/* Fits the screen width — cards shrink rather than scroll horizontally */}
      <div className="overflow-y-auto max-h-[75vh] px-3 py-6">
        <div className="flex flex-col items-center w-full">
          {/* ── Top half: widest round first, narrowing down toward the Final ── */}
          {preFinalRounds.map((round, ri) => {
            const matches = topMatches[ri]
            const nextCount = ri < preFinalRounds.length - 1 ? topMatches[ri + 1].length : 1
            return (
              <div key={`top-${round._id}`} className="w-full flex flex-col items-center">
                <p className="text-[9px] font-display font-black text-white/30 uppercase tracking-[0.15em] mb-2.5">
                  {round.name}
                </p>
                <div className="flex justify-center w-full" style={{ gap: `${GAP_PCT}%` }}>
                  {matches.length === 0 ? (
                    <TBDCard widthPct={matchPct} />
                  ) : (
                    matches.map((f) => <BracketMatch key={f._id} fixture={f} widthPct={matchPct} />)
                  )}
                </div>
                <BracketConnector
                  topCount={matches.length || 1}
                  bottomCount={nextCount}
                  centerXFor={centerXFor}
                />
              </div>
            )
          })}

          {/* ── Final (+ third place, floated beside it) ── */}
          <div className="w-full flex flex-col items-center">
            <p className="text-[9px] font-display font-black text-white/30 uppercase tracking-[0.15em] mb-2.5">
              {finalRound?.name ?? 'Final'}
            </p>
            <div className="flex items-center justify-center gap-3.5 w-full">
              {/* Left Trophy Icon */}
              <div className="flex items-center justify-center shrink-0 pr-1">
                <Trophy size={26} className="text-gaffer-orange drop-shadow-[0_0_12px_rgba(255,107,0,0.6)]" />
              </div>

              {/* Center Final Match Card */}
              {finalMatch ? (
                <BracketMatch fixture={finalMatch} large widthPct={finalMatchPct} />
              ) : (
                <TBDCard widthPct={finalMatchPct} />
              )}

              {/* Right 3rd Place Match Card */}
              {thirdPlaceMatch ? (
                <BracketMatch fixture={thirdPlaceMatch} isThirdPlace large widthPct={finalMatchPct} />
              ) : preFinalRounds.length > 0 ? (
                <TBDCard widthPct={finalMatchPct} isThirdPlace />
              ) : null}
            </div>
          </div>

          {/* ── Bottom half: mirrored, narrowest (closest to Final) first, widening down ── */}
          {hasBottomHalf &&
            preFinalRounds
              .slice()
              .reverse()
              .map((round, revIdx) => {
                const ri = preFinalRounds.length - 1 - revIdx
                const matches = bottomMatches[ri]
                const prevCount = revIdx === 0 ? 1 : bottomMatches[ri + 1].length
                return (
                  <div key={`bottom-${round._id}`} className="w-full flex flex-col items-center">
                    <BracketConnector
                      topCount={prevCount}
                      bottomCount={matches.length || 1}
                      centerXFor={centerXFor}
                    />
                    <p className="text-[9px] font-display font-black text-white/30 uppercase tracking-[0.15em] mb-2.5">
                      {round.name}
                    </p>
                    <div className="flex justify-center w-full" style={{ gap: `${GAP_PCT}%` }}>
                      {matches.length === 0 ? (
                        <TBDCard widthPct={matchPct} />
                      ) : (
                        matches.map((f) => <BracketMatch key={f._id} fixture={f} widthPct={matchPct} />)
                      )}
                    </div>
                  </div>
                )
              })}
        </div>
      </div>
    </div>
  )
}

// ─── BracketConnector ─────────────────────────────────────────────────────────
// Draws the line(s) between two vertically-adjacent rows. Handles all three
// shapes generically from the two rows' match counts:
//  - equal counts (both 1) → a plain straight line (e.g. semifinal ↔ Final)
//  - top = 2 × bottom → a join: pairs above converge into one slot below
//  - bottom = 2 × top → a split: one slot above forks into a pair below
// Mismatched counts (partial/incomplete data) are skipped rather than guessed.

function BracketConnector({
  topCount,
  bottomCount,
  centerXFor,
}: {
  topCount: number
  bottomCount: number
  centerXFor: (count: number, index: number) => number
}) {
  const midY = CONNECTOR_H / 2
  const stroke = 'rgba(255,255,255,0.14)'
  // Coordinates are in % (0-100) on the X axis and px on the Y axis — the
  // viewBox maps 100 units to the container's actual width, and
  // vectorEffect keeps stroke widths at a constant screen size despite the
  // non-uniform X/Y scaling this produces.
  const svgProps = {
    width: '100%',
    height: CONNECTOR_H,
    viewBox: `0 0 100 ${CONNECTOR_H}`,
    preserveAspectRatio: 'none' as const,
    className: 'overflow-visible block',
    'aria-hidden': true as const,
  }
  const lineProps = { stroke, strokeWidth: 1.5, vectorEffect: 'non-scaling-stroke' as const }

  if (topCount === bottomCount) {
    const x = centerXFor(topCount, 0)
    return (
      <svg {...svgProps}>
        <line x1={x} y1={0} x2={x} y2={CONNECTOR_H} {...lineProps} />
      </svg>
    )
  }

  if (topCount === bottomCount * 2) {
    // Join: each pair of matches above converges into one slot below
    return (
      <svg {...svgProps}>
        {Array.from({ length: bottomCount }).map((_, pi) => {
          const x1 = centerXFor(topCount, pi * 2)
          const x2 = centerXFor(topCount, pi * 2 + 1)
          const xm = centerXFor(bottomCount, pi)
          return (
            <g key={pi}>
              <line x1={x1} y1={0} x2={x1} y2={midY} {...lineProps} />
              <line x1={x2} y1={0} x2={x2} y2={midY} {...lineProps} />
              <line x1={x1} y1={midY} x2={x2} y2={midY} {...lineProps} />
              <line x1={xm} y1={midY} x2={xm} y2={CONNECTOR_H} {...lineProps} />
              <circle cx={xm} cy={midY} r={2.5} fill="rgba(255,107,0,0.5)" vectorEffect="non-scaling-stroke" />
            </g>
          )
        })}
      </svg>
    )
  }

  if (bottomCount === topCount * 2) {
    // Split: one slot above forks into a pair below (mirror of the join above)
    return (
      <svg {...svgProps}>
        {Array.from({ length: topCount }).map((_, pi) => {
          const xm = centerXFor(topCount, pi)
          const x1 = centerXFor(bottomCount, pi * 2)
          const x2 = centerXFor(bottomCount, pi * 2 + 1)
          return (
            <g key={pi}>
              <line x1={xm} y1={0} x2={xm} y2={midY} {...lineProps} />
              <line x1={x1} y1={midY} x2={x2} y2={midY} {...lineProps} />
              <line x1={x1} y1={midY} x2={x1} y2={CONNECTOR_H} {...lineProps} />
              <line x1={x2} y1={midY} x2={x2} y2={CONNECTOR_H} {...lineProps} />
              <circle cx={xm} cy={midY} r={2.5} fill="rgba(255,107,0,0.5)" vectorEffect="non-scaling-stroke" />
            </g>
          )
        })}
      </svg>
    )
  }

  // Mismatched counts (incomplete data) — no connector, just spacing.
  return <div style={{ height: CONNECTOR_H }} />
}

// ─── BracketMatch ─────────────────────────────────────────────────────────────

function LogoAvatar({ side, large }: { side: Fixture['homeTeamId']; large?: boolean }) {
  const logoUrl = toTeamLogo(side)
  const label = toTeamLabel(side)
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = logoUrl && !imgFailed

  return (
    <div
      className={`rounded-full overflow-hidden bg-gaffer-surface border border-white/15 flex items-center justify-center shrink-0 ${
        large ? 'w-8 h-8' : 'w-7 h-7'
      }`}
    >
      {showImage ? (
        <img
          src={getImageUrl(logoUrl)}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className={`font-display font-black text-white/70 uppercase leading-none ${large ? 'text-[9px]' : 'text-[8px]'}`}>
          {label.slice(0, 3)}
        </span>
      )}
    </div>
  )
}

function BracketMatch({
  fixture,
  isFinal,
  isThirdPlace,
  widthPct,
  large,
}: {
  fixture: Fixture
  isFinal?: boolean
  isThirdPlace?: boolean
  widthPct: number
  large?: boolean
}) {
  const isCompleted = fixture.status === 'completed'
  const isLive = fixture.status === 'live' || fixture.status === 'halftime'
  const winnerId = fixture.winnerTeamId ? String(fixture.winnerTeamId) : null
  const homeWon = isCompleted && (winnerId ? winnerId === toTeamId(fixture.homeTeamId) : fixture.score.home > fixture.score.away)
  const awayWon = isCompleted && (winnerId ? winnerId === toTeamId(fixture.awayTeamId) : fixture.score.away > fixture.score.home)
  const locked = isKickedOff(fixture)

  const homeLabel = toTeamLabel(fixture.homeTeamId)
  const awayLabel = toTeamLabel(fixture.awayTeamId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex flex-col items-center justify-center gap-1.5 p-2.5 bg-[#181C28] border rounded-2xl shrink-0 min-w-0 max-w-[140px] shadow-lg ${
        isLive ? 'border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.15)]' : 'border-white/10'
      }`}
      style={{ width: `${widthPct}%` }}
    >
      {isFinal && (
        <Trophy size={large ? 22 : 16} className="absolute -left-8 top-1/2 -translate-y-1/2 text-gaffer-orange shrink-0 drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]" />
      )}

      {isLive && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block" />
        </div>
      )}
      {locked && !isLive && !isCompleted && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <Lock size={8} className="text-white/30" />
        </div>
      )}

      {/* Team Columns (Logo Avatar + Centered Team Short Code/Name) */}
      <div className="flex items-start justify-around w-full gap-1">
        {/* Home Team Column */}
        <div className="flex flex-col items-center flex-1 min-w-0 gap-1">
          <LogoAvatar side={fixture.homeTeamId} large={large} />
          <span
            className={`font-display font-black uppercase text-[10px] truncate max-w-full text-center ${
              homeWon ? 'text-white font-black' : isCompleted ? 'text-white/40' : 'text-white/80'
            }`}
            title={homeLabel}
          >
            {homeLabel.slice(0, 4)}
          </span>
        </div>

        {/* Away Team Column */}
        <div className="flex flex-col items-center flex-1 min-w-0 gap-1">
          <LogoAvatar side={fixture.awayTeamId} large={large} />
          <span
            className={`font-display font-black uppercase text-[10px] truncate max-w-full text-center ${
              awayWon ? 'text-white font-black' : isCompleted ? 'text-white/40' : 'text-white/80'
            }`}
            title={awayLabel}
          >
            {awayLabel.slice(0, 4)}
          </span>
        </div>
      </div>

      {/* Bottom: Kickoff Date when scheduled, Live Score when live, or Final Score when completed */}
      {isLive ? (
        <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="font-display font-black tabular-nums text-red-400 text-[11px] tracking-wider">
            {fixture.score?.home ?? 0} : {fixture.score?.away ?? 0}
          </span>
        </div>
      ) : isCompleted ? (
        <span className="font-display font-black tabular-nums text-white text-[12px] tracking-wider bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
          {fixture.score?.home ?? 0} : {fixture.score?.away ?? 0}
          {penaltiesSuffix(fixture) && <span className="ml-1 text-white/60 text-[9px]">{penaltiesSuffix(fixture)}</span>}
        </span>
      ) : (
        <span className="font-chakra font-bold text-white/50 text-[9px] uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
          {formatKickoffDate(fixture.kickoffAt)}
        </span>
      )}
      {isThirdPlace && (
        <span className="text-[7px] font-body font-semibold text-gaffer-subtle/70 uppercase tracking-wide">
          3rd place
        </span>
      )}
    </motion.div>
  )
}

// ─── TBDCard ──────────────────────────────────────────────────────────────────

function TBDCard({ widthPct, isFinal, isThirdPlace }: { widthPct: number; isFinal?: boolean; isThirdPlace?: boolean }) {
  return (
    <div
      className="relative bg-[#181C28] border border-dashed border-white/10 rounded-2xl p-2.5 text-center shrink-0 flex flex-col items-center justify-center min-h-[76px] max-w-[140px]"
      style={{ width: `${widthPct}%` }}
    >
      {isFinal && (
        <Trophy size={18} className="absolute -left-8 top-1/2 -translate-y-1/2 text-gaffer-orange shrink-0 drop-shadow-[0_0_8px_rgba(255,107,0,0.5)]" />
      )}
      <p className="text-[9px] text-gaffer-subtle font-chakra font-bold uppercase tracking-widest">
        {isThirdPlace ? '3rd Place' : 'TBD'}
      </p>
    </div>
  )
}
