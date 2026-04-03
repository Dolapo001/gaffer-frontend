'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Bell, Lock, Globe, HelpCircle, LogOut, ChevronRight, Smartphone } from 'lucide-react'

const settingsGroups = [
  {
    title: 'Preferences',
    items: [
      { icon: Bell, label: 'Notifications', desc: 'Manage push notifications' },
      { icon: Globe, label: 'Language', desc: 'English (default)' },
    ],
  },
  {
    title: 'Security',
    items: [
      { icon: Lock, label: 'Change Password', desc: 'Update your password' },
    ],
  },
  {
    title: 'App',
    items: [
      { icon: Smartphone, label: 'App Version', desc: 'v1.0.0' },
      { icon: HelpCircle, label: 'Help & Support', desc: 'Get assistance' },
    ],
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.replace('/onboarding/welcome')
  }

  return (
    <div className="min-h-screen bg-gaffer-bg">
      <div className="px-4 md:px-6 pt-12 pb-6 bg-gradient-to-b from-gaffer-surface to-gaffer-bg border-b border-gaffer-border">
        <h1 className="font-display font-bold text-2xl text-white">Settings</h1>
        <p className="font-body text-gaffer-muted text-sm mt-1">Manage your app preferences</p>
      </div>

      <div className="px-4 md:px-6 py-6 space-y-6">
        {settingsGroups.map((group, gi) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.1 }}
          >
            <h2 className="font-display font-semibold text-sm text-gaffer-muted uppercase tracking-widest mb-2 px-1">
              {group.title}
            </h2>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-4 bg-gaffer-card border border-gaffer-border rounded-xl p-4 hover:bg-gaffer-surface transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-gaffer-surface flex items-center justify-center">
                    <item.icon size={17} className="text-gaffer-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-white text-sm font-medium">{item.label}</p>
                    <p className="font-body text-gaffer-muted text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={15} className="text-gaffer-subtle flex-shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 bg-red-500/5 border border-red-500/20 rounded-xl p-4 hover:bg-red-500/10 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut size={17} className="text-red-400" />
            </div>
            <p className="font-body text-red-400 text-sm font-medium">Log Out</p>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
