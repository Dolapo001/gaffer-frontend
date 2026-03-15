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
    image: '/images/onboarding-preview.jpg',
  },
  organization: {
    title: 'Organization Account',
    description:
      'lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    cta: 'Continue as Organization',
    image: '/images/hero-bg.jpg',
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
              <div className="relative h-52 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={content.image}
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gaffer-surface via-transparent to-transparent" />

                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <h2 className="font-display font-bold text-xl text-white">{content.title}</h2>

                {/* Description in bordered box matching design */}
                <div className="rounded-xl border border-gaffer-border p-4">
                  <p className="font-body text-sm text-gaffer-muted leading-relaxed">
                    {content.description}
                  </p>
                </div>

                <GradientButton onClick={onContinue}>{content.cta}</GradientButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
