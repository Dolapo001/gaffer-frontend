/**
 * Freeform lineups for any size of game (5 to 11 a side).
 *
 * A formation is just the number of outfield players in each area of the pitch, written "defence-midfield-attack"
 * (for example "2-1-1" or "4-4-2"); the goalkeeper is always one extra player. Slot 0 is the goalkeeper, then the
 * defence slots, then midfield, then attack. That ordering is the same one the fixed 4-4-2, 4-3-3 and 3-5-2 used,
 * so lineups saved before this change still read correctly. There is no limit on the split ("2-2-0" is fine).
 */

export type Zone = 'DEF' | 'MID' | 'FWD'
export const ZONES: Zone[] = ['DEF', 'MID', 'FWD']
export const ZONE_LABEL: Record<Zone, string> = { DEF: 'Defence', MID: 'Midfield', FWD: 'Attack' }

export type Zones = Record<Zone, number>

const DEFAULTS: Record<number, string> = {
  5: '2-1-1',
  6: '2-2-1',
  7: '3-2-1',
  8: '3-3-1',
  9: '3-3-2',
  10: '4-3-2',
  11: '4-3-3',
}

export function defaultFormation(playersPerSide: number): string {
  const n = Math.min(11, Math.max(5, Math.round(playersPerSide) || 11))
  return DEFAULTS[n]
}

/** A few common shapes per size, shown as quick picks. Any other split can be built with the area controls. */
export function suggestedFormations(playersPerSide: number): string[] {
  switch (Math.min(11, Math.max(5, Math.round(playersPerSide) || 11))) {
    case 5: return ['2-1-1', '1-2-1', '2-2-0', '1-1-2']
    case 6: return ['2-2-1', '3-1-1', '2-1-2', '1-3-1']
    case 7: return ['3-2-1', '2-3-1', '2-2-2', '3-1-2']
    case 8: return ['3-3-1', '3-2-2', '2-4-1', '4-2-1']
    case 9: return ['3-3-2', '3-4-1', '4-3-1', '2-4-2']
    case 10: return ['4-3-2', '3-4-2', '4-4-1', '3-3-3']
    default: return ['4-3-3', '4-4-2', '3-5-2', '4-5-1', '5-3-2']
  }
}

/** Reads "d-m-f"; anything unreadable, or adding up to the wrong number of players, falls back to the size's default. */
export function parseFormation(formation: string | undefined | null, playersPerSide: number): Zones {
  const outfield = Math.min(11, Math.max(5, Math.round(playersPerSide) || 11)) - 1
  const parts = String(formation ?? '').split('-').map((p) => Number(p))
  if (parts.length === 3 && parts.every((p) => Number.isInteger(p) && p >= 0) && parts[0] + parts[1] + parts[2] === outfield) {
    return { DEF: parts[0], MID: parts[1], FWD: parts[2] }
  }
  const d = DEFAULTS[outfield + 1].split('-').map(Number)
  return { DEF: d[0], MID: d[1], FWD: d[2] }
}

export function formationString(z: Zones): string {
  return `${z.DEF}-${z.MID}-${z.FWD}`
}

/** The area a slot belongs to; slot 0 is the goalkeeper (null). */
export function zoneOfSlot(z: Zones, idx: number): Zone | null {
  if (idx <= 0) return null
  if (idx <= z.DEF) return 'DEF'
  if (idx <= z.DEF + z.MID) return 'MID'
  return 'FWD'
}

export interface SlotPoint { t: number; l: number }

/**
 * Where each slot sits on the pitch (t: 88 = goal end, 18 = near the halfway line; l: left to right), in the
 * same coordinates the existing pitch uses. Rows are centred and spaced by how many players they hold.
 */
export function slotLayout(z: Zones): SlotPoint[] {
  const points: SlotPoint[] = [{ t: 88, l: 50 }]
  const rows: Array<[number, number]> = [[z.DEF, 72], [z.MID, 45], [z.FWD, 18]]
  for (const [count, t] of rows) {
    const width = Math.min(70, (count - 1) * 24)
    for (let i = 0; i < count; i++) points.push({ t, l: count === 1 ? 50 : 50 - width / 2 + (i * width) / (count - 1) })
  }
  return points
}

type Lineup = Record<number, any>

function split(lineup: Lineup, z: Zones): Record<Zone, any[]> {
  const out: Record<Zone, any[]> = { DEF: [], MID: [], FWD: [] }
  let idx = 1
  for (const zone of ZONES) for (let i = 0; i < z[zone]; i++) out[zone].push(lineup[idx++])
  return out
}

function join(gk: any, areas: Record<Zone, any[]>): { lineup: Lineup; zones: Zones } {
  const lineup: Lineup = {}
  if (gk) lineup[0] = gk
  let idx = 1
  for (const zone of ZONES) for (const p of areas[zone]) { if (p) lineup[idx] = p; idx++ }
  return { lineup, zones: { DEF: areas.DEF.length, MID: areas.MID.length, FWD: areas.FWD.length } }
}

/** Moves the slot (and whoever stands in it) into another area. The goalkeeper's slot stays put. */
export function moveSlot(lineup: Lineup, z: Zones, fromIdx: number, to: Zone): { lineup: Lineup; zones: Zones } {
  const from = zoneOfSlot(z, fromIdx)
  if (!from || from === to) return { lineup, zones: z }
  const areas = split(lineup, z)
  const offset = fromIdx - 1 - ZONES.slice(0, ZONES.indexOf(from)).reduce((s, k) => s + z[k], 0)
  const [moved] = areas[from].splice(offset, 1)
  areas[to].push(moved)
  return join(lineup[0], areas)
}

/**
 * Makes one more place in `zone` by taking it from the fullest other area (the last place there, with its player).
 * Returns the same formation if no other area has a place to give.
 */
export function growZone(lineup: Lineup, z: Zones, zone: Zone): { lineup: Lineup; zones: Zones } {
  const donor = ZONES.filter((k) => k !== zone && z[k] > 0).sort((a, b) => z[b] - z[a])[0]
  if (!donor) return { lineup, zones: z }
  let start = 1
  for (const k of ZONES) { if (k === donor) break; start += z[k] }
  return moveSlot(lineup, z, start + z[donor] - 1, zone)
}

/** Gives one place of `zone` to the thinnest other area. */
export function shrinkZone(lineup: Lineup, z: Zones, zone: Zone): { lineup: Lineup; zones: Zones } {
  if (z[zone] <= 0) return { lineup, zones: z }
  const receiver = ZONES.filter((k) => k !== zone).sort((a, b) => z[a] - z[b] || (a === 'MID' ? -1 : 1))[0]
  let start = 1
  for (const k of ZONES) { if (k === zone) break; start += z[k] }
  return moveSlot(lineup, z, start + z[zone] - 1, receiver)
}

/** Switches to another formation of the same size, keeping players in the areas they were already in where it can. */
export function applyFormation(lineup: Lineup, z: Zones, target: Zones): { lineup: Lineup; zones: Zones } {
  const areas = split(lineup, z)
  const next: Record<Zone, any[]> = { DEF: [], MID: [], FWD: [] }
  const spill: any[] = []
  for (const zone of ZONES) {
    next[zone] = areas[zone].slice(0, target[zone])
    spill.push(...areas[zone].slice(target[zone]))
    while (next[zone].length < target[zone]) next[zone].push(undefined)
  }
  for (const zone of ZONES) {
    for (let i = 0; i < next[zone].length && spill.length; i++) if (!next[zone][i]) next[zone][i] = spill.shift()
  }
  return join(lineup[0], next)
}

/** Reads a saved formation on its own terms (the size is whatever it adds up to); unreadable text means 4-3-3. */
export function zonesFromString(formation: string | undefined | null): Zones {
  const parts = String(formation ?? '').split('-').map((p) => Number(p))
  const sum = parts.reduce((s, p) => s + p, 0)
  if (parts.length === 3 && parts.every((p) => Number.isInteger(p) && p >= 0) && sum >= 4 && sum <= 10) {
    return { DEF: parts[0], MID: parts[1], FWD: parts[2] }
  }
  return { DEF: 4, MID: 3, FWD: 3 }
}
