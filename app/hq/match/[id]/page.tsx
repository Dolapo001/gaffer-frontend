'use client'

import Link from 'next/link'
import { AdminLiveMatchDetails } from '@/components/admin/AdminLiveMatchDetails'

/**
 * Gaffer HQ runs any match with the same console organisations use: lineups, Go Live, commentary and Full Time.
 * The server lets HQ through the organisation checks and records every change in the audit log.
 */
export default function HqMatchPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <div className="px-4 pt-3">
        <Link href="/hq/tournaments" className="text-sm font-body text-gaffer-muted hover:text-white">← Back to tournaments</Link>
      </div>
      <AdminLiveMatchDetails id={params.id} />
    </div>
  )
}
