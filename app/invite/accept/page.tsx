import { redirect } from 'next/navigation'

/** Older organisation invite emails link here: send them to the page that accepts them. */
export default async function InviteAcceptRedirect({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  redirect(token ? `/organization/onboarding?token=${encodeURIComponent(token)}` : '/')
}
