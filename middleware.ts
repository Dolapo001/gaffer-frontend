import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_ROUTES = ['/admin']
const APP_ROUTES = ['/app']
const AUTH_ROUTES = ['/auth']
const PUBLIC_ROUTES = ['/', '/onboarding']
// Invite onboarding pages must be reachable without a session — the token
// itself authenticates the request at the API layer.
const INVITE_ROUTES = ['/player/onboarding', '/organization/onboarding']

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

  // Invite onboarding routes are public when a token is present.
  // A logged-out user arriving from an invite email must reach these pages.
  const isInviteRoute = INVITE_ROUTES.some((r) => pathname.startsWith(r))
  if (isInviteRoute) {
    const token = request.nextUrl.searchParams.get('token')
    // Token present → always allow (validation happens client-side)
    // Token absent  → fall through to the standard auth checks below
    if (token) return NextResponse.next()
  }

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
