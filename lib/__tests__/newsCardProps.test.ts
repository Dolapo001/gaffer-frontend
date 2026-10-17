import { describe, it, expect } from 'vitest'
import { splitHeadline } from '../newsCardProps'

describe('splitHeadline', () => {
  it('a short first line is the headline and the rest is the preview', () => {
    expect(splitHeadline('Welcome to Gaffer\nPick your team before the deadline.')).toEqual({ title: 'Welcome to Gaffer', rest: 'Pick your team before the deadline.' })
  })
  it('a long single line is cut at a sentence, not in the middle of a word', () => {
    const body = 'Matchday 3 results are in: Aston Villa 4-1 Manchester City was the biggest result of the round. Full table and stats updated.'
    const { title, rest } = splitHeadline(body)
    expect(title).toBe('Matchday 3 results are in: Aston Villa 4-1 Manchester City was the biggest result of the round.')
    expect(rest).toBe('Full table and stats updated.')
  })
  it('with no sentence end it cuts at a word', () => {
    const body = 'word '.repeat(40).trim()
    const { title } = splitHeadline(body)
    expect(title.endsWith('word')).toBe(true)
    expect(title.length).toBeLessThanOrEqual(110)
  })
})
