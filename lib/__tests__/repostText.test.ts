import { describe, it, expect } from 'vitest'
import { repostedByText } from '../repostText'

describe('repostedByText', () => {
  it('one, two and many reposters', () => {
    expect(repostedByText(['Tunde'])).toBe('Tunde reposted')
    expect(repostedByText(['Tunde', 'Zainab'])).toBe('Tunde and Zainab reposted')
    expect(repostedByText(['Tunde', 'Zainab', 'Ada'])).toBe('Tunde, Zainab and 1 other reposted')
    expect(repostedByText(['A', 'B', 'C', 'D', 'E'])).toBe('A, B and 3 others reposted')
  })
  it('nothing to say when nobody reposted', () => expect(repostedByText([])).toBe(''))
})
