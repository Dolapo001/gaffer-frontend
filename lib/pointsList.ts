import type { ScoringRules } from '@/lib/services/fantasy.service'

/** The standard 11-a-side points, used until the server's rules load and for servers that do not send them. */
export const STANDARD_SCORING: ScoringRules = {
  flatAppearance: false,
  concededPer: 2,
  goal: { GK: 10, DEF: 6, MID: 5, FWD: 4 },
  assist: 3,
  cleanSheet: { GK: 4, DEF: 4, MID: 1, FWD: 0 },
}

export interface PointsRow { label: string; value: string }

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

/** Plain-English list of what earns and loses points, for fans and organisers. */
export function pointsRows(r: ScoringRules): PointsRow[] {
  const positions = ['GK', 'DEF', 'MID', 'FWD'] as const
  const sheetPositions = positions.filter((p) => r.cleanSheet[p] !== 0)
  return [
    { label: 'Playing', value: r.flatAppearance ? '+1 for anyone who gets on the pitch' : '+1 for any time, +2 for most of the match' },
    { label: 'Goal', value: positions.map((p) => `${p} ${signed(r.goal[p])}`).join('  ·  ') },
    { label: 'Assist', value: signed(r.assist) },
    { label: 'Clean sheet', value: sheetPositions.map((p) => `${p} ${signed(r.cleanSheet[p])}`).join('  ·  ') || 'None' },
    { label: 'Goals conceded', value: `GK and DEF lose 1 for every ${r.concededPer} goals their team lets in` },
    { label: 'Goalkeeper saves', value: '+1 for every 3 saves' },
    { label: 'Penalty saved', value: '+5' },
    { label: 'Man of the Match', value: '+3' },
    { label: 'Yellow card', value: '-1' },
    { label: 'Red card', value: '-3' },
    { label: 'Own goal', value: '-2' },
    { label: 'Penalty missed', value: '-2' },
  ]
}
