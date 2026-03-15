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
      'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    cta: 'Continue as Personal',
    bgColor: 'from-gaffer-orange/20 to-gaffer-red/10',
  },
  organization: {
    title: 'Organization Account',
    description:
      'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    cta: 'Continue as Organization',
    bgColor: 'from-blue-500/20 to-gaffer-surface',
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

          {/* Bottom-sheet modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 px-4 pb-8"
          >
            <div className="bg-gaffer-surface border border-gaffer-border rounded-3xl overflow-hidden shadow-2xl max-w-sm mx-auto">
              {/* Header image */}
              <div className={`relative h-48 bg-gaffer-card overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${content.bgColor}`} />

                {/* Sport silhouette illustration */}
                <div className="absolute inset-0 flex items-end justify-center pb-4">
                  {type === 'personal' ? (
                    <svg
                      width="180"
                      height="160"
                      viewBox="0 0 180 160"
                      fill="none"
                      className="opacity-60"
                    >
                      {/* Soccer player silhouette */}
                      <circle cx="90" cy="30" r="18" fill="#FF6B00" />
                      <path
                        d="M60 155 C60 115 72 95 90 95 C108 95 120 115 120 155"
                        fill="#FF6B00"
                      />
                      <path
                        d="M75 120 L65 150 M105 120 L115 150"
                        stroke="#FF6B00"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="180"
                      height="160"
                      viewBox="0 0 180 160"
                      fill="none"
                      className="opacity-60"
                    >
                      {/* Group of people */}
                      <circle cx="55" cy="35" r="14" fill="#FF6B00" />
                      <path d="M32 120 C32 90 42 78 55 78 C68 78 78 90 78 120" fill="#FF6B00" />
                      <circle cx="90" cy="28" r="16" fill="#FF8533" />
                      <path d="M65 120 C65 88 76 75 90 75 C104 75 115 88 115 120" fill="#FF8533" />
                      <circle cx="125" cy="35" r="14" fill="#E53000" />
                      <path
                        d="M102 120 C102 90 112 78 125 78 C138 78 148 90 148 120"
                        fill="#E53000"
                      />
                    </svg>
                  )}
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <h2 className="font-display font-bold text-xl text-white">{content.title}</h2>
                <p className="font-body text-sm text-gaffer-muted leading-relaxed">
                  {content.description}
                </p>
                <GradientButton onClick={onContinue}>{content.cta}</GradientButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
