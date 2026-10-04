/**
 * Notification links stored in the database before the routes moved under
 * /app ("/fantasy", "/fantasy/leaderboard", "/match/:id", "/news/:id", ...)
 * 404 today. New notifications carry real routes; this maps the old shapes
 * so tapping any notification opens the right screen.
 *
 * worker/index.js keeps a copy of these rules for push notifications (it's a
 * plain service worker and can't import this module).
 */
export function resolveNotificationLink(link: string | null | undefined): string | null {
  if (!link) return null
  if (/^https?:\/\//i.test(link)) return link
  if (link.startsWith('/app/') || link === '/app' || link.startsWith('/admin')) return link

  // Old fantasy links never included the competition: send them to the picker
  if (link === '/fantasy' || link.startsWith('/fantasy/')) return '/app/fantasy'
  const match = link.match(/^\/(?:match|fixtures)\/([^/?#]+)/)
  if (match) return `/app/match/${match[1]}`
  const news = link.match(/^\/news\/([^/?#]+)/)
  if (news) return `/app/news/${news[1]}`
  if (link.startsWith('/team')) return '/app/teams'
  return link
}
