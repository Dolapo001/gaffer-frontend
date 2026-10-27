/**
 * /recruit/[token]
 *
 * Public recruitment page — accessible without authentication.
 * The token is validated client-side before the form is rendered.
 *
 * This is a Server Component so the token is available as a route param
 * without needing useParams() + a Suspense boundary.
 */

import { RecruitmentPageClient } from './RecruitmentPageClient'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function RecruitPage({ params }: PageProps) {
  const { token } = await params
  return <RecruitmentPageClient token={token} />
}
