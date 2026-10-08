import { describe, it, expect } from 'vitest'
import { calculatePlayerRating, eventsForPlayer } from '../ratingsEngine'

const goal = { rawType: 'goal', type: 'goal', playerId: { _id: 'scorer' }, assistPlayerId: { _id: 'setup' } }
const saved = { rawType: 'penalty_saved', type: 'general', playerId: { _id: 'taker' }, goalkeeperId: 'keeper' }
const savedOldShape = { rawType: 'penalty_saved', type: 'general', playerId: 'taker', relatedPlayerId: 'keeper' }

describe('rating events per player', () => {
  it('gives the player who set up a goal an assist', () => {
    const evts = eventsForPlayer('setup', [goal])
    expect(evts).toEqual([{ type: 'assist' }])
    expect(calculatePlayerRating('MID', evts)).toBe(7.3)
  })

  it('gives the scorer the goal and not the assist', () => {
    expect(calculatePlayerRating('FWD', eventsForPlayer('scorer', [goal]))).toBe(7.7)
  })

  it('marks the penalty taker down and the goalkeeper up', () => {
    expect(calculatePlayerRating('FWD', eventsForPlayer('taker', [saved]))).toBe(5.3)
    expect(calculatePlayerRating('GK', eventsForPlayer('keeper', [saved]))).toBe(8)
  })

  it('still finds the goalkeeper on older events that stored them as relatedPlayerId', () => {
    expect(calculatePlayerRating('GK', eventsForPlayer('keeper', [savedOldShape]))).toBe(8)
  })

  it('marks down a missed penalty, a card and an own goal', () => {
    const evts = [
      { rawType: 'penalty_missed', playerId: 'p' },
      { rawType: 'yellow_card', playerId: 'p' },
      { rawType: 'own_goal', playerId: 'p' },
    ]
    expect(calculatePlayerRating('DEF', eventsForPlayer('p', evts))).toBe(3.9)
  })

  it('lets a manual rating win', () => {
    expect(calculatePlayerRating('MID', eventsForPlayer('setup', [goal]), 5)).toBe(5)
  })
})
