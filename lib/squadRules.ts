/**
 * Fantasy squad rules for the size of the game (5-a-side up to 11-a-side), mirroring the server's fantasyRules.
 * The server sends the resolved rules with the season; STANDARD_RULES is the 11-a-side game used until they load
 * and for tournaments that never set a size.
 */

export type SquadPosition = 'GK' | 'DEF' | 'MID' | 'FWD'

export interface SquadRules {
  playersPerSide: number
  squadSize: number
  benchSize: number
  startingSize: number
  maxPerClub: number
  /** Goalkeepers in the squad (one starts, one is the spare on the bench) */
  gkInSquad: number
  /** Exact squad shape in the standard 11-a-side game; null where only the goalkeepers are fixed */
  composition: Record<SquadPosition, number> | null
  /** How many of each position may start */
  xiRules: Record<SquadPosition, { min: number; max: number }>
  /** The last bench place is the spare goalkeeper */
  benchGkIndex: number
}

export const STANDARD_RULES: SquadRules = {
  playersPerSide: 11,
  squadSize: 15,
  benchSize: 4,
  startingSize: 11,
  maxPerClub: 3,
  gkInSquad: 2,
  composition: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
  xiRules: {
    GK: { min: 1, max: 1 },
    DEF: { min: 3, max: 5 },
    MID: { min: 3, max: 5 },
    FWD: { min: 1, max: 3 },
  },
  benchGkIndex: 3,
}

/** Suggested rules when a size is picked (mirrors the server). Each can be changed by the organiser later. */
export function presetFor(playersPerSide: number) {
  const n = Math.min(11, Math.max(5, Math.round(playersPerSide) || 11))
  const benchSize = n <= 8 ? 3 : 4
  const squadSize = n + benchSize
  return {
    playersPerSide: n,
    squadSize,
    benchSize,
    maxPerClub: n <= 6 ? 2 : 3,
    squadBudget: Math.max(30, Math.round((100 * squadSize) / 15 / 5) * 5),
  }
}

/** Penalty kicks each team takes before sudden death: 3 in the small games, 5 in 11-a-side. */
export function shootoutKicksFor(playersPerSide: number): number {
  return playersPerSide >= 11 ? 5 : 3
}

interface HasPosition {
  position: string
  price?: number
}

export function countByPosition(players: HasPosition[]): Record<SquadPosition, number> {
  const counts: Record<SquadPosition, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
  for (const p of players) if (p.position in counts) counts[p.position as SquadPosition] += 1
  return counts
}

const outfieldPlaces = (rules: SquadRules) => rules.squadSize - rules.gkInSquad

/**
 * Why this player cannot be added to the squad being built, or null if he can.
 * The standard game has a fixed place for each position; the others only fix the goalkeepers.
 */
export function whyCannotAdd(rules: SquadRules, draft: HasPosition[], player: HasPosition): string | null {
  if (draft.length >= rules.squadSize) return `Your ${rules.squadSize} places are filled`
  const counts = countByPosition(draft)
  const pos = player.position as SquadPosition
  if (rules.composition) {
    const allowed = rules.composition[pos] ?? 0
    return (counts[pos] ?? 0) >= allowed ? `All ${allowed} ${pos} slots filled` : null
  }
  if (pos === 'GK') return counts.GK >= rules.gkInSquad ? `Both goalkeeper places are filled` : null
  const outfield = counts.DEF + counts.MID + counts.FWD
  return outfield >= outfieldPlaces(rules) ? `All ${outfieldPlaces(rules)} outfield places are filled` : null
}

export function isDraftComplete(rules: SquadRules, draft: HasPosition[]): boolean {
  if (draft.length !== rules.squadSize) return false
  const counts = countByPosition(draft)
  if (rules.composition) return (Object.keys(rules.composition) as SquadPosition[]).every((p) => counts[p] === rules.composition![p])
  return counts.GK === rules.gkInSquad
}

/** "2 GK, 5 DEF" or "1 GK, 4 outfield": what is still missing from the squad. */
export function stillNeeded(rules: SquadRules, draft: HasPosition[]): string {
  const counts = countByPosition(draft)
  if (rules.composition) {
    return (Object.keys(rules.composition) as SquadPosition[])
      .filter((p) => counts[p] < rules.composition![p])
      .map((p) => `${rules.composition![p] - counts[p]} ${p}`)
      .join(', ')
  }
  const parts: string[] = []
  if (counts.GK < rules.gkInSquad) parts.push(`${rules.gkInSquad - counts.GK} GK`)
  const outfield = counts.DEF + counts.MID + counts.FWD
  if (outfield < outfieldPlaces(rules)) parts.push(`${outfieldPlaces(rules) - outfield} outfield`)
  return parts.join(', ')
}

/**
 * Picks who starts when a squad is first saved. The standard game starts a 4-4-2; the others start the goalkeeper
 * and the most expensive outfield players (the manager can rearrange afterwards). Returns the ids that start.
 */
export function chooseStarters<T extends HasPosition & { id: string }>(rules: SquadRules, squad: T[]): Set<string> {
  const starters = new Set<string>()
  if (rules.composition) {
    const want: Record<string, number> = { GK: 1, DEF: 4, MID: 4, FWD: 2 }
    const got: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
    for (const p of squad) {
      if (got[p.position] < (want[p.position] ?? 0)) { got[p.position]++; starters.add(p.id) }
    }
    return starters
  }
  const gk = squad.find((p) => p.position === 'GK')
  if (gk) starters.add(gk.id)
  const outfield = squad.filter((p) => p.position !== 'GK').sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
  for (const p of outfield.slice(0, rules.startingSize - 1)) starters.add(p.id)
  return starters
}

/** Whether the starting team's position counts are allowed. */
export function isLegalStartingTeam(rules: SquadRules, counts: Record<SquadPosition, number>): boolean {
  return (Object.keys(rules.xiRules) as SquadPosition[]).every((p) => counts[p] >= rules.xiRules[p].min && counts[p] <= rules.xiRules[p].max)
}

/** Why a swap would break the starting team, naming the position, or null when it is fine. */
export function whyIllegalStartingTeam(rules: SquadRules, counts: Record<SquadPosition, number>): string | null {
  for (const pos of ['DEF', 'MID', 'FWD'] as const) {
    const { min, max } = rules.xiRules[pos]
    if (counts[pos] < min) return `You need at least ${min} ${pos} on the pitch.`
    if (counts[pos] > max) return `You can have at most ${max} ${pos} on the pitch.`
  }
  return null
}
