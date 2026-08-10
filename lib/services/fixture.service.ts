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
  return data.fixtures
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
export async function endMatch(fixtureId: string): Promise<Fixture> {
  const data = await api.post<{ fixture: Fixture }>(`/fixtures/${fixtureId}/end`)
  return data.fixture
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

// POST /fixtures/:fixtureId/lineups/approve
export async function approveLineup(fixtureId: string, teamId: string): Promise<Lineup> {
  const data = await api.post<{ lineup: Lineup }>(`/fixtures/${fixtureId}/lineups/approve`, { teamId })
  return data.lineup
}

// GET /fixtures/:fixtureId/lineups — PUBLIC
export async function listLineups(fixtureId: string): Promise<any> {
  const data = await api.get<any>(`/fixtures/${fixtureId}/lineups`, { public: true })
  const raw = data?.lineups ?? data

  // Backend returns { homeTeam: {...}, awayTeam: {...} } structure
  if (raw?.homeTeam || raw?.awayTeam) {
    return raw // Return the structured response as-is
  }

  // Fallback: if it's an array (legacy format), return as-is
  return Array.isArray(raw) ? raw : []
}
