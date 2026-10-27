'use client'

import { AdminLiveMatchDetails } from '@/components/admin/AdminLiveMatchDetails'
import { useParams } from 'next/navigation'

export default function AdminLiveMatchPage() {
  const { id } = useParams<{ id: string }>()
  return <AdminLiveMatchDetails id={id} />
}
