import { api } from '@/lib/api'

export interface MatchState {
  fixture: {
    _id: string
    status: 'scheduled' | 'live' | 'halftime' | 'suspended' | 'completed'
    score: { home: number; away: number }
    kickoffAt: string
    homeTeamId: { _id: string; name: string; shortName?: string; handle: string; logoUrl?: string }
    awayTeamId: { _id: string; name: string; shortName?: string; handle: string; logoUrl?: string }
    roundId?: { _id: string; name: string }
    competitionId: { _id: string; name: string; handle: string }
    venue?: string
    startedAt?: string
    completedAt?: string
    homeFormation?: string
    awayFormation?: string
    lineup?: Array<{
      playerId: { _id: string; firstName: string; lastName: string; photoUrl?: string }
      role: 'gk' | 'def' | 'mid' | 'att'
      positionCenter?: number
      positionVertical?: number
    }>
  }
  recentEvents: MatchEvent[]
}

export interface MatchEvent {
  _id: string
  type: string
  minute?: number
  extraMinute?: number
  period?: string
  teamId?: string | { name: string; shortName?: string }
  playerId?: string | { firstName: string; lastName: string; jerseyNumber?: number; position?: string }
  assistPlayerId?: string
  playerInId?: string
  playerOutId?: string
  commentaryText?: string
  scoreSnapshot?: { home: number; away: number }
  metadata?: Record<string, unknown>
  clientEventId?: string
  createdAt: string
}

export interface CreateMatchEventPayload {
  type: string
  minute?: number
  extraMinute?: number
  period?: 'first_half' | 'second_half' | 'extra_time_first' | 'extra_time_second' | 'penalty_shootout'
  teamId?: string
  playerId?: string
  assistPlayerId?: string
  playerInId?: string
  playerOutId?: string
  commentaryText?: string
  metadata?: Record<string, unknown>
  clientEventId?: string
}

// GET /matches/:fixtureId — PUBLIC
export async function getMatchState(fixtureId: string): Promise<MatchState> {
  return api.get<MatchState>(`/matches/${fixtureId}`, { public: true })
}

// GET /matches/:fixtureId/events — PUBLIC
export async function getMatchEvents(fixtureId: string): Promise<MatchEvent[]> {
  return api.get<MatchEvent[]>(`/matches/${fixtureId}/events`, { public: true })
}

// POST /matches/:fixtureId/events
export async function createMatchEvent(
  fixtureId: string,
  payload: CreateMatchEventPayload,
): Promise<MatchEvent> {
  return api.post<MatchEvent>(`/matches/${fixtureId}/events`, payload)
}

// PATCH /matches/:fixtureId/events/:eventId
export async function updateMatchEvent(
  fixtureId: string,
  eventId: string,
  payload: Partial<CreateMatchEventPayload>,
): Promise<{ message: string; event: MatchEvent; score: { home: number; away: number } }> {
  return api.patch(`/matches/${fixtureId}/events/${eventId}`, payload)
}

// DELETE /matches/:fixtureId/events/:eventId
export async function deleteMatchEvent(
  fixtureId: string,
  eventId: string,
): Promise<{ message: string; score: { home: number; away: number } }> {
  return api.delete(`/matches/${fixtureId}/events/${eventId}`)
}

// Convenience: all score-affecting event types
export const SCORE_EVENTS = ['goal', 'own_goal', 'penalty_scored'] as const

// Convenience: all valid event types
export const EVENT_TYPES = [
  'start', 'halftime', 'fulltime', 'match_suspended', 'match_resumed',
  'goal', 'own_goal', 'penalty_scored', 'yellow_card', 'red_card',
  'substitution', 'attempt_missed', 'penalty_awarded', 'penalty_missed',
  'corner', 'custom',
] as const

export type EventType = (typeof EVENT_TYPES)[number]
