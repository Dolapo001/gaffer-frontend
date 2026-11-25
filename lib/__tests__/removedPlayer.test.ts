import { describe, it, expect } from 'vitest'
import { mapApiPlayer } from '../converters'

const base = {
  _id: 'fp1', position: 'MID', price: 6.5,
  playerId: { _id: 'p1', firstName: 'Tunde', lastName: 'Ade' },
  teamId: { _id: 't1', name: '400 Level', handle: '400lv' },
} as any

describe('a player out of Fantasy', () => {
  it('is marked removed with a red plate', () => {
    const p = mapApiPlayer({ ...base, isAvailable: false }, ['fp1'])
    expect(p.isRemoved).toBe(true)
    expect(p.status).toBe('injured')
  })
  it('an available player is not marked', () => {
    const p = mapApiPlayer({ ...base, isAvailable: true }, ['fp1'])
    expect(p.isRemoved).toBeUndefined()
    expect(p.status).toBeUndefined()
  })
})
