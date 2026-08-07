import type { GameweekTopPlayer } from '@/lib/services/fantasy.service'

// Valid outfield formations (DEF-MID-FWD, 10 outfield players + 1 GK = 11).
const DEF_RANGE = [3, 4, 5]
const MID_RANGE = [2, 3, 4, 5]
const FWD_RANGE = [1, 2, 3]

export interface TeamOfTheRound {
  gk: GameweekTopPlayer
  def: GameweekTopPlayer[]
  mid: GameweekTopPlayer[]
  fwd: GameweekTopPlayer[]
  formation: string
  totalPoints: number
}

/**
 * Picks the highest-scoring valid XI (1 GK + a valid DEF/MID/FWD formation)
 * from a gameweek's scored players. Returns null when there isn't enough
 * data yet to fill any valid formation (e.g. no GK scored, or too few
 * outfield players across positions).
 */
export function pickTeamOfTheRound(players: GameweekTopPlayer[]): TeamOfTheRound | null {
  const byPos: Record<'GK' | 'DEF' | 'MID' | 'FWD', GameweekTopPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] }
  for (const p of players) byPos[p.position]?.push(p)
  ;(Object.keys(byPos) as (keyof typeof byPos)[]).forEach((pos) => {
    byPos[pos].sort((a, b) => b.totalPoints - a.totalPoints)
  })

  const gk = byPos.GK[0]
  if (!gk) return null

  let best: { def: GameweekTopPlayer[]; mid: GameweekTopPlayer[]; fwd: GameweekTopPlayer[]; formation: string; total: number } | null = null

  for (const d of DEF_RANGE) {
    if (d > byPos.DEF.length) continue
    for (const m of MID_RANGE) {
      if (m > byPos.MID.length) continue
      for (const f of FWD_RANGE) {
        if (d + m + f !== 10 || f > byPos.FWD.length) continue

        const def = byPos.DEF.slice(0, d)
        const mid = byPos.MID.slice(0, m)
        const fwd = byPos.FWD.slice(0, f)
        const total = gk.totalPoints + [...def, ...mid, ...fwd].reduce((sum, p) => sum + p.totalPoints, 0)

        if (!best || total > best.total) {
          best = { def, mid, fwd, formation: `${d}-${m}-${f}`, total }
        }
      }
    }
  }

  if (!best) return null
  return { gk, def: best.def, mid: best.mid, fwd: best.fwd, formation: best.formation, totalPoints: best.total }
}

export interface TeamTotals {
  team: GameweekTopPlayer['team']
  totalPoints: number
}

/** Aggregates every scored player's points by their real-world team, for the "least/most points" badges. */
export function computeTeamTotals(players: GameweekTopPlayer[]): { most: TeamTotals | null; least: TeamTotals | null } {
  const map = new Map<string, TeamTotals>()
  for (const p of players) {
    if (!p.team?._id) continue
    const entry = map.get(p.team._id) ?? { team: p.team, totalPoints: 0 }
    entry.totalPoints += p.totalPoints
    map.set(p.team._id, entry)
  }
  const sorted = Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints)
  if (sorted.length === 0) return { most: null, least: null }
  return { most: sorted[0], least: sorted[sorted.length - 1] }
}
