'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Home, Trophy, Newspaper, Gamepad2, X, Plus } from 'lucide-react'

interface OrganizationSidebarProps {
  onClose: () => void
}

export function OrganizationSidebar({ onClose }: OrganizationSidebarProps) {
  const router = useRouter()
  const { user, setRole } = useAuthStore()

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Ojedokun Olaniyi'

  const handleRoleSwitch = (role: 'personal' | 'organization') => {
    setRole(role)
    onClose()
    if (role === 'personal') {
      router.push('/app/dashboard')
    } else {
      router.push('/admin')
    }
  }

  return (
    <motion.aside
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#0F111A] z-[70] shadow-2xl flex flex-col p-8 space-y-12 overflow-y-auto"
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/40"
      >
        <X size={20} />
      </button>

      {/* User Status Section */}
      <div className="flex flex-col items-center space-y-4 pt-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity" />
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500/20 bg-gaffer-card ring-2 ring-black">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky" 
              className="w-full h-full object-cover" 
              alt={displayName} 
            />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-chakra font-bold text-lg text-white tracking-tight uppercase">
            {displayName}
          </h3>
        </div>
      </div>

      {/* Role Switcher Section (As per design 2) */}
      <div className="space-y-3 pt-4">
        <button
          onClick={() => handleRoleSwitch('personal')}
          className="w-full h-12 rounded-xl font-chakra font-black text-xs uppercase tracking-wider text-white transition-all transform active:scale-95 shadow-lg shadow-orange-900/10"
          style={{ background: 'linear-gradient(90deg, #FF8A00 0%, #FF0000 100%)' }}
        >
          Personal Account
        </button>
        <button
          onClick={() => handleRoleSwitch('organization')}
          className="w-full h-12 rounded-xl font-chakra font-bold text-xs uppercase tracking-wider text-white/90 hover:text-white transition-all bg-white/5 border border-white/5"
        >
          Organization Account
        </button>
      </div>

      {/* Static Menu (Optional extension) */}
      <div className="flex-1 border-t border-white/5 pt-8 -mx-8 px-8">
        <nav className="space-y-2">
          {[
            { label: 'Home', icon: Home, active: true },
            { label: 'Tournaments', icon: Trophy },
            { label: 'Matches', icon: Gamepad2 }
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors font-chakra font-bold uppercase tracking-tight text-xs ${
                item.active ? 'bg-orange-600/10 text-orange-500' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </motion.aside>
  )
}
