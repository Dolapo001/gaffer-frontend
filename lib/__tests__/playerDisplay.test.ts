import { describe, it, expect } from 'vitest'
import { initialsOf, readableTextOn, nextOpponentLabel, fixtureLabel } from '../playerDisplay'

describe('initialsOf', () => {
  it('uses the first letter of the first and last name', () => {
    expect(initialsOf('Timi Ayegunle')).toBe('TA')
    expect(initialsOf('Eric Adedugba')).toBe('EA')
  })
  it('copes with long and messy names', () => {
    expect(initialsOf('Timi -ayegunle Clevannymary jesufemi')).toBe('TJ')
  })
  it('uses one letter for a single name and a mark for nothing', () => {
    expect(initialsOf('Neymar')).toBe('N')
    expect(initialsOf('')).toBe('?')
    expect(initialsOf(undefined)).toBe('?')
  })
  it('keeps accented letters', () => {
    expect(initialsOf('Ødegaard Åsa')).toBe('ØÅ')
  })
})

describe('readableTextOn', () => {
  it('uses white on dark colours and dark on light colours', () => {
    expect(readableTextOn('#004170')).toBe('#ffffff')
    expect(readableTextOn('#FFD700')).toBe('#111111')
    expect(readableTextOn('#fff')).toBe('#111111')
  })
  it('falls back to white for anything that is not a colour', () => {
    expect(readableTextOn('blue')).toBe('#ffffff')
    expect(readableTextOn(undefined)).toBe('#ffffff')
  })
})

describe('nextOpponentLabel', () => {
  const fx = [{ homeTeam: 'Arsenal', awayTeam: 'Chelsea', homeCode: 'ARS', awayCode: 'CHE', kickoff: '', gameweek: 5 }]
  it('shows the opponent and whether it is at home', () => {
    expect(nextOpponentLabel('ARS', fx)).toBe('CHE (H)')
    expect(nextOpponentLabel('CHE', fx)).toBe('ARS (A)')
  })
  it('is empty when there is nothing scheduled', () => {
    expect(nextOpponentLabel('ARS', [])).toBeNull()
    expect(nextOpponentLabel(undefined, fx)).toBeNull()
    expect(nextOpponentLabel('MCI', fx)).toBeNull()
  })
})

describe('fixtureLabel (opponent and venue from team ids)', () => {
  // A 400 Level player whose team has no short name: the player's own code is the full handle, the fixture codes are built from the handle's first letters
  const fx = { homeTeam: '300 Level', awayTeam: '400 Level', homeCode: '300', awayCode: '400', opponentName: '300 Level', opponentCode: '300', isHome: false, kickoff: '', gameweek: 1 }
  it('shows the other team and "A" for the away side, whatever the codes look like', () => {
    expect(fixtureLabel(fx, '400lv')).toBe('300 (A)')
  })
  it('shows the other team and "H" for the home side', () => {
    expect(fixtureLabel({ ...fx, opponentName: '400 Level', opponentCode: '400', isHome: true }, '300lv')).toBe('400 (H)')
  })
  it('falls back to comparing codes only when the fixture carries no opponent', () => {
    const { opponentCode, isHome, opponentName, ...legacy } = fx
    void opponentCode; void isHome; void opponentName
    expect(fixtureLabel(legacy, '400')).toBe('300 (A)')
    expect(fixtureLabel(legacy, 'XYZ')).toBeNull()
  })
  it('is null with no fixture', () => {
    expect(fixtureLabel(undefined, '400')).toBeNull()
  })
})
