'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { X, LogOut, User, Settings as SettingsIcon, Home } from 'lucide-react'
import { useToast } from '@/store/toastStore'
import { AccountUpgradeModal } from '../AccountUpgradeModal'
import { useQuery } from '@tanstack/react-query'
import { listOrgs } from '@/lib/services/org.service'

interface OrganizationSidebarProps {
  onClose: () => void
}

export function OrganizationSidebar({ onClose }: OrganizationSidebarProps) {
  const router = useRouter()
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false)
  const [upgradeTarget, setUpgradeTarget] = React.useState<'personal' | 'organization'>('personal')
  const { user, setRole, updateUser, role: currentRole } = useAuthStore()
  const { addToast } = useToast()

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs, enabled: !!user })
  const org = orgs?.[0]

  const displayName = currentRole === 'organization' && org?.name 
      ? org.name 
      : user?.fullName || user?.email?.split('@')[0] || 'Gaffer'

  const displayImage = currentRole === 'organization' && org?.logoUrl 
      ? org.logoUrl 
      : user?.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"

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
        // If they already have an organization, they don't need to "start" one
        if (orgs && orgs.length > 0) {
            updateUser({ isOrgActive: true, lastRole: 'organization' })
            setRole('organization')
            onClose()
            addToast('Switched to organization account', 'success')
            router.push('/admin')
            return
        }
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
      <div className="flex flex-col items-center space-y-4 mt-6 mb-10 cursor-pointer" onClick={() => router.push('/admin/profile')}>
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-xl ring-4 ring-black/20">
          <img 
            src={displayImage} 
            className="w-full h-full object-cover" 
            alt={displayName} 
          />
        </div>
        <div className="text-center">
          <h3 className="font-chakra font-bold text-lg text-white tracking-tight">
            {displayName}
          </h3>
          <p className="text-[10px] font-chakra font-bold text-[#FF8A00] uppercase tracking-[2px] mt-1 italic">
             {currentRole === 'organization' ? 'Admin / Manager' : 'Personal Account'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-2 mb-10 w-full">
        <button 
          onClick={() => { router.push('/admin'); onClose(); }}
          className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#FF8A00]/40 group transition-all"
        >
          <Home size={20} className="text-white/40 group-hover:text-[#FF8A00]" />
          <span className="font-chakra font-bold text-sm text-white/80 group-hover:text-white uppercase tracking-wider">Dashboard</span>
        </button>
        <button 
          onClick={() => { router.push('/admin/profile'); onClose(); }}
          className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#FF8A00]/40 group transition-all"
        >
          <User size={20} className="text-white/40 group-hover:text-[#FF8A00]" />
          <span className="font-chakra font-bold text-sm text-white/80 group-hover:text-white uppercase tracking-wider">My Profile</span>
        </button>
        <button 
          onClick={() => { router.push('/admin/settings'); onClose(); }}
          className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#FF8A00]/40 group transition-all"
        >
          <SettingsIcon size={20} className="text-white/40 group-hover:text-[#FF8A00]" />
          <span className="font-chakra font-bold text-sm text-white/80 group-hover:text-white uppercase tracking-wider">Settings</span>
        </button>
      </nav>

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

      {/* Logout button at the very bottom */}
      <button
        onClick={async () => {
            const { logout } = useAuthStore.getState();
            await logout();
            router.push('/auth/login');
        }}
        className="text-white/40 hover:text-red-500 font-chakra font-bold text-sm uppercase tracking-widest transition-all py-4 px-5 rounded-2xl border border-white/5 hover:border-red-500/30 flex items-center justify-center gap-3 mt-auto"
      >
        <LogOut size={18} />
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
