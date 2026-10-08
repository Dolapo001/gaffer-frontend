import { describe, it, expect } from 'vitest'
import { getEditableGameweek } from '../gameweekState'

const NOW = new Date('2026-10-08T12:00:00Z')
const hours = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString()

const gw = (n: number, deadline: string, extra: Record<string, unknown> = {}) =>
  ({ _id: `g${n}`, gameweekNumber: n, roundId: `r${n}`, deadline, lockStatus: 'open', completionStatus: 'pending', ...extra }) as never
const fx = (round: number, status: string) => ({ _id: `f${round}${status}`, roundId: `r${round}`, status }) as never

describe('getEditableGameweek', () => {
  it('skips a gameweek that is being played and picks the next one that is open', () => {
    const gws = [gw(4, hours(-1)), gw(5, hours(72)), gw(6, hours(200))]
    const fixtures = [fx(4, 'live'), fx(4, 'completed'), fx(5, 'scheduled'), fx(6, 'scheduled')]
    expect(getEditableGameweek(gws, fixtures, NOW)?._id).toBe('g5')
  })

  it('skips a gameweek inside the final hour before its deadline', () => {
    const gws = [gw(5, hours(0.5)), gw(6, hours(100))]
    const fixtures = [fx(5, 'scheduled'), fx(6, 'scheduled')]
    expect(getEditableGameweek(gws, fixtures, NOW)?._id).toBe('g6')
  })

  it('skips finished and locked gameweeks', () => {
    const gws = [gw(1, hours(-500), { completionStatus: 'completed' }), gw(2, hours(-300), { lockStatus: 'locked' }), gw(3, hours(50))]
    const fixtures = [fx(1, 'completed'), fx(2, 'scheduled'), fx(3, 'scheduled')]
    expect(getEditableGameweek(gws, fixtures, NOW)?._id).toBe('g3')
  })

  it('returns nothing when no gameweek accepts changes', () => {
    const gws = [gw(1, hours(-5), { completionStatus: 'completed' })]
    expect(getEditableGameweek(gws, [fx(1, 'completed')], NOW)).toBeUndefined()
  })
})
