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
    if (selectedRole === 'organization') {
      router.push('/auth/signup/organization')
    } else {
      router.push('/auth/signup')
    }
  }

  return (
    <div className="relative min-h-screen bg-[#181928] overflow-hidden flex flex-col">
      {/* Background with explicit color and image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.jpg"
          alt="hero bg"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[#181928]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#181928]/60 to-[#181928]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 px-6 pt-14 pb-4">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white backdrop-blur-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl text-white font-chakra font-bold tracking-tight">New Account</h2>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex-1 flex flex-col px-6 pb-12"
      >
        {/* Title Area */}
        <div className="mb-10 mt-4 px-1">
          <h1 className="font-chakra font-bold text-5xl text-white leading-tight">Hello,</h1>
          <h1 className="font-chakra font-black text-5xl bg-gradient-to-r from-[#FF8904] to-[#E7000B] bg-clip-text text-transparent leading-tight uppercase tracking-tight">
            GAFFER
          </h1>
          <p className="font-chakra text-white/60 text-base mt-4 font-medium">
            Select an account type that suits your needs
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <RoleCard
            title="Personal"
            description="Manage your personal Spoting activities"
            icon={null} // We'll use the image in circular container now
            imageSrc="/images/hero-bg.jpg"
            selected={selectedRole === 'personal'}
            onSelect={() => setSelectedRole('personal')}
          />
          <RoleCard
            title="Organization"
            description="Manage your Sports organization or activities"
            icon={null}
            imageSrc="/images/handshake_news.png"
            selected={selectedRole === 'organization'}
            onSelect={() => setSelectedRole('organization')}
          />
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="space-y-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={!selectedRole}
            className={`w-full py-4 rounded-2xl font-chakra font-bold text-xl tracking-wide shadow-xl transition-all ${
              selectedRole 
                ? 'bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white' 
                : 'bg-white/10 text-white/30 cursor-not-allowed blur-[0.5px]'
            }`}
          >
            Next
          </motion.button>

          <p className="text-center text-white/40 text-sm font-chakra font-medium">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-[#FF8904] font-bold hover:underline"
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
