// Same rules as lib/notificationLinks.ts (a service worker can't import it):
// old links like '/fantasy' or '/match/:id' predate the /app routes.
function resolveLink(link) {
  if (!link) return '/'
  if (/^https?:\/\//i.test(link)) return link
  if (link.startsWith('/app/') || link === '/app' || link.startsWith('/admin')) return link
  if (link === '/fantasy' || link.startsWith('/fantasy/')) return '/app/fantasy'
  const match = link.match(/^\/(?:match|fixtures)\/([^/?#]+)/)
  if (match) return '/app/match/' + match[1]
  const news = link.match(/^\/news\/([^/?#]+)/)
  if (news) return '/app/news/' + news[1]
  if (link.startsWith('/team')) return '/app/teams'
  return link
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'The Gaffer', {
      // The backend sends { title, body, url }; this read message/link, so every
      // push showed an empty body and opened '/'. Accept both shapes.
      body: data.body ?? data.message ?? '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { link: resolveLink(data.url ?? data.link) },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link ?? '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(link) && 'focus' in client) return client.focus()
        }
        if (clients.openWindow) return clients.openWindow(link)
      })
  )
})
