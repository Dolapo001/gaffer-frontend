'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { isStandalone } from '@/lib/pwa'
import { useAuthStore } from '@/store/authStore'
import { useAuthListener } from '@/hooks/useAuthListener'
import { GafferLogo } from '@/components/GafferLogo'
import { Users, Trophy, Calendar, BarChart2, LogOut, Plus, ChevronRight } from 'lucide-react'

const adminStats = [
  { label: 'Players', value: '48', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { label: 'Tournaments', value: '6', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { label: 'Upcoming', value: '3', icon: Calendar, color: 'text-green-400', bg: 'bg-green-400/10' },
  { label: 'Reports', value: '12', icon: BarChart2, color: 'text-gaffer-orange', bg: 'bg-gaffer-orange/10' },
]

export default function AdminPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, role, logout, user } = useAuthStore()
  useAuthListener()

  useEffect(() => {
    if (!isStandalone()) {
      router.replace('/')
      return
    }
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [router, isAuthenticated, isLoading])

  const orgName = user?.displayName || user?.email?.split('@')[0] || 'Organization'

  return (
    <div className="min-h-screen bg-gaffer-bg pb-8">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-gaffer-surface to-gaffer-bg border-b border-gaffer-border">
        <div className="flex items-center justify-between mb-4">
          <GafferLogo size="sm" />
          <button
            onClick={() => logout().then(() => router.replace('/onboarding/welcome'))}
            className="flex items-center gap-1.5 text-gaffer-muted hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-xs font-body">Logout</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-gradient-btn flex items-center justify-center text-white font-display font-black text-xl shadow-orange-glow">
            {orgName[0].toUpperCase()}
          </div>
          <div>
            <p className="text-gaffer-muted font-body text-xs">Organization Dashboard</p>
            <h1 className="font-display font-bold text-xl text-white">{orgName}</h1>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-display font-bold text-lg text-white mb-3">Overview</h2>
          <div className="grid grid-cols-2 gap-3">
            {adminStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="font-display font-black text-2xl text-white leading-none">{stat.value}</p>
                  <p className="font-body text-gaffer-muted text-xs mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display font-bold text-lg text-white mb-3">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Create Tournament', icon: Trophy },
              { label: 'Add Players', icon: Users },
              { label: 'Schedule Match', icon: Calendar },
            ].map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center justify-between gap-3 bg-gaffer-card border border-gaffer-border rounded-xl p-4 hover:border-gaffer-orange/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <action.icon size={18} className="text-gaffer-orange" />
                  <span className="font-body text-white text-sm font-medium">{action.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Plus size={14} className="text-gaffer-subtle group-hover:text-gaffer-orange transition-colors" />
                  <ChevronRight size={14} className="text-gaffer-subtle group-hover:text-gaffer-orange transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
