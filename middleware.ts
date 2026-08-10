import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_ROUTES = ['/admin']
const APP_ROUTES = ['/app']
const AUTH_ROUTES = ['/auth']
const PUBLIC_ROUTES = ['/', '/onboarding']
// Invite onboarding pages must be reachable without a session — the token
// itself authenticates the request at the API layer.
const INVITE_ROUTES = ['/player/onboarding', '/organization/onboarding']
// Recruitment links are fully public — no token in the URL is needed because
// the token is the path segment itself (/recruit/:token).
const RECRUIT_PREFIX = '/recruit'
// Every reserved top-level segment in the app. Anything NOT starting with one
// of these is the `/[competition]/[...slug]` public recruitment catch-all
// route (Next.js route precedence always resolves the reserved folders below
// over the dynamic catch-all, so this check can't accidentally shadow them).
const RESERVED_TOP_SEGMENTS = [
  'auth',
  'admin',
  'app',
  'onboarding',
  'organization',
  'player',
  'recruit',
]

/**
 * Server-side route protection.
 * Reads a lightweight presence cookie set after successful login.
 * The cookie carries no sensitive data — it is only used as a
 * "is this browser session authenticated?" signal at the edge.
 * Full authorization (role verification) still happens server-side
 * via the Firebase Admin SDK or backend JWT validation.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let public / onboarding routes through unconditionally
  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )
  if (isPublic) return NextResponse.next()

  // Recruitment links are fully public — the token is the URL segment itself
  if (pathname.startsWith(RECRUIT_PREFIX)) return NextResponse.next()

  // The `/[competition]/[...slug]` public recruitment catch-all route: any
  // path whose first segment isn't one of the reserved top-level sections
  // above is this route, and must be reachable without a session.
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  if (firstSegment && !RESERVED_TOP_SEGMENTS.includes(firstSegment)) {
    return NextResponse.next()
  }

  // Invite onboarding routes are always public — no login required.
  // Players are not expected to have an account; the token in the URL is the
  // only credential needed. Token validation and error display happen entirely
  // client-side in OnboardingClient. Never redirect invite routes to login.
  const isInviteRoute = INVITE_ROUTES.some((r) => pathname.startsWith(r))
  if (isInviteRoute) return NextResponse.next()

  // Read the auth presence cookie (set during login, cleared on logout)
  const authToken = request.cookies.get('gaffer-auth-token')?.value
  const userRole = request.cookies.get('gaffer-user-role')?.value

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  // Unauthenticated user trying to access ANY non-public route → login
  if (!isAuthRoute && !authToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user trying to reach admin without org role → dashboard
  if (isAdminRoute && authToken && userRole !== 'organization') {
    return NextResponse.redirect(new URL('/app/dashboard', request.url))
  }

  // Authenticated user visiting auth pages → redirect to their home
  // Exception: Let them finish organization signup if that's where they are
  if (isAuthRoute && authToken && pathname !== '/auth/signup/organization') {
    const destination =
      userRole === 'organization' ? '/admin' : '/app/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return NextResponse.next()
}

export const config = {
  /*
   * Match all routes EXCEPT:
   * - _next/static  (static assets)
   * - _next/image   (image optimisation)
   * - favicon.ico / manifest / icons / sw.js / workbox
   * - api routes (handled by the backend)
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|icons|sw\\.js|workbox-.*\\.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|mp4|webm|ogg|mov)).*)',
  ],
}
