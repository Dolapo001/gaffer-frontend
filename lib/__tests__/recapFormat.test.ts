import { describe, it, expect } from 'vitest'
import { ordinal, standingLine, chipsLine } from '../recapFormat'

describe('ordinal', () => {
  it('writes ranks the way people say them', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st', '111th'])
  })
})

describe('standingLine', () => {
  it('celebrates the winner', () => expect(standingLine(1, 50, 100)).toMatch(/top of every manager/))
  it('says how many were beaten when most were', () => expect(standingLine(10, 100, 91)).toBe('You beat 91% of managers.'))
  it('counts managers behind when fewer were beaten', () => expect(standingLine(30, 40, 26)).toBe('10 managers finished behind you.'))
  it('copes with a lone manager', () => expect(standingLine(1, 1, 0)).toMatch(/only manager/))
})

describe('chipsLine', () => {
  it('handles none, one, two and three', () => {
    expect(chipsLine([])).toBe('You played no chips.')
    expect(chipsLine(['Wildcard'])).toBe('You played the Wildcard.')
    expect(chipsLine(['Wildcard', 'Free Hit'])).toBe('You played Wildcard and Free Hit.')
    expect(chipsLine(['A', 'B', 'C'])).toBe('You played A, B and C.')
  })
})
