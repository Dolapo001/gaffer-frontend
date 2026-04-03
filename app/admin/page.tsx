'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import { GafferLogo } from '@/components/GafferLogo'
import { Users, Trophy, Calendar, BarChart2, LogOut, Plus, ChevronRight } from 'lucide-react'

const adminStats = [
  { label: 'Players', value: '48', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  {
    label: 'Tournaments',
    value: '6',
    icon: Trophy,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    label: 'Upcoming',
    value: '3',
    icon: Calendar,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    label: 'Reports',
    value: '12',
    icon: BarChart2,
    color: 'text-gaffer-orange',
    bg: 'bg-gaffer-orange/10',
  },
]

import { OrganizationHome } from '@/components/organization/OrganizationHome'

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useAuthStore()
  useAuthListener()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <OrganizationHome />
}
