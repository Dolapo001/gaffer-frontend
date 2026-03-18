'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share, X } from 'lucide-react'
import Image from 'next/image'
import { isIOS, isStandalone } from '@/lib/pwa'
import { IOSInstallModal } from '@/components/IOSInstallModal'

const DISMISSED_KEY = 'gaffer-ios-banner-dismissed'

export function IOSInstallBanner() {
  const [bannerVisible, setBannerVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!isIOS() || isStandalone()) return
    if (typeof localStorage !== 'undefined' && localStorage.getItem(DISMISSED_KEY)) return

    // Auto-show banner after 2.5s, then auto-open modal after 5s on first visit
    const bannerTimer = setTimeout(() => setBannerVisible(true), 2500)
    const modalTimer = setTimeout(() => setModalOpen(true), 5000)

    return () => {
      clearTimeout(bannerTimer)
      clearTimeout(modalTimer)
    }
  }, [])

  const dismiss = () => {
    setBannerVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  const openModal = () => setModalOpen(true)

  return (
    <>
      {/* Persistent bottom banner */}
      <AnimatePresence>
        {bannerVisible && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed bottom-0 inset-x-0 z-[150] px-4 pb-4"
          >
            {/* Card */}
            <div className="relative rounded-2xl bg-[#1a1c28] border border-white/10 p-4 shadow-[0_-4px_40px_rgba(0,0,0,0.6)] flex items-center gap-3">
              {/* App icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-brand-gradient flex items-center justify-center shadow-lg">
                <Image
                  src="/icons/icon-96x96.png"
                  alt="GAFFER"
                  width={48}
                  height={48}
                  className="rounded-xl"
                  onError={(e) => {
                    // fallback if icon missing
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-display font-700 text-sm leading-tight">
                  Install GAFFER
                </p>
                <p className="text-white/50 text-xs font-body mt-0.5 leading-snug flex items-center gap-1 flex-wrap">
                  Tap <Share size={11} className="inline text-white/70 flex-shrink-0" /> then
                  <span className="text-white/70">&ldquo;Add to Home Screen&rdquo;</span>
                </p>
              </div>

              {/* Install button */}
              <button
                onClick={openModal}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-brand-gradient text-white text-xs font-display font-700 uppercase tracking-wide shadow-md active:scale-95 transition-transform"
              >
                How?
              </button>

              {/* Dismiss */}
              <button
                onClick={dismiss}
                className="flex-shrink-0 text-white/30 hover:text-white/70 p-1 transition-colors"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>

            {/* Bouncing arrow pointing to Safari share bar */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="flex justify-center mt-2 text-orange-gaffer text-xl leading-none"
              aria-hidden
            >
              ↓
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full step-by-step modal */}
      <IOSInstallModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
