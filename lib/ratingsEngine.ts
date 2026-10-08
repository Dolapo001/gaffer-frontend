/**
 * ratingsEngine.ts
 *
 * SofaScore-style live player rating calculation engine & styling utilities.
 */

export interface EventImpactRule {
  eventType: string
  delta: number | ((position?: string) => number)
}

// These values match the server's (The-Gaffer--backend src/modules/stats/playerRating.js). Change both together.
export const BASE_PLAYER_RATING = 6.5

export function getGoalRatingDelta(position?: string): number {
  const pos = (position || 'MID').toUpperCase()
  if (pos.includes('FWD') || pos.includes('ATT') || pos.includes('ST') || pos.includes('WING')) {
    return 1.2
  }
  if (pos.includes('DEF') || pos.includes('BACK') || pos.includes('GK') || pos.includes('GOAL')) {
    return 1.6
  }
  return 1.4 // Midfielder default
}

/**
 * Calculates a player's rating from base score (6.5) plus accumulated match events.
 * Rating is clamped between 1.0 and 10.0.
 */
export function calculatePlayerRating(
  position: string = 'MID',
  events: Array<{ type: string; rawType?: string; metadata?: any }> = [],
  manualOverride?: number | null,
): number {
  if (manualOverride != null && !isNaN(manualOverride)) {
    return Math.min(10.0, Math.max(1.0, Number(manualOverride.toFixed(1))))
  }

  let rating = BASE_PLAYER_RATING

  for (const event of events) {
    const type = ((event.rawType || event.type || '') as string).toLowerCase()

    if (type === 'goal' || type === 'penalty_scored') {
      rating += getGoalRatingDelta(position)
    } else if (type === 'own_goal') {
      rating -= 1.0
    } else if (type === 'assist') {
      rating += 0.8
    } else if (type === 'penalty_saved') {
      rating += 1.5
    } else if (type === 'penalty_missed') {
      rating -= 1.2
    } else if (type === 'yellow_card') {
      rating -= 0.4
    } else if (type === 'red_card' || (event.metadata as any)?.isSecondYellow) {
      rating -= 2.0
    } else if (type === 'motm' || type === 'motm_award') {
      rating += 1.0
    }
  }

  return Math.min(10.0, Math.max(1.0, Number(rating.toFixed(1))))
}

type EventRef = string | { _id?: string; id?: string } | null | undefined
const idOf = (ref: EventRef): string | undefined => (ref && typeof ref === 'object' ? ref._id ?? ref.id : ref ?? undefined)

/**
 * The match events that count towards ONE player's rating, seen from that player's side.
 * An assist is stored on the goal (assistPlayerId), and a saved penalty names the taker (playerId)
 * and the goalkeeper (goalkeeperId, or relatedPlayerId on older events), so each is turned into
 * the event that player earned: the assister gets an 'assist', the taker a 'penalty_missed',
 * the goalkeeper a 'penalty_saved'.
 */
export function eventsForPlayer(
  playerId: string | undefined,
  events: Array<Record<string, any>> = [],
): Array<{ type: string; rawType?: string; metadata?: any }> {
  if (!playerId) return []
  const out: Array<{ type: string; rawType?: string; metadata?: any }> = []
  for (const e of events) {
    const type = String(e.rawType || e.type || '').toLowerCase()
    const isTaker = idOf(e.playerId) === playerId
    if (type === 'goal' || type === 'penalty_scored') {
      if (isTaker) out.push({ type, metadata: e.metadata })
      if (idOf(e.assistPlayerId) === playerId) out.push({ type: 'assist' })
    } else if (type === 'penalty_saved') {
      if (isTaker) out.push({ type: 'penalty_missed' })
      if ((idOf(e.goalkeeperId) ?? idOf(e.relatedPlayerId)) === playerId) out.push({ type: 'penalty_saved' })
    } else if (isTaker) {
      out.push({ type, metadata: e.metadata })
    }
  }
  return out
}

export interface RatingBadgeStyle {
  bgClass: string
  textClass: string
  badgeColorHex: string
  label: string
}

/**
 * Returns SofaScore-matched badge colors for a rating value:
 * - rating >= 7.0: Green (bg-[#22c55e] text-white)
 * - 6.0 <= rating < 7.0: Yellow/Amber (bg-[#eab308] text-black)
 * - rating < 6.0 or Red Card: Red (bg-[#ef4444] text-white)
 */
export function getRatingBadgeStyle(rating: number, hasRedCard: boolean = false): RatingBadgeStyle {
  if (hasRedCard || rating < 6.0) {
    return {
      bgClass: 'bg-[#ef4444]',
      textClass: 'text-white font-bold',
      badgeColorHex: '#ef4444',
      label: rating.toFixed(1),
    }
  }
  if (rating >= 7.0) {
    return {
      bgClass: 'bg-[#22c55e]',
      textClass: 'text-white font-bold',
      badgeColorHex: '#22c55e',
      label: rating.toFixed(1),
    }
  }
  return {
    bgClass: 'bg-[#eab308]',
    textClass: 'text-black font-bold',
    badgeColorHex: '#eab308',
    label: rating.toFixed(1),
  }
}
