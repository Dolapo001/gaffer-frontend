'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { X } from 'lucide-react'
import { useToast } from '@/store/toastStore'
import { AccountUpgradeModal } from '../AccountUpgradeModal'

interface OrganizationSidebarProps {
  onClose: () => void
}

export function OrganizationSidebar({ onClose }: OrganizationSidebarProps) {
  const router = useRouter()
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false)
  const [upgradeTarget, setUpgradeTarget] = React.useState<'personal' | 'organization'>('personal')
  const { user, setRole, role: currentRole } = useAuthStore()
  const { addToast } = useToast()

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Gaffer'

  const handleRoleSwitch = (role: 'personal' | 'organization') => {
    if (role === currentRole) {
      onClose()
      return
    }

    // Check if the user has activated this role
    if (role === 'personal' && !user?.isPersonalActive) {
        setUpgradeTarget('personal')
        setUpgradeModalOpen(true)
        return
    }

    if (role === 'organization' && !user?.isOrgActive) {
        setUpgradeTarget('organization')
        setUpgradeModalOpen(true)
        return
    }

    setRole(role)
    onClose()
    
    addToast(`Switched to ${role} account`, 'success')
    
    if (role === 'personal') {
      router.push('/app/dashboard')
    } else {
      router.push('/admin')
    }
  }

  return (
    <>
    <motion.aside
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#181928] z-[70] shadow-2xl flex flex-col p-8 overflow-y-auto no-scrollbar"
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/40 active:scale-95 transition-transform"
      >
        <X size={24} />
      </button>

      {/* Profile Section */}
      <div className="flex flex-col items-center space-y-4 mt-12 mb-10">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-xl ring-4 ring-black/20">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky" 
            className="w-full h-full object-cover" 
            alt={displayName} 
          />
        </div>
        <div className="text-center">
          <h3 className="font-chakra font-bold text-lg text-white tracking-tight">
            {displayName}
          </h3>
          <p className="text-[10px] font-chakra font-bold text-[#FF8A00] uppercase tracking-[2px] mt-1 italic">
             {currentRole === 'organization' ? 'Manager' : 'Personal'}
          </p>
        </div>
      </div>

      {/* Role Switcher Section */}
      <div className="space-y-4 pt-10 border-t border-white/5">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleRoleSwitch('personal')}
          className="w-full py-4 rounded-xl font-chakra font-bold text-sm text-white transition-all shadow-lg overflow-hidden relative group"
          style={{ 
              background: 'linear-gradient(90deg, #FF8904 0%, #E7000B 100%)',
              opacity: currentRole === 'personal' ? 1 : 0.85
          }}
        >
          {currentRole === 'personal' && (
              <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent" />
          )}
          Personal Account
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleRoleSwitch('organization')}
          className={`w-full py-4 rounded-xl font-chakra font-bold text-sm transition-all text-center border ${
              currentRole === 'organization' 
              ? 'bg-white/10 border-[#FF8A00] text-[#FF8A00] font-black' 
              : 'border-white/5 text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Organization Account
        </motion.button>
      </div>

      {/* System Spacer */}
      <div className="flex-1" />

      {/* Optional: Logout button at the very bottom */}
      <button
        onClick={async () => {
            const { logout } = useAuthStore.getState();
            await logout();
            router.push('/auth/login');
        }}
        className="text-white/20 text-xs font-chakra font-bold uppercase tracking-widest hover:text-red-500 transition-colors pb-4 flex items-center justify-center gap-2"
      >
        Sign Out
      </button>
    </motion.aside>

    <AnimatePresence>
        {upgradeModalOpen && (
            <AccountUpgradeModal 
                isOpen={upgradeModalOpen} 
                onClose={() => {
                    setUpgradeModalOpen(false)
                    onClose() // Also close sidebar
                }}
                targetRole={upgradeTarget}
            />
        )}
    </AnimatePresence>
    </>
  )
}
