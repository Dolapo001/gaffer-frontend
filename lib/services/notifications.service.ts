import { api } from '@/lib/api'

export interface NotificationPreferences {
  enabled: boolean
  mutedEventTypes: string[]
  followedMatches: string[]
  followedTeams: string[]
  followedCompetitions: string[]
}

export interface InboxNotification {
  _id: string
  title: string
  body: string
  type: string
  read: boolean
  metadata: Record<string, unknown>
  createdAt: string
}

// ─── Push subscriptions ───────────────────────────────────────────────────────

// GET /notifications/vapid-key — PUBLIC
export async function getVapidKey(): Promise<{ vapidPublicKey: string }> {
  return api.get<{ vapidPublicKey: string }>('/notifications/vapid-key', { public: true })
}

// POST /notifications/push/subscribe
export async function subscribePush(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<{ message: string; subscription: unknown }> {
  return api.post('/notifications/push/subscribe', subscription)
}

// DELETE /notifications/push/subscribe
export async function unsubscribePush(endpoint: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>('/notifications/push/subscribe', { body: { endpoint } } as any)
}

// ─── Preferences ──────────────────────────────────────────────────────────────

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

// ─── Inbox ────────────────────────────────────────────────────────────────────

// GET /notifications — fetch all in-app notifications
export async function getInboxNotifications(
  page = 1
): Promise<{ notifications: InboxNotification[]; total: number; page: number; unreadCount: number }> {
  return api.get(`/notifications?page=${page}`)
}

// PATCH /notifications/:id/read — mark a single notification as read
export async function markNotificationRead(
  id: string
): Promise<{ message: string; notification: InboxNotification }> {
  return api.patch(`/notifications/${id}/read`, {})
}

// PATCH /notifications/read-all — mark all notifications as read
export async function markAllRead(): Promise<{ message: string }> {
  return api.patch<{ message: string }>('/notifications/read-all', {})
}

// DELETE /notifications/:id — delete a single notification
export async function deleteNotification(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/notifications/${id}`)
}

// DELETE /notifications — clear all notifications
export async function clearAllNotifications(): Promise<{ message: string }> {
  return api.delete<{ message: string }>('/notifications')
}

// ─── Follow: match ────────────────────────────────────────────────────────────

// POST /notifications/follow/match/:matchId
export async function followMatch(matchId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/notifications/follow/match/${matchId}`)
}

// DELETE /notifications/follow/match/:matchId
export async function unfollowMatch(matchId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/notifications/follow/match/${matchId}`)
}

// ─── Follow: team ─────────────────────────────────────────────────────────────

// POST /notifications/follow/team/:teamId
export async function followTeam(teamId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/notifications/follow/team/${teamId}`)
}

// DELETE /notifications/follow/team/:teamId
export async function unfollowTeam(teamId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/notifications/follow/team/${teamId}`)
}

// ─── Follow: competition ──────────────────────────────────────────────────────

// POST /notifications/follow/competition/:competitionId
export async function followCompetition(competitionId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/notifications/follow/competition/${competitionId}`)
}

// DELETE /notifications/follow/competition/:competitionId
export async function unfollowCompetition(competitionId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/notifications/follow/competition/${competitionId}`)
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

// All mutable event types (for preferences UI)
export const MUTABLE_EVENT_TYPES = [
  'goal', 'own_goal', 'penalty_scored', 'yellow_card', 'red_card',
  'substitution', 'attempt_missed', 'penalty_awarded', 'penalty_missed',
  'corner', 'halftime', 'fulltime', 'match_suspended', 'match_resumed',
] as const
