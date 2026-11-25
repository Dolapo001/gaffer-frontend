import { describe, it, expect } from 'vitest'
import { computeGameweekDeadline, getEditableGameweek } from '../gameweekState'
import type { FantasyGameweek } from '../services/fantasy.service'
import type { Fixture } from '../services/fixture.service'

const gw = (over: Partial<FantasyGameweek> = {}) => ({
  _id: 'gw3', competitionId: 'c1', roundId: 'r3', name: 'Matchday 1', gameweekNumber: 3,
  deadline: '2026-11-26T14:15:00.000Z', lockStatus: 'open', completionStatus: 'pending', ...over,
}) as FantasyGameweek
// The match was moved to Wed 25 16:00 (WAT)
const fixtures = [{ _id: 'f1', roundId: { _id: 'r3', name: 'Matchday 1' }, kickoffAt: '2026-11-25T15:00:00.000Z', status: 'scheduled' }] as unknown as Fixture[]

describe('computeGameweekDeadline', () => {
  it('shows the server time squads close, which follows the rescheduled match', () => {
    expect(computeGameweekDeadline(gw({ lockAt: '2026-11-25T13:15:00.000Z' }), fixtures)?.toISOString()).toBe('2026-11-25T13:15:00.000Z')
  })
  it('falls back to an estimate from the fixtures only when the server sends no time', () => {
    expect(computeGameweekDeadline(gw(), fixtures)).not.toBeNull()
  })
  it('has no deadline while the round has no matches', () => {
    expect(computeGameweekDeadline(gw({ lockAt: '2026-11-25T13:15:00.000Z' }), [])).toBeNull()
  })
})

describe('getEditableGameweek uses the server lock time', () => {
  it('is open before lockAt and closed after it', () => {
    const g = gw({ lockAt: '2026-11-25T13:15:00.000Z' })
    expect(getEditableGameweek([g], fixtures, new Date('2026-11-25T13:00:00Z'))?._id).toBe('gw3')
    expect(getEditableGameweek([g], fixtures, new Date('2026-11-25T13:30:00Z'))).toBeUndefined()
  })
})
