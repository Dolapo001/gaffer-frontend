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
      'Personal accounts are designed for players, fans, and individual sports enthusiasts. Join leagues, track your stats, and build your dream team.',
    cta: 'Continue as Personal',
    image: '/images/messi.png',
  },
  organization: {
    title: 'Organization Account',
    description:
      'Organization accounts are designed for sport academies, clubs, competitions organizers, federations, Teams, Schools, and Companies.',
    cta: 'Continue as Organization',
    image: '/images/handshake_news.png',
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          />

          {/* Centered Modal to match design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="bg-white rounded-[24px] overflow-hidden shadow-2xl max-w-sm w-full relative">
              {/* Header image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={content.image}
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 flex flex-col items-center text-center">
                <h2 
                  className="font-chakra font-black text-2xl text-black uppercase tracking-tight"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {content.title}
                </h2>

                {/* Description in red-bordered box matching design */}
                <div 
                  className="rounded-2xl border-[1.2px] p-5 w-full text-left"
                  style={{ borderColor: '#FF3B30' }}
                >
                  <p className="font-body text-[13px] text-gray-800 leading-[1.6] font-medium">
                    {content.description}
                  </p>
                </div>

                <div className="w-full pt-1">
                  <GradientButton 
                    onClick={onContinue}
                    className="w-full h-14 rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-orange-500/20"
                    style={{
                      background: 'linear-gradient(90deg, #FF8904 0%, #E7000B 100%)'
                    }}
                  >
                    {content.cta}
                  </GradientButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
