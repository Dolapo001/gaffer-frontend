/**
 * /player/onboarding?token=<invite_token>
 *
 * Server Component — reads the token from searchParams and passes it to the
 * Client Component. This avoids the useSearchParams() + Suspense requirement
 * and keeps the page statically type-safe.
 *
 * The backend returns invite links as:
 *   { invite: { inviteLink: "/player/onboarding?token=abc123" } }
 * buildInviteLink() in lib/routes.ts prepends window.location.origin to make
 * it absolute before displaying or copying.
 */

import { OnboardingClient } from './OnboardingClient'

interface PageProps {
  searchParams: { token?: string }
}

export default function PlayerOnboardingPage({ searchParams }: PageProps) {
  return <OnboardingClient token={searchParams.token ?? ''} />
}
