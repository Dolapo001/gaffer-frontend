'use client'

import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { GafferLogo } from '@/components/GafferLogo'
import { Trophy, Activity, Calendar, Users, ChevronRight, TrendingUp } from 'lucide-react'

const quickStats = [
  { label: 'Matches', value: '12', icon: Activity, color: 'text-gaffer-orange' },
  { label: 'Wins', value: '8', icon: Trophy, color: 'text-yellow-400' },
  { label: 'Teams', value: '3', icon: Users, color: 'text-blue-400' },
  { label: 'Events', value: '5', icon: Calendar, color: 'text-green-400' },
]

const recentActivity = [
  { title: 'Joined Westside FC', time: '2 hours ago', type: 'team' },
  { title: 'Match vs. City United', time: 'Yesterday', type: 'match' },
  { title: 'Tournament registration', time: '3 days ago', type: 'event' },
]

export default function DashboardPage() {
  const { user, role } = useAuthStore()
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Gaffer'

  return (
    <div className="min-h-screen bg-gaffer-bg">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 bg-gradient-to-b from-gaffer-surface to-gaffer-bg border-b border-gaffer-border">
        <div className="flex items-center justify-between mb-4">
          <GafferLogo size="sm" />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-bold text-sm">
              {displayName[0].toUpperCase()}
            </div>
          </div>
        </div>
        <div>
          <p className="text-gaffer-muted font-body text-sm">Welcome back,</p>
          <h1 className="font-display font-bold text-2xl text-white">
            {displayName}
            {role === 'organization' && (
              <span className="ml-2 text-xs bg-gaffer-orange/20 text-gaffer-orange border border-gaffer-orange/30 px-2 py-0.5 rounded-full font-body">
                ORG
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-display font-bold text-lg text-white mb-3">Your Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gaffer-surface flex items-center justify-center">
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

        {/* Performance Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-orange-gradient-btn opacity-90" />
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)'
          }} />
          <div className="relative p-5 flex items-center justify-between">
            <div>
              <p className="font-body text-white/70 text-xs uppercase tracking-widest mb-1">Season Performance</p>
              <p className="font-display font-black text-3xl text-white">67%</p>
              <p className="font-body text-white/70 text-xs mt-0.5">Win rate this season</p>
            </div>
            <TrendingUp size={48} className="text-white/30" />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-white">Recent Activity</h2>
            <button className="text-gaffer-orange text-xs font-body font-medium">See all</button>
          </div>
          <div className="space-y-2">
            {recentActivity.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center justify-between bg-gaffer-card border border-gaffer-border rounded-xl p-4"
              >
                <div>
                  <p className="font-body text-white text-sm font-medium">{item.title}</p>
                  <p className="font-body text-gaffer-muted text-xs mt-0.5">{item.time}</p>
                </div>
                <ChevronRight size={16} className="text-gaffer-subtle" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
