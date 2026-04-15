/**
 * recruitment.service.ts
 *
 * Re-exports the public team endpoints used by the /recruit/:handle page.
 * The actual implementation lives in team.service.ts — this file exists so
 * the recruit page has a clean, self-describing import.
 *
 * Backend endpoints:
 *   GET  /public/teams/:handle          → validate team + get info
 *   POST /public/teams/:handle/register → submit player application
 */

export { getPublicTeamByHandle, registerPublicPlayer } from '@/lib/services/team.service'
