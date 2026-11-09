export interface PlayerNameParts {
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  fullName?: string | null
}

const clean = (v?: string | null) => (typeof v === 'string' ? v.trim() : '')

/**
 * How a player is named to fans: the name they asked to be called (Chrissy, Messi),
 * otherwise first and last name.
 */
export function playerFullName(p?: PlayerNameParts | null, fallback = 'Player'): string {
  if (!p) return fallback
  return clean(p.displayName) || `${clean(p.firstName)} ${clean(p.lastName)}`.trim() || clean(p.name) || clean(p.fullName) || fallback
}

/** The short form used on pitch and lineup tiles: the chosen name, otherwise last name, otherwise first name. */
export function playerShortName(p?: PlayerNameParts | null, fallback = 'Player'): string {
  if (!p) return fallback
  return clean(p.displayName) || clean(p.lastName) || clean(p.firstName) || clean(p.name) || clean(p.fullName) || fallback
}

/** For organiser and coach screens where the wrong person must not be picked: "Pogba (Ade Johnson)" when the nickname differs from the real name. */
export function playerBothNames(p?: PlayerNameParts | null, fallback = 'Player'): string {
  if (!p) return fallback
  const real = `${clean(p.firstName)} ${clean(p.lastName)}`.trim()
  const nick = clean(p.displayName)
  if (nick && real && nick.toLowerCase() !== real.toLowerCase()) return `${nick} (${real})`
  return nick || real || clean(p.name) || clean(p.fullName) || fallback
}
