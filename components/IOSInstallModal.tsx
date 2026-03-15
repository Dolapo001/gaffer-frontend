'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Share, Plus, X } from 'lucide-react'

interface IOSInstallModalProps {
  isOpen: boolean
  onClose: () => void
}

export function IOSInstallModal({ isOpen, onClose }: IOSInstallModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-8 z-50 bg-gaffer-surface border border-gaffer-border rounded-3xl p-6 shadow-2xl max-w-sm mx-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gaffer-muted hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="font-display font-bold text-lg text-white mb-1">
              Install GAFFER
            </h3>
            <p className="text-gaffer-muted text-sm font-body mb-5">
              Add to your Home Screen to use the full app experience.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                  <Share size={18} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium font-body">
                    1. Tap the Share button
                  </p>
                  <p className="text-gaffer-muted text-xs font-body mt-0.5">
                    Tap the share icon at the bottom of Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gaffer-orange/20 border border-gaffer-orange/30 flex items-center justify-center">
                  <Plus size={18} className="text-gaffer-orange" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium font-body">
                    2. Add to Home Screen
                  </p>
                  <p className="text-gaffer-muted text-xs font-body mt-0.5">
                    Scroll down and tap "Add to Home Screen"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <span className="text-green-400 text-lg">✓</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium font-body">
                    3. Open GAFFER
                  </p>
                  <p className="text-gaffer-muted text-xs font-body mt-0.5">
                    Launch the app from your Home Screen
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow pointing down to Safari toolbar */}
            <div className="mt-5 flex justify-center">
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-gaffer-orange"
              >
                ↓
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
