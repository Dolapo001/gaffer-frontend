import { describe, it, expect } from 'vitest'
import { playerFullName, playerShortName } from '../playerName'

describe('player names', () => {
  it('uses the name the player asked to be called', () => {
    expect(playerFullName({ displayName: 'Chrissy', firstName: 'Ademofe', lastName: 'Omotolani' })).toBe('Chrissy')
    expect(playerShortName({ displayName: 'Chrissy', firstName: 'Ademofe', lastName: 'Omotolani' })).toBe('Chrissy')
  })
  it('falls back to first and last name, and last name on tiles', () => {
    expect(playerFullName({ firstName: 'Ademofe', lastName: 'Omotolani' })).toBe('Ademofe Omotolani')
    expect(playerShortName({ firstName: 'Ademofe', lastName: 'Omotolani' })).toBe('Omotolani')
  })
  it('ignores a blank chosen name', () => {
    expect(playerFullName({ displayName: '   ', firstName: 'A', lastName: 'B' })).toBe('A B')
  })
  it('never returns an empty name', () => {
    expect(playerFullName(null)).toBe('Player')
    expect(playerShortName({})).toBe('Player')
  })
})
