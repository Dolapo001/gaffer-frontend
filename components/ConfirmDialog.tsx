'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
  /** Backdrop tap. Defaults to onCancel; set it when cancel is a real action (e.g. navigate) */
  onDismiss?: () => void
}

/**
 * Modal confirmation dialog — used before irreversible actions
 * (e.g. revoking invites, deleting records).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  onDismiss,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onDismiss ?? onCancel}
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-gaffer-surface border border-gaffer-border rounded-2xl p-6 shadow-2xl"
            >
              <h2 className="font-display font-bold text-white text-lg mb-2">{title}</h2>
              <p className="text-gaffer-muted font-body text-sm leading-relaxed mb-6">{message}</p>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl border border-gaffer-border text-gaffer-muted font-body text-sm hover:text-white transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-3 rounded-xl font-display font-bold text-sm text-white ${
                    destructive
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-orange-gradient-btn'
                  } transition-colors`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
