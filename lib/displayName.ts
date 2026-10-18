export interface Nameable {
  displayName?: string | null
  /** Organisations and teams */
  name?: string | null
  fullName?: string | null
  username?: string | null
}

/**
 * The one rule for how a person is named anywhere in the app (comments, reposts, lineups, leaderboards):
 * the name they asked to be called, then their full name, then their username. Never a blank or "User".
 */
export function nameOf(person?: Nameable | null, fallback = 'Fan'): string {
  const pick = [person?.displayName, person?.name, person?.fullName, person?.username].find((v) => typeof v === 'string' && v.trim().length > 0)
  return pick ? pick.trim() : fallback
}

export interface ProfileLike {
  fullName?: string | null
  displayName?: string | null
  phone?: string | null
}

/** True when the account has everything we ask people to fill in. */
export function isProfileComplete(p?: ProfileLike | null): boolean {
  return !!p && !!p.fullName?.trim() && !!p.displayName?.trim() && !!p.phone?.trim()
}
