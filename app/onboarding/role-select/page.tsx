'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore, type UserRole } from '@/store/authStore'
import { RoleCard } from '@/components/RoleCard'
import { GradientButton } from '@/components/GradientButton'
import { AccountInfoModal } from '@/components/AccountInfoModal'
import { ChevronLeft, User, Building2 } from 'lucide-react'

export default function RoleSelectPage() {
  const router = useRouter()
  const { setRole } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState<UserRole>(null)
  const [showModal, setShowModal] = useState(false)

  const handleNext = () => {
    if (!selectedRole) return
    setRole(selectedRole)
    setShowModal(true)
  }

  const handleContinue = () => {
    setShowModal(false)
    router.push('/auth/signup')
  }

  return (
    <div className="min-h-screen bg-gaffer-bg flex flex-col">
      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-6 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs text-gaffer-muted font-body tracking-wide">New Account</span>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex-1 flex flex-col px-6 pb-10"
      >
        {/* Title */}
        <div className="mb-6 mt-2">
          <h1 className="font-display font-black text-4xl text-white leading-tight">Hello,</h1>
          <h1 className="font-display font-black text-4xl text-gradient-orange leading-tight">
            GAFFER
          </h1>
          <p className="font-body text-gaffer-muted text-sm mt-2 leading-relaxed">
            Select an account type that suits your needs
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <RoleCard
            title="Personal"
            description="Manage your personal Sporting activities"
            icon={<User size={28} className={selectedRole === 'personal' ? 'text-gaffer-orange' : 'text-gaffer-muted'} />}
            selected={selectedRole === 'personal'}
            onSelect={() => setSelectedRole('personal')}
          />
          <RoleCard
            title="Organization"
            description="Manage your Sports organization or activities"
            icon={<Building2 size={28} className={selectedRole === 'organization' ? 'text-gaffer-orange' : 'text-gaffer-muted'} />}
            selected={selectedRole === 'organization'}
            onSelect={() => setSelectedRole('organization')}
          />
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="space-y-3">
          <GradientButton
            onClick={handleNext}
            disabled={!selectedRole}
            className={!selectedRole ? 'opacity-50' : ''}
          >
            Next
          </GradientButton>

          <p className="text-center text-gaffer-muted text-xs font-body">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-gaffer-orange font-medium hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </motion.div>

      {/* Account info modal */}
      {selectedRole && (
        <AccountInfoModal
          isOpen={showModal}
          type={selectedRole}
          onContinue={handleContinue}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
