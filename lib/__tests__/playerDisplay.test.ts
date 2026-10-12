import { describe, it, expect } from 'vitest'
import { initialsOf, readableTextOn, nextOpponentLabel } from '../playerDisplay'

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
