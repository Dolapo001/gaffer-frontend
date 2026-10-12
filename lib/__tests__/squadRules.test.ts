import { describe, it, expect } from 'vitest'
import {
  STANDARD_RULES,
  whyCannotAdd,
  isDraftComplete,
  stillNeeded,
  chooseStarters,
  isLegalStartingTeam,
  whyIllegalStartingTeam,
  type SquadRules,
} from '../squadRules'

const FIVE: SquadRules = {
  playersPerSide: 5,
  squadSize: 8,
  benchSize: 3,
  startingSize: 5,
  maxPerClub: 2,
  gkInSquad: 2,
  composition: null,
  xiRules: { GK: { min: 1, max: 1 }, DEF: { min: 0, max: 4 }, MID: { min: 0, max: 4 }, FWD: { min: 0, max: 4 } },
  benchGkIndex: 2,
}

const p = (position: string, price = 5, id = Math.random().toString(36).slice(2)) => ({ id, position, price })
const many = (position: string, n: number) => Array.from({ length: n }, () => p(position))

describe('whyCannotAdd', () => {
  it('keeps the fixed places for the standard game', () => {
    expect(whyCannotAdd(STANDARD_RULES, many('GK', 2), p('GK'))).toBe('All 2 GK slots filled')
    expect(whyCannotAdd(STANDARD_RULES, many('GK', 1), p('GK'))).toBeNull()
    expect(whyCannotAdd(STANDARD_RULES, many('DEF', 5), p('DEF'))).toBe('All 5 DEF slots filled')
  })
  it('only fixes the goalkeepers in a small game', () => {
    expect(whyCannotAdd(FIVE, many('GK', 2), p('GK'))).toBe('Both goalkeeper places are filled')
    expect(whyCannotAdd(FIVE, [...many('GK', 1), ...many('DEF', 6)], p('DEF'))).toBe('All 6 outfield places are filled')
    // any mix of outfield positions is fine
    expect(whyCannotAdd(FIVE, [...many('GK', 2), ...many('FWD', 5)], p('FWD'))).toBeNull()
  })
  it('stops at the squad size', () => {
    expect(whyCannotAdd(FIVE, [...many('GK', 2), ...many('MID', 6)], p('MID'))).toBe('Your 8 places are filled')
  })
})

describe('isDraftComplete and stillNeeded', () => {
  it('is complete with 2 goalkeepers and the rest outfield in a small game', () => {
    expect(isDraftComplete(FIVE, [...many('GK', 2), ...many('MID', 6)])).toBe(true)
    expect(isDraftComplete(FIVE, [...many('GK', 1), ...many('MID', 7)])).toBe(false)
    expect(isDraftComplete(FIVE, [...many('GK', 2), ...many('MID', 5)])).toBe(false)
  })
  it('needs the exact shape in the standard game', () => {
    const full = [...many('GK', 2), ...many('DEF', 5), ...many('MID', 5), ...many('FWD', 3)]
    expect(isDraftComplete(STANDARD_RULES, full)).toBe(true)
    expect(isDraftComplete(STANDARD_RULES, [...many('GK', 2), ...many('DEF', 6), ...many('MID', 4), ...many('FWD', 3)])).toBe(false)
  })
  it('says what is missing', () => {
    expect(stillNeeded(FIVE, [...many('GK', 1), ...many('DEF', 2)])).toBe('1 GK, 4 outfield')
    expect(stillNeeded(STANDARD_RULES, [...many('GK', 2), ...many('DEF', 5), ...many('MID', 5), ...many('FWD', 1)])).toBe('2 FWD')
  })
})

describe('chooseStarters', () => {
  it('starts a 4-4-2 in the standard game', () => {
    const squad = [...many('GK', 2), ...many('DEF', 5), ...many('MID', 5), ...many('FWD', 3)]
    const starters = chooseStarters(STANDARD_RULES, squad)
    expect(starters.size).toBe(11)
    expect(squad.filter((s) => starters.has(s.id) && s.position === 'DEF').length).toBe(4)
    expect(squad.filter((s) => starters.has(s.id) && s.position === 'GK').length).toBe(1)
  })
  it('starts one goalkeeper and the most expensive outfield players in a small game', () => {
    const cheap = p('DEF', 4, 'cheap')
    const dear = p('FWD', 9, 'dear')
    const squad = [p('GK', 4.5, 'g1'), p('GK', 4, 'g2'), cheap, dear, p('MID', 6, 'm1'), p('MID', 5, 'm2'), p('DEF', 5, 'd2'), p('FWD', 7, 'f2')]
    const starters = chooseStarters(FIVE, squad)
    expect(starters.size).toBe(5)
    expect(starters.has('g1')).toBe(true)
    expect(starters.has('dear')).toBe(true)
    expect(starters.has('cheap')).toBe(false)
  })
})

describe('starting team checks', () => {
  it('allows any split in a small game', () => {
    expect(isLegalStartingTeam(FIVE, { GK: 1, DEF: 2, MID: 2, FWD: 0 })).toBe(true)
    expect(whyIllegalStartingTeam(FIVE, { GK: 1, DEF: 2, MID: 2, FWD: 0 })).toBeNull()
  })
  it('keeps the limits in the standard game', () => {
    expect(isLegalStartingTeam(STANDARD_RULES, { GK: 1, DEF: 2, MID: 5, FWD: 3 })).toBe(false)
    expect(whyIllegalStartingTeam(STANDARD_RULES, { GK: 1, DEF: 2, MID: 5, FWD: 3 })).toBe('You need at least 3 DEF on the pitch.')
    expect(whyIllegalStartingTeam(STANDARD_RULES, { GK: 1, DEF: 6, MID: 3, FWD: 1 })).toBe('You can have at most 5 DEF on the pitch.')
  })
})
