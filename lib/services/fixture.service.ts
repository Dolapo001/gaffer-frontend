import { asArray } from '@/lib/asArray'
import { api } from '@/lib/api'
import type { JerseyPattern } from '@/components/jersey/jerseyUtils'
import { mockRounds, mockFixtures } from '@/lib/testing-mocks/premierLeague'
// TODO: REMOVE MOCK DATA BEFORE PROD

// ─── Resolved Kits ────────────────────────────────────────────────────────────
// Provided by the backend when clash-detection has been applied to a fixture.

export interface ResolvedKit {
  primaryColor: string
  secondaryColor: string
  pattern: JerseyPattern
}

export interface ResolvedKits {
  homeKit: ResolvedKit
  awayKit: ResolvedKit
}

// ─── Round ────────────────────────────────────────────────────────────────────

export interface Round {
  _id: string
  competitionId: string
  name: string
  order: number
  stageType: 'groups' | 'knockout' | 'league'
  groupName?: string
  startDate?: string
  endDate?: string
}

export interface Decider {
  extraTime?: boolean
  penalties?: boolean
}

export interface Fixture {
  _id: string
  competitionId: string
  homeTeamId: string | { _id: string; name: string; shortName?: string; handle: string; logoUrl?: string }
  awayTeamId: string | { _id: string; name: string; shortName?: string; handle: string; logoUrl?: string }
  roundId?: string | { _id: string; name: string }
  kickoffAt: string
  stageType: 'groups' | 'knockout' | 'league'
  groupName?: string
  venue?: string
  status: 'scheduled' | 'live' | 'halftime' | 'suspended' | 'completed' | 'postponed' | 'cancelled'
  score: { home: number; away: number }
  startedAt?: string
  completedAt?: string
  homeFormation?: string
  awayFormation?: string
  homeLineup?: Record<string, any>
  awayLineup?: Record<string, any>
  /** What settles the match if it finishes level (chosen when it was scheduled). Unset on older fixtures. */
  decider?: Decider
  /** Where a level knockout match is now: normal time, extra time or the penalty shootout. */
  phase?: 'regular' | 'extra_time' | 'penalties'
  extraTimePlayed?: boolean
  decidedBy?: 'score' | 'extra_time' | 'penalties' | 'aggregate' | null
  /** Two-leg ties: both legs share tieId; leg is 1 or 2. */
  leg?: 1 | 2 | null
  tieId?: string | null
  winnerTeamId?: string | null
  isFinalized?: boolean
  /** Running shootout tally. The kicks come from getShootout. */
  shootout?: { status: 'none' | 'in_progress' | 'completed'; home: number; away: number; firstTeamId?: string | null }
  /** Clash-resolved kit assignments. Present when the backend has processed kit selection. */
  resolvedKits?: ResolvedKits
}

export interface FixtureEvent {
  _id: string
  fixtureId: string
  /** Mapped category returned by listEvents: 'goal' | 'card' | 'sub' | 'general' */
  type: string
  /** Original DB type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'fulltime' | etc. */
  rawType?: string
  /** Always-populated human-readable summary generated server-side */
  description?: string
  minute: number
  teamId: string | { name: string; shortName?: string }
  playerId?: string | { _id: string; firstName: string; jerseyNumber?: number; position?: string }
  assistPlayerId?: string | { _id: string; firstName: string; jerseyNumber?: number; position?: string }
  playerInId?: string | { _id: string; firstName: string; jerseyNumber?: number; position?: string }
  playerOutId?: string | { _id: string; firstName: string; jerseyNumber?: number; position?: string }
  commentaryText?: string
  notes?: string
  playerName?: string
  createdAt: string
}

export interface Lineup {
  _id: string
  fixtureId: string
  teamId: string | { name: string; handle: string }
  starters: string[]
  bench: string[]
  status: 'pending' | 'approved'
  ratings?: Record<string, number>
}

// POST /competitions/:competitionId/rounds
export async function createRound(
  competitionId: string,
  payload: {
    name: string
    order: number
    stageType: 'groups' | 'knockout' | 'league'
    groupName?: string
    startDate?: string
    endDate?: string
  },
): Promise<Round> {
  const data = await api.post<{ round: Round }>(`/competitions/${competitionId}/rounds`, payload)
  return data.round
}

// GET /competitions/:competitionId/rounds
export async function listRounds(competitionId: string): Promise<Round[]> {
  if (!/^[0-9a-fA-F]{24}$/.test(competitionId)) return [];
  const data = await api.get<{ rounds: Round[] }>(`/competitions/${competitionId}/rounds`)
  return data.rounds
}

// PATCH /rounds/:roundId
export async function updateRound(
  roundId: string,
  payload: Partial<{ name: string; order: number; startDate: string; endDate: string }>,
): Promise<Round> {
  const data = await api.patch<{ round: Round }>(`/rounds/${roundId}`, payload)
  return data.round
}

// POST /competitions/:competitionId/fixtures
export async function createFixture(
  competitionId: string,
  payload: {
    homeTeamId: string
    awayTeamId: string
    kickoffAt: string
    stageType: 'groups' | 'knockout' | 'league'
    roundId?: string
    groupName?: string
    venue?: string
    /** Extra time and/or penalties if the match finishes level. */
    decider?: Decider
    /** Two-leg ties: 1 or 2; the second leg names the first leg's fixture. */
    leg?: 1 | 2
    tieWithFixtureId?: string
  },
): Promise<Fixture> {
  const data = await api.post<{ fixture: Fixture }>(`/competitions/${competitionId}/fixtures`, payload)
  return data.fixture
}

// GET /competitions/:competitionId/fixtures — PUBLIC
export async function listFixtures(
  competitionId: string,
  params?: { status?: string; roundId?: string },
): Promise<Fixture[]> {
  if (!/^[0-9a-fA-F]{24}$/.test(competitionId)) return [];
  const qs = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString()
    : ''
  const data = await api.get<{ fixtures: Fixture[] }>(`/competitions/${competitionId}/fixtures${qs}`, { public: true })
  return asArray<Fixture>(data.fixtures)
}

// POST /competitions/:competitionId/fixtures/generate
export async function generateFixtures(
  competitionId: string,
  payload: {
    type: 'round_robin' | 'knockout'
    startDate: string
    kickoffTime?: string
    venue?: string
    groupName?: string
  },
): Promise<{ message: string; roundsCreated: number; fixturesCreated: number }> {
  return api.post(`/competitions/${competitionId}/fixtures/generate`, payload)
}

// GET /fixtures/:fixtureId — PUBLIC
export async function getFixture(fixtureId: string): Promise<Fixture> {
  const data = await api.get<{ fixture: Fixture }>(`/fixtures/${fixtureId}`, { public: true })
  return data.fixture
}

// PATCH /fixtures/:fixtureId
export async function updateFixture(
  fixtureId: string,
  payload: Partial<Fixture> & { roundId?: string; kickoffAt?: string; venue?: string; status?: string },
): Promise<Fixture> {
  const data = await api.patch<{ fixture: Fixture }>(`/fixtures/${fixtureId}`, payload)
  return data.fixture
}

// DELETE /fixtures/:fixtureId
export async function deleteFixture(fixtureId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/fixtures/${fixtureId}`)
}

// POST /fixtures/:fixtureId/start
export async function startMatch(fixtureId: string): Promise<Fixture> {
  const data = await api.post<{ fixture: Fixture }>(`/fixtures/${fixtureId}/start`)
  return data.fixture
}

// POST /fixtures/:fixtureId/end
/**
 * Ends the current period. A level knockout match does not finish here: it moves to extra time, then to the
 * shootout. `minute` is when extra time ended (optional).
 */
export async function endMatch(fixtureId: string, minute?: number): Promise<Fixture> {
  const data = await api.post<{ fixture: Fixture }>(`/fixtures/${fixtureId}/end`, minute ? { minute } : undefined)
  return data.fixture
}

// ── Penalty shootout ─────────────────────────────────────────────────────────

export type KickResult = 'scored' | 'missed' | 'saved'

export interface ShootoutKick {
  _id: string
  order: number
  teamId: string
  takerId?: { _id: string; firstName: string; lastName: string; jerseyNumber?: number } | string | null
  goalkeeperId?: { _id: string; firstName: string; lastName: string } | string | null
  result: KickResult
}

export interface Shootout {
  status: 'none' | 'in_progress' | 'completed'
  phase?: 'regular' | 'extra_time' | 'penalties'
  home: number
  away: number
  homeTaken: number
  awayTaken: number
  finished: boolean
  winner: 'home' | 'away' | null
  suddenDeath: boolean
  /** The team whose turn it is; null before the first kick (the admin picks who goes first). */
  nextTeamId: string | null
  firstTeamId: string | null
  kicks: ShootoutKick[]
}

// GET /fixtures/:fixtureId/shootout — PUBLIC
export async function getShootout(fixtureId: string): Promise<Shootout> {
  const data = await api.get<{ shootout: Shootout }>(`/fixtures/${fixtureId}/shootout`, { public: true })
  return data.shootout
}

// POST /fixtures/:fixtureId/shootout/kicks
export async function addShootoutKick(
  fixtureId: string,
  payload: { teamId: string; takerId?: string; goalkeeperId?: string; result: KickResult },
): Promise<Shootout> {
  const data = await api.post<{ shootout: Shootout }>(`/fixtures/${fixtureId}/shootout/kicks`, payload)
  return data.shootout
}

// PATCH /fixtures/:fixtureId/shootout/kicks/:kickId
export async function updateShootoutKick(
  fixtureId: string,
  kickId: string,
  payload: { takerId?: string | null; goalkeeperId?: string | null; result?: KickResult },
): Promise<Shootout> {
  const data = await api.patch<{ shootout: Shootout }>(`/fixtures/${fixtureId}/shootout/kicks/${kickId}`, payload)
  return data.shootout
}

// DELETE /fixtures/:fixtureId/shootout/kicks/:kickId
export async function deleteShootoutKick(fixtureId: string, kickId: string): Promise<Shootout> {
  const data = await api.delete<{ shootout: Shootout }>(`/fixtures/${fixtureId}/shootout/kicks/${kickId}`)
  return data.shootout
}

// DELETE /fixtures/:fixtureId/shootout — start the shootout over
export async function clearShootout(fixtureId: string): Promise<Shootout> {
  const data = await api.delete<{ shootout: Shootout }>(`/fixtures/${fixtureId}/shootout`)
  return data.shootout
}

// POST /rounds/:roundId/decider — apply extra time / penalties to every match in the round that has not started
export async function setRoundDecider(roundId: string, decider: Decider): Promise<{ updated: number }> {
  return api.post<{ updated: number }>(`/rounds/${roundId}/decider`, decider)
}

/** "(4-3 pens)" for a match a shootout decided, else an empty string. Shown next to the score. */
export function penaltiesSuffix(f: Pick<Fixture, 'decidedBy' | 'shootout'> | null | undefined): string {
  if (!f || f.decidedBy !== 'penalties' || !f.shootout) return ''
  return `(${f.shootout.home}-${f.shootout.away} pens)`
}

/** What the match is doing beyond normal time: shown as a badge on the live match. */
export function phaseLabel(f: Pick<Fixture, 'phase' | 'status'> | null | undefined): string | null {
  if (!f || f.status === 'completed') return null
  if (f.phase === 'extra_time') return 'EXTRA TIME'
  if (f.phase === 'penalties') return 'PENALTIES'
  return null
}

// POST /fixtures/:fixtureId/cancel-live — set live fixture back to scheduled
export async function cancelLive(fixtureId: string): Promise<Fixture> {
  const data = await api.post<{ fixture: Fixture }>(`/fixtures/${fixtureId}/cancel-live`)
  return data.fixture
}

// POST /fixtures/:fixtureId/events (legacy)
export async function recordEvent(
  fixtureId: string,
  payload: {
    type: string
    minute: number
    teamId: string
    playerId?: string
    relatedPlayerId?: string
    assistPlayerId?: string
    playerInId?: string
    playerOutId?: string
    commentaryText?: string
    notes?: string
  },
): Promise<FixtureEvent> {
  const data = await api.post<{ event: FixtureEvent }>(`/fixtures/${fixtureId}/events`, payload)
  return data.event
}

// GET /fixtures/:fixtureId/events — PUBLIC
export async function listEvents(fixtureId: string): Promise<FixtureEvent[]> {
  const data = await api.get<{ events: FixtureEvent[] }>(`/fixtures/${fixtureId}/events`, { public: true })
  return data.events
}

// POST /fixtures/:fixtureId/lineups
export async function submitLineup(
  fixtureId: string,
  payload: { teamId: string; starters: string[]; bench?: string[]; slots?: any[] },
): Promise<Lineup> {
  const data = await api.post<{ lineup: Lineup }>(`/fixtures/${fixtureId}/lineups`, payload)
  return data.lineup
}

/**
 * What the admin's Save button does: submit the lineup and confirm it in the same step.
 * Fans only see confirmed lineups, and kick-off warns when a team has none, so a saved but
 * unconfirmed lineup looked like it had not been saved at all. A helper who is only allowed to
 * submit (not confirm) leaves it waiting for a manager.
 */
export async function saveLineup(
  fixtureId: string,
  payload: { teamId: string; starters: string[]; bench?: string[]; slots?: any[] },
): Promise<Lineup> {
  const lineup = await submitLineup(fixtureId, payload)
  try {
    return await approveLineup(fixtureId, payload.teamId)
  } catch (err: any) {
    if (err?.status === 403 || err?.code === 'FORBIDDEN') return lineup
    throw err
  }
}

// POST /fixtures/:fixtureId/lineups/approve
export async function approveLineup(fixtureId: string, teamId: string): Promise<Lineup> {
  const data = await api.post<{ lineup: Lineup }>(`/fixtures/${fixtureId}/lineups/approve`, { teamId })
  return data.lineup
}

// GET /fixtures/:fixtureId/lineups — public read of APPROVED lineups; the token
// (sent when logged in) lets org staff also see pending ones in the match console
export async function listLineups(fixtureId: string): Promise<any> {
  const data = await api.get<any>(`/fixtures/${fixtureId}/lineups`)
  const raw = data?.lineups ?? data

  // Backend returns { homeTeam: {...}, awayTeam: {...} } structure
  if (raw?.homeTeam || raw?.awayTeam) {
    return raw // Return the structured response as-is
  }

  // Fallback: if it's an array (legacy format), return as-is
  return Array.isArray(raw) ? raw : []
}

/**
 * Names of the teams without an APPROVED lineup for this fixture (admin view:
 * GET /fixtures/:id/lineups returns pending ones too, each side with a status).
 * Used to warn before kickoff: fantasy minutes, appearance and clean-sheet
 * points all come from approved lineups.
 */
export async function teamsWithoutApprovedLineup(
  fixtureId: string,
  names: { home: string; away: string },
): Promise<string[]> {
  const lineups = await listLineups(fixtureId).catch(() => null)
  const approved = (side: any) => side?.status === 'approved' && (side?.players?.length ?? 0) > 0
  const missing: string[] = []
  // Anything but the { homeTeam, awayTeam } shape means we can't confirm either side
  if (!lineups || Array.isArray(lineups)) return [names.home, names.away]
  if (!approved(lineups.homeTeam)) missing.push(names.home)
  if (!approved(lineups.awayTeam)) missing.push(names.away)
  return missing
}
