import { api } from '@/lib/api'

export interface NotificationPreferences {
  enabled: boolean
  mutedEventTypes: string[]
  followedMatches: string[]
  followedTeams: string[]
  followedCompetitions: string[]
}

// GET /notifications/vapid-key — PUBLIC
export async function getVapidKey(): Promise<{ vapidPublicKey: string }> {
  return api.get<{ vapidPublicKey: string }>('/notifications/vapid-key', { public: true })
}

// POST /notifications/subscribe
export async function subscribePush(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<{ message: string; subscription: unknown }> {
  return api.post('/notifications/subscribe', subscription)
}

// POST /notifications/unsubscribe
export async function unsubscribePush(endpoint: string): Promise<{ message: string }> {
  return api.post<{ message: string }>('/notifications/unsubscribe', { endpoint })
}

// GET /notifications/preferences
export async function getPreferences(): Promise<{ preferences: NotificationPreferences }> {
  return api.get<{ preferences: NotificationPreferences }>('/notifications/preferences')
}

// PATCH /notifications/preferences
export async function updatePreferences(payload: {
  enabled?: boolean
  mutedEventTypes?: string[]
}): Promise<{ preferences: NotificationPreferences }> {
  return api.patch<{ preferences: NotificationPreferences }>('/notifications/preferences', payload)
}

// POST /notifications/follow/match/:fixtureId
export async function followMatch(fixtureId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/notifications/follow/match/${fixtureId}`)
}

// DELETE /notifications/follow/match/:fixtureId
export async function unfollowMatch(fixtureId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/notifications/follow/match/${fixtureId}`)
}

// POST /notifications/follow/team/:teamId
export async function followTeam(teamId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/notifications/follow/team/${teamId}`)
}

// DELETE /notifications/follow/team/:teamId
export async function unfollowTeam(teamId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/notifications/follow/team/${teamId}`)
}

// POST /notifications/follow/competition/:competitionId
export async function followCompetition(competitionId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/notifications/follow/competition/${competitionId}`)
}

// DELETE /notifications/follow/competition/:competitionId
export async function unfollowCompetition(competitionId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/notifications/follow/competition/${competitionId}`)
}

// All mutable event types (for preferences UI)
export const MUTABLE_EVENT_TYPES = [
  'goal', 'own_goal', 'penalty_scored', 'yellow_card', 'red_card',
  'substitution', 'attempt_missed', 'penalty_awarded', 'penalty_missed',
  'corner', 'halftime', 'fulltime', 'match_suspended', 'match_resumed',
] as const
