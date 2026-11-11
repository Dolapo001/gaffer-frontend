import { redirect } from 'next/navigation'

/** Coach mode moved to /coach so it opens in any browser. */
export default async function Moved({ params }: { params: Promise<{ fixtureId: string }> }) {
  const { fixtureId } = await params
  redirect(`/coach/match/${fixtureId}`)
}
