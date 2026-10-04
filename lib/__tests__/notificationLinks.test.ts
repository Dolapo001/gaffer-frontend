import { describe, it, expect } from 'vitest'
import { resolveNotificationLink } from '../notificationLinks'

describe('resolveNotificationLink', () => {
  it.each([
    ['/fantasy', '/app/fantasy'],
    ['/fantasy/leaderboard', '/app/fantasy'],
    ['/match/abc123', '/app/match/abc123'],
    ['/fixtures/abc123', '/app/match/abc123'],
    ['/news/n1', '/app/news/n1'],
    ['/team/t1/invite', '/app/teams'],
  ])('maps legacy %s to %s', (legacy, real) => {
    expect(resolveNotificationLink(legacy)).toBe(real)
  })

  it.each(['/app/fantasy/c1/team', '/app/match/m1', '/admin/news', 'https://example.com/x'])('leaves %s as is', (link) => {
    expect(resolveNotificationLink(link)).toBe(link)
  })

  it('returns null for no link', () => {
    expect(resolveNotificationLink(undefined)).toBeNull()
    expect(resolveNotificationLink('')).toBeNull()
  })
})
