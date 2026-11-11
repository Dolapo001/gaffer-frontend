import { redirect } from 'next/navigation'

/** Coach mode moved to /coach so it opens in any browser. */
export default async function Moved({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  redirect(`/coach/join/${token}`)
}
