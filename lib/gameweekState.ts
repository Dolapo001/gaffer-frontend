import type { FantasyGameweek } from '@/lib/services/fantasy.service'
import type { Fixture } from '@/lib/services/fixture.service'

// A gameweek maps 1:1 to a competition Round. Everything here is derived
// from that round's current fixtures on every read — nothing is stored or
// triggered by a background job (which can silently never run — see
// FantasyGameweek.completionStatus, a backend field this deliberately does
// not trust).
export type GameweekState = 'no_fixtures' | 'upcoming' | 'in_progress' | 'completed'

// Minutes before the earliest fixture's kickoff that a gameweek's deadline
// falls. Centralized here (not hardcoded in a component) so it can become a
// true per-tournament/per-season setting later without touching call sites.
export const DEFAULT_DEADLINE_BUFFER_MINUTES = 120

function roundIdOf(f: Fixture): string | undefined {
  return typeof f.roundId === 'object' ? f.roundId?._id : f.roundId
}

export function getRoundFixtures(gw: FantasyGameweek, fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((f) => roundIdOf(f) === gw.roundId)
}

/**
 * - no_fixtures: the round has no fixtures scheduled at all yet.
 * - upcoming: fixtures exist, none have kicked off.
 * - in_progress: at least one fixture has kicked off, but not all are finalized.
 * - completed: every fixture in the round is finalized.
 *
 * Independent per gameweek — more than one gameweek can be in_progress at
 * once if fixtures got rescheduled out of strict order, and this function
 * never looks at any other gameweek to decide.
 */
export function getGameweekState(gw: FantasyGameweek, fixtures: Fixture[]): GameweekState {
  const roundFixtures = getRoundFixtures(gw, fixtures)
  if (roundFixtures.length === 0) return 'no_fixtures'
  if (roundFixtures.every((f) => f.status === 'completed')) return 'completed'
  if (roundFixtures.some((f) => f.status !== 'scheduled')) return 'in_progress'
  return 'upcoming'
}

/**
 * Deadline = earliest scheduled fixture's kickoff minus the buffer. Null
 * when the round has no fixtures yet — callers must not invent a deadline
 * (and must not render a zeroed countdown) in that case.
 *
 * This is a pure function of current fixture data, recomputed on every
 * read — once a fixture has actually kicked off its kickoffAt is a fact,
 * not something that gets rescheduled, so a deadline derived from an
 * already-started fixture naturally can't move forward again. Rescheduling
 * a fixture that hasn't started yet is expected to (and should) shift the
 * deadline — that's the "derive, don't trigger" behavior this is built on.
 */
export function computeGameweekDeadline(
  gw: FantasyGameweek,
  fixtures: Fixture[],
  bufferMinutes: number = DEFAULT_DEADLINE_BUFFER_MINUTES,
): Date | null {
  const roundFixtures = getRoundFixtures(gw, fixtures)
  if (roundFixtures.length === 0) return null
  const earliestKickoff = Math.min(...roundFixtures.map((f) => new Date(f.kickoffAt).getTime()))
  return new Date(earliestKickoff - bufferMinutes * 60_000)
}

/** The gameweek to default a "current" view to: the earliest not-completed one, else the most recently completed. */
export function getCurrentGameweek(gameweeks: FantasyGameweek[], fixtures: Fixture[]): FantasyGameweek | undefined {
  const sorted = [...gameweeks].sort((a, b) => a.gameweekNumber - b.gameweekNumber)
  const active = sorted.find((gw) => getGameweekState(gw, fixtures) !== 'completed')
  return active ?? sorted[sorted.length - 1]
}

// The server stops accepting squad changes this long before a gameweek's deadline.
const LOCK_BEFORE_DEADLINE_MS = 60 * 60 * 1000

/**
 * The gameweek squad changes apply to: the earliest one that isn't finished and hasn't reached its lock time. Mirrors the server's rule, so Pick Team opens on a gameweek that
 * accepts changes instead of one that is live or locked (where swaps were silently ignored).
 */
export function getEditableGameweek(
  gameweeks: FantasyGameweek[],
  fixtures: Fixture[],
  now: Date = new Date(),
): FantasyGameweek | undefined {
  const sorted = [...gameweeks].sort((a, b) => a.gameweekNumber - b.gameweekNumber)
  return sorted.find((gw) => {
    if (gw.completionStatus === 'completed' || gw.lockStatus === 'locked') return false
    // Same as the server: a round with no fixtures yet has no real deadline, so it is still open
    if (getGameweekState(gw, fixtures) === 'no_fixtures') return true
    return !(gw.deadline && now.getTime() >= new Date(gw.deadline).getTime() - LOCK_BEFORE_DEADLINE_MS)
  })
}

function teamIdOf(ref: Fixture['homeTeamId']): string | undefined {
  return typeof ref === 'object' ? ref?._id : ref
}

/**
 * A team's opponent within one specific gameweek's round — not "this team's
 * next fixture anywhere." A player's real-world team can easily have a
 * fixture scheduled in some other round while having none in the round
 * you're currently viewing; showing that other round's opponent here would
 * be misleading, not just imprecise.
 *
 * Returns null when the team has no fixture in this round at all — the only
 * case a pitch card should fall back to "TBC".
 */
export function getTeamFixtureInRound(
  teamId: string,
  roundFixtures: Fixture[],
): { opponentCode: string; isHome: boolean; status: string } | null {
  for (const f of roundFixtures) {
    const homeId = teamIdOf(f.homeTeamId)
    const awayId = teamIdOf(f.awayTeamId)
    if (homeId === teamId) {
      const away = f.awayTeamId as any
      return { opponentCode: away?.shortName || away?.handle?.slice(0, 3).toUpperCase() || 'AWA', isHome: true, status: f.status }
    }
    if (awayId === teamId) {
      const home = f.homeTeamId as any
      return { opponentCode: home?.shortName || home?.handle?.slice(0, 3).toUpperCase() || 'HOM', isHome: false, status: f.status }
    }
  }
  return null
}
