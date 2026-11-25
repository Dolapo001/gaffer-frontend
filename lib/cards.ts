/** A player's yellow and red cards, from a stats row (flat or under `stats`). */
export function cardCounts(entry: unknown): { yellow: number; red: number } {
  const e = (entry ?? {}) as { yellowCards?: number; redCards?: number; stats?: { yellowCards?: number; redCards?: number } }
  return {
    yellow: Number(e.yellowCards ?? e.stats?.yellowCards ?? 0) || 0,
    red: Number(e.redCards ?? e.stats?.redCards ?? 0) || 0,
  }
}

/** True for a row that has at least one card of either colour. */
export const hasCards = (entry: unknown) => {
  const { yellow, red } = cardCounts(entry)
  return yellow + red > 0
}
