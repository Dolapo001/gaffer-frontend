/** Facts about the site that several pages repeat (legal pages, sharing previews, sitemap). */

export const SITE_NAME = 'Gaffer'
export const SITE_URL = 'https://www.the-gaffer.com.ng'
export const SITE_TAGLINE = 'Fantasy football for the league you play in'
export const SITE_DESCRIPTION = 'Pick a squad from your community tournament and score as the real match is played.'

/**
 * Where people write to us. Set NEXT_PUBLIC_SUPPORT_EMAIL in the hosting settings; until it is set the Contact page
 * says so plainly instead of showing an address that does not exist.
 */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || ''

export const LEGAL_UPDATED = '15 October 2026'
