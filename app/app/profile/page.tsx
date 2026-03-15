'use client'

import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { User, Mail, Shield, ChevronRight } from 'lucide-react'

export default function ProfilePage() {
  const { user, role } = useAuthStore()
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Gaffer'
  const email = user?.email || 'Not provided'

  const profileItems = [
    { icon: User, label: 'Display Name', value: displayName },
    { icon: Mail, label: 'Email', value: email },
    { icon: Shield, label: 'Account Type', value: role === 'organization' ? 'Organization' : 'Personal' },
  ]

  return (
    <div className="min-h-screen bg-gaffer-bg">
      {/* Header */}
      <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-gaffer-surface to-gaffer-bg border-b border-gaffer-border text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-black text-3xl mx-auto mb-3 shadow-orange-glow"
        >
          {displayName[0].toUpperCase()}
        </motion.div>
        <h1 className="font-display font-bold text-xl text-white">{displayName}</h1>
        <p className="text-gaffer-muted text-sm font-body mt-1">{email}</p>
        <span className="inline-flex mt-2 text-xs bg-gaffer-orange/10 text-gaffer-orange border border-gaffer-orange/20 px-3 py-1 rounded-full font-body">
          {role === 'organization' ? 'Organization Account' : 'Personal Account'}
        </span>
      </div>

      <div className="px-6 py-6 space-y-4">
        <h2 className="font-display font-bold text-lg text-white">Profile Details</h2>
        {profileItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-4 bg-gaffer-card border border-gaffer-border rounded-xl p-4"
          >
            <div className="w-10 h-10 rounded-xl bg-gaffer-surface flex items-center justify-center">
              <item.icon size={18} className="text-gaffer-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-gaffer-muted text-xs">{item.label}</p>
              <p className="font-body text-white text-sm font-medium truncate mt-0.5">{item.value}</p>
            </div>
            <ChevronRight size={16} className="text-gaffer-subtle flex-shrink-0" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
