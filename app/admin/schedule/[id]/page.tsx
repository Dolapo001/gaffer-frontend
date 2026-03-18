'use client'

import { AdminLiveMatchDetails } from '@/components/admin/AdminLiveMatchDetails'

export default function AdminLiveMatchPage({ params }: { params: { id: string } }) {
  // In a real app, we would fetch the match data based on the ID
  return <AdminLiveMatchDetails />
}
