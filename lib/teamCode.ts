/** The few team fields a short code can be built from. */
export interface TeamLike {
  shortName?: string | null
  handle?: string | null
  name?: string | null
}

/**
 * The short code shown for a team (on cards, fixtures, crests): its short name when it has one, otherwise the first
 * letters of its handle, otherwise of its name. Empty when nothing is known. One rule for every screen, so a team
 * always has the same code wherever it appears.
 */
export function teamCodeOf(team: TeamLike | null | undefined): string {
  if (!team) return ''
  const short = team.shortName?.trim()
  if (short) return short
  const base = (team.handle ?? '').trim() || (team.name ?? '').trim()
  return base.slice(0, 3).toUpperCase()
}
