/**
 * /organization/onboarding?token=<invite_token>
 *
 * Server Component — reads the token from searchParams and passes it to the
 * Client Component. No useSearchParams() + Suspense needed.
 *
 * This route is whitelisted in middleware so unauthenticated users can reach
 * it directly from an invite email link.
 */

import { OrgOnboardingClient } from './OnboardingClient'

interface PageProps {
  searchParams: { token?: string }
}

export default function OrgOnboardingPage({ searchParams }: PageProps) {
  return <OrgOnboardingClient token={searchParams.token ?? ''} />
}
