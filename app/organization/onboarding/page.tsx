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
  searchParams: Promise<{ token?: string }>
}

export default async function OrgOnboardingPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  return <OrgOnboardingClient token={token ?? ''} />
}
