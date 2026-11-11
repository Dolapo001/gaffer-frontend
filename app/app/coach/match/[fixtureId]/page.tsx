import { redirect } from 'next/navigation'

/** Coach mode moved to /coach so it opens in any browser. */
export default function Moved({ params }: { params: Record<string, string> }) {
  redirect(`/coach/match/${params.fixtureId}`)
}
