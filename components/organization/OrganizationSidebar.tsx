'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { AccountUpgradeModal } from '../AccountUpgradeModal'
import { useQuery, useMutation } from '@tanstack/react-query'
import { listOrgs, deleteOrg } from '@/lib/services/org.service'
import { updateProfile } from '@/lib/services/user.service'
import { ConfirmDialog } from '../ConfirmDialog'

// --- Custom Inline SVGs ---
const CloseIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

const HomeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-[18px] h-[18px] ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 4L21 9.5V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9.5Z" />
    <path d="M9 22V12H15V22" />
  </svg>
)

const UserIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-[18px] h-[18px] ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" />
  </svg>
)

const SettingsIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-[18px] h-[18px] ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const LogOutIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-[18px] h-[18px] ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)

interface OrganizationSidebarProps {
  onClose: () => void
}

export function OrganizationSidebar({ onClose }: OrganizationSidebarProps) {
  const router = useRouter()
  const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false)
  const [upgradeTarget, setUpgradeTarget] = React.useState<'personal' | 'organization'>('personal')
  const [showDeleteOrgConfirm, setShowDeleteOrgConfirm] = React.useState(false)
  const { user, setRole, updateUser, role: currentRole, logout } = useAuthStore()
  const { addToast } = useToast()

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrgs, enabled: !!user })
  const org = orgs?.[0]

  const deleteOrgMutation = useMutation({
    mutationFn: () => deleteOrg(org!._id),
    onSuccess: async () => {
      addToast('Organisation deleted.', 'success')
      onClose()
      await logout()
      router.replace('/auth/login')
    },
    onError: () => addToast('Failed to delete organisation. Please try again.', 'error'),
  })

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

    // Only show the "Setup Personal Account" modal when the user genuinely has
    // no personal profile yet (no fullName AND isPersonalActive is explicitly
    // false). We deliberately do NOT gate on !isPersonalActive alone because
    // the /auth/refresh endpoint often omits that field, causing it to be
    // undefined after every app restart even for users who already set up.
    const needsPersonalSetup =
      role === 'personal' &&
      !user?.fullName &&
      user?.isPersonalActive === false

    if (needsPersonalSetup) {
        setUpgradeTarget('personal')
        setUpgradeModalOpen(true)
        return
    }

    if (role === 'organization' && !user?.isOrgActive) {
        if (orgs && orgs.length > 0) {
            updateUser({ isOrgActive: true, lastRole: 'organization' })
            setRole('organization')
            onClose()
            addToast('Switched to organization account', 'success')
            router.push('/admin')
            return
        }
        // No org account yet — navigate to the isolated org setup page.
        // We deliberately do NOT open a modal here: the modal renders at
        // z-[100] which is BELOW the sidebar (z-[110]) and the BottomNavbar
        // (z-[100]), making it inaccessible. A full-page navigation to
        // /onboarding/organization uses a layout with no navbar/sidebar at all.
        onClose()
        router.push('/onboarding/organization')
        return
    }

    setRole(role)
    onClose()

    addToast(`Switched to ${role} account`, 'success')

    // Persist lastRole to the server so that useAuthListener never overwrites
    // the user's explicit choice when the app reloads and calls /auth/refresh.
    // Fire-and-forget — we don't block the navigation on this.
    updateProfile({ lastRole: role }).catch(() => {
      // Non-fatal: the role is already set client-side and in the cookie.
    })

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
      className="fixed left-0 top-0 bottom-0 w-[300px] bg-[#14151F] z-[110] shadow-2xl border-r border-white/5 flex flex-col p-6 pt-[calc(2rem+env(safe-area-inset-top))] overflow-y-auto no-scrollbar font-sans"
    >
      <div className="absolute top-0 right-0 w-full h-[250px] bg-[#ff6b00]/10 blur-[80px] pointer-events-none -translate-y-1/2" />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 p-2 rounded-full hover:bg-white/10 text-white/50 active:scale-95 transition-all z-10"
      >
        <CloseIcon />
      </button>

      {/* Profile Section */}
      <div
        className="relative flex flex-col items-center space-y-4 mt-8 mb-10 cursor-pointer group"
        onClick={() => { router.push(currentRole === 'personal' ? '/app/profile' : '/admin/profile'); onClose(); }}
      >
        <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-[#1E2032] group-hover:scale-105 transition-transform duration-300 relative z-10">
          <img
            src={displayImage}
            className="w-full h-full object-cover"
            alt={displayName}
          />
        </div>
        <div className="text-center relative z-10">
          <h3 className="font-black text-xl text-white tracking-tight uppercase group-hover:text-[#ff6b00] transition-colors">
            {displayName}
          </h3>
          <p className="text-[10px] font-bold text-[#FF8A00] uppercase tracking-widest mt-1 opacity-80">
             {currentRole === 'organization' ? 'Admin / Manager' : 'Personal Account'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-3 mb-10 w-full relative z-10">
        <h4 className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-2 px-2">Navigation</h4>

        <button
          onClick={() => { router.push(currentRole === 'personal' ? '/app/dashboard' : '/admin'); onClose(); }}
          className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-[#1E2032]/50 border border-white/5 hover:border-[#ff6b00]/30 hover:bg-[#ff6b00]/10 group transition-all"
        >
          <HomeIcon className="text-white/40 group-hover:text-[#ff6b00] transition-colors" />
          <span className="font-black text-sm text-white/70 group-hover:text-white uppercase tracking-wider">Dashboard</span>
        </button>
        <button
          onClick={() => { router.push(currentRole === 'personal' ? '/app/profile' : '/admin/profile'); onClose(); }}
          className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-[#1E2032]/50 border border-white/5 hover:border-[#ff6b00]/30 hover:bg-[#ff6b00]/10 group transition-all"
        >
          <UserIcon className="text-white/40 group-hover:text-[#ff6b00] transition-colors" />
          <span className="font-black text-sm text-white/70 group-hover:text-white uppercase tracking-wider">My Profile</span>
        </button>
        <button
          onClick={() => { router.push(currentRole === 'personal' ? '/app/settings' : '/admin/settings'); onClose(); }}
          className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-[#1E2032]/50 border border-white/5 hover:border-[#ff6b00]/30 hover:bg-[#ff6b00]/10 group transition-all"
        >
          <SettingsIcon className="text-white/40 group-hover:text-[#ff6b00] transition-colors" />
          <span className="font-black text-sm text-white/70 group-hover:text-white uppercase tracking-wider">Settings</span>
        </button>
      </nav>

      {/* Role Switcher Section */}
      <div className="space-y-3 pt-6 border-t border-white/10 relative z-10 w-full mb-10">
        <h4 className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-2 px-2">Switch Account</h4>

        {user?.isPersonalActive !== false && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleRoleSwitch('personal')}
            className={`w-full py-4 rounded-xl font-black text-sm transition-all border shadow-md relative overflow-hidden group ${
                currentRole === 'personal'
                ? 'bg-gradient-to-r from-[#FF8904] to-[#ff4d00] border-transparent text-white'
                : 'bg-[#1E2032] border-white/5 text-white/60 hover:text-white hover:border-[#ff6b00]/30'
            }`}
          >
            {currentRole === 'personal' && (
                <div className="absolute inset-x-0 top-0 h-[1px] bg-white/30" />
            )}
            Personal Account
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleRoleSwitch('organization')}
          className={`w-full py-4 rounded-xl font-black text-sm transition-all text-center border shadow-md relative group ${
              currentRole === 'organization'
              ? 'bg-gradient-to-r from-[#FF8904] to-[#ff4d00] border-transparent text-white'
              : 'bg-[#1E2032] border-white/5 text-white/60 hover:text-white hover:border-[#ff6b00]/30'
          }`}
        >
          {currentRole === 'organization' && (
              <div className="absolute inset-x-0 top-0 h-[1px] bg-white/30" />
          )}
          Organization Account
        </motion.button>
      </div>

      {/* Delete Organisation */}
      {currentRole === 'organization' && org && (
        <button
          onClick={() => setShowDeleteOrgConfirm(true)}
          disabled={deleteOrgMutation.isPending}
          className="text-red-600/60 hover:text-red-500 font-bold text-xs uppercase tracking-[0.2em] transition-all py-3 px-5 rounded-2xl border border-red-900/20 hover:border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-3 relative z-10 disabled:opacity-50"
        >
          {deleteOrgMutation.isPending ? 'Deleting...' : 'Delete Organisation'}
        </button>
      )}

      {/* Logout button */}
      <button
        onClick={async () => {
            await logout();
            router.push('/auth/login');
        }}
        className="text-white/40 hover:text-red-500 font-bold text-sm uppercase tracking-[0.2em] transition-all py-4 px-5 rounded-2xl border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 flex items-center justify-center gap-3 mt-auto relative z-10"
      >
        <LogOutIcon />
        Sign Out
      </button>
    </motion.aside>

    <AnimatePresence>
        {upgradeModalOpen && (
            <AccountUpgradeModal
                isOpen={upgradeModalOpen}
                onClose={() => {
                    setUpgradeModalOpen(false)
                    onClose()
                }}
                targetRole={upgradeTarget}
            />
        )}
    </AnimatePresence>

    <ConfirmDialog
      open={showDeleteOrgConfirm}
      title="Delete Organisation"
      message="This will permanently delete your organisation and all associated competitions, teams, and data. This cannot be undone."
      confirmLabel="Delete Organisation"
      cancelLabel="Cancel"
      destructive
      onConfirm={() => { setShowDeleteOrgConfirm(false); deleteOrgMutation.mutate() }}
      onCancel={() => setShowDeleteOrgConfirm(false)}
    />
    </>
  )
}
