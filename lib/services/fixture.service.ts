import { api } from '@/lib/api'

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
}

export interface FixtureEvent {
  _id: string
  fixtureId: string
  type: string
  minute: number
  teamId: string | { name: string; shortName?: string }
  playerId?: string | { firstName: string; lastName: string; jerseyNumber?: number; position?: string }
  relatedPlayerId?: string
  notes?: string
  createdAt: string
}

export interface Lineup {
  _id: string
  fixtureId: string
  teamId: string | { name: string; handle: string }
  starters: string[]
  bench: string[]
  status: 'pending' | 'approved'
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
  return api.post<Round>(`/competitions/${competitionId}/rounds`, payload)
}

// GET /competitions/:competitionId/rounds
export async function listRounds(competitionId: string): Promise<Round[]> {
  return api.get<Round[]>(`/competitions/${competitionId}/rounds`)
}

// PATCH /rounds/:roundId
export async function updateRound(
  roundId: string,
  payload: Partial<{ name: string; order: number; startDate: string; endDate: string }>,
): Promise<Round> {
  return api.patch<Round>(`/rounds/${roundId}`, payload)
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
  return api.post<Fixture>(`/competitions/${competitionId}/fixtures`, payload)
}

// GET /competitions/:competitionId/fixtures — PUBLIC
export async function listFixtures(
  competitionId: string,
  params?: { status?: string; roundId?: string },
): Promise<Fixture[]> {
  const qs = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]).toString()
    : ''
  return api.get<Fixture[]>(`/competitions/${competitionId}/fixtures${qs}`, { public: true })
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
  return api.get<Fixture>(`/fixtures/${fixtureId}`, { public: true })
}

// PATCH /fixtures/:fixtureId
export async function updateFixture(
  fixtureId: string,
  payload: { roundId?: string; kickoffAt?: string; venue?: string; status?: string },
): Promise<Fixture> {
  return api.patch<Fixture>(`/fixtures/${fixtureId}`, payload)
}

// DELETE /fixtures/:fixtureId
export async function deleteFixture(fixtureId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/fixtures/${fixtureId}`)
}

// POST /fixtures/:fixtureId/start
export async function startMatch(fixtureId: string): Promise<Fixture> {
  return api.post<Fixture>(`/fixtures/${fixtureId}/start`)
}

// POST /fixtures/:fixtureId/end
export async function endMatch(fixtureId: string): Promise<Fixture> {
  return api.post<Fixture>(`/fixtures/${fixtureId}/end`)
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
    notes?: string
  },
): Promise<FixtureEvent> {
  return api.post<FixtureEvent>(`/fixtures/${fixtureId}/events`, payload)
}

// GET /fixtures/:fixtureId/events — PUBLIC
export async function listEvents(fixtureId: string): Promise<FixtureEvent[]> {
  return api.get<FixtureEvent[]>(`/fixtures/${fixtureId}/events`, { public: true })
}

// POST /fixtures/:fixtureId/lineups
export async function submitLineup(
  fixtureId: string,
  payload: { teamId: string; starters: string[]; bench?: string[] },
): Promise<Lineup> {
  return api.post<Lineup>(`/fixtures/${fixtureId}/lineups`, payload)
}

// POST /fixtures/:fixtureId/lineups/approve
export async function approveLineup(fixtureId: string, teamId: string): Promise<Lineup> {
  return api.post<Lineup>(`/fixtures/${fixtureId}/lineups/approve`, { teamId })
}

// GET /fixtures/:fixtureId/lineups — PUBLIC
export async function listLineups(fixtureId: string): Promise<Lineup[]> {
  return api.get<Lineup[]>(`/fixtures/${fixtureId}/lineups`, { public: true })
}
