import { describe, it, expect } from 'vitest'
import { withArmbandsOnPitch } from '../fantasyStore'

const p = (id: string, isOnPitch: boolean, extra: Record<string, unknown> = {}) =>
  ({ id, isOnPitch, isCaptain: false, isViceCaptain: false, ...extra }) as never

describe('withArmbandsOnPitch', () => {
  it('leaves the armbands alone when both are still on the pitch', () => {
    const players = [p('a', true, { isCaptain: true }), p('b', true, { isViceCaptain: true }), p('c', false)]
    expect(withArmbandsOnPitch(players)).toBe(players)
  })

  it('hands the captaincy to the vice-captain when the captain goes to the bench', () => {
    const out = withArmbandsOnPitch([p('a', false, { isCaptain: true }), p('b', true, { isViceCaptain: true })]) as any[]
    expect(out.find((x) => x.id === 'a').isCaptain).toBe(false)
    expect(out.find((x) => x.id === 'b')).toMatchObject({ isCaptain: true, isViceCaptain: false })
  })

  it('drops a benched vice-captain and keeps the captain', () => {
    const out = withArmbandsOnPitch([p('a', true, { isCaptain: true }), p('b', false, { isViceCaptain: true })]) as any[]
    expect(out.find((x) => x.id === 'a').isCaptain).toBe(true)
    expect(out.find((x) => x.id === 'b').isViceCaptain).toBe(false)
  })

  it('clears both when both are benched', () => {
    const out = withArmbandsOnPitch([p('a', false, { isCaptain: true }), p('b', false, { isViceCaptain: true })]) as any[]
    expect(out.every((x) => !x.isCaptain && !x.isViceCaptain)).toBe(true)
  })
})
