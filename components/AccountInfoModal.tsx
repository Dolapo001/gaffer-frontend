'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { GradientButton } from './GradientButton'
import { X } from 'lucide-react'

interface AccountInfoModalProps {
  isOpen: boolean
  type: 'personal' | 'organization'
  onContinue: () => void
  onClose: () => void
}

const modalContent = {
  personal: {
    title: 'Personal Account',
    description:
      'Your personal GAFFER account gives you full access to manage your sporting activities, track performance, connect with teams, and stay on top of your game. Build your profile, join competitions, and rise through the ranks.',
    image: '/images/personal-preview.jpg',
    cta: 'Continue as Personal',
  },
  organization: {
    title: 'Organization Account',
    description:
      'The GAFFER Organization account is built for clubs, academies, and tournament organizers. Manage rosters, schedule matches, run tournaments, and oversee your entire sports operation from one powerful dashboard.',
    image: '/images/org-preview.jpg',
    cta: 'Continue as Organization',
  },
}

export function AccountInfoModal({
  isOpen,
  type,
  onContinue,
  onClose,
}: AccountInfoModalProps) {
  const content = modalContent[type]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 px-4 pb-8"
          >
            <div className="bg-gaffer-surface border border-gaffer-border rounded-3xl overflow-hidden shadow-2xl max-w-sm mx-auto">
              {/* Header image placeholder */}
              <div className="relative h-44 bg-gaffer-card overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gaffer-orange/20 to-gaffer-red/20" />
                {/* Decorative sport silhouette */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {type === 'personal' ? (
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-30">
                      <circle cx="60" cy="28" r="16" fill="white" />
                      <path d="M28 100 C28 75 42 65 60 65 C78 65 92 75 92 100" fill="white" />
                      <circle cx="60" cy="28" r="12" fill="#FF6B00" />
                    </svg>
                  ) : (
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-30">
                      <rect x="20" y="30" width="80" height="60" rx="4" fill="white" />
                      <rect x="28" y="38" width="64" height="44" rx="2" fill="#FF6B00" />
                      <rect x="35" y="45" width="20" height="12" rx="1" fill="white" />
                      <rect x="60" y="45" width="25" height="3" rx="1" fill="white" />
                      <rect x="60" y="52" width="20" height="3" rx="1" fill="white" />
                    </svg>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <h2 className="font-display font-bold text-xl text-white">
                  {content.title}
                </h2>
                <p className="font-body text-sm text-gaffer-muted leading-relaxed">
                  {content.description}
                </p>
                <GradientButton onClick={onContinue}>
                  {content.cta}
                </GradientButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
