'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface InstallHelpProps {
  isOpen: boolean
  onClose: () => void
  /** What the visitor was trying to do, so the copy matches their tap. */
  intent: 'join' | 'organise' | 'login'
  /** Starts the browser install prompt. Resolves false when the browser has not offered one. */
  onInstall: () => Promise<boolean>
}

const HEADLINE: Record<InstallHelpProps['intent'], string> = {
  join: 'Install Gaffer to join a league',
  organise: 'Install Gaffer to run a tournament',
  login: 'Install Gaffer to log in',
}

/**
 * Shown when someone taps a sign-up / log-in button in a normal browser tab.
 * Gaffer only runs as an installed app, so we explain how to install it
 * (the browser has no install prompt to show).
 */
export function InstallHelp({ isOpen, onClose, intent, onInstall }: InstallHelpProps) {
  const [unavailable, setUnavailable] = useState(false)

  const install = async () => {
    const started = await onInstall()
    if (started) onClose()
    else setUnavailable(true)
  }

  const close = () => {
    setUnavailable(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000]"
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={HEADLINE[intent]}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-8 z-[1001] bg-gaffer-surface border border-gaffer-border rounded-3xl p-6 shadow-2xl max-w-sm mx-auto"
          >
            <button onClick={close} aria-label="Close" className="absolute top-4 right-4 text-gaffer-muted hover:text-white">
              <X size={20} />
            </button>
            <h3 className="font-display font-bold text-lg text-white mb-1">{HEADLINE[intent]}</h3>
            <p className="text-gaffer-muted text-sm font-body mb-5">
              Gaffer works as an app on your phone. It takes a few seconds and needs no app store.
            </p>
            <button
              onClick={install}
              className="w-full mb-4 rounded-2xl bg-gaffer-orange py-3 font-display font-bold text-black"
            >
              Install app
            </button>
            {unavailable && (
              <p role="status" className="text-gaffer-muted text-xs font-body mb-3">
                Your browser has not offered the install yet. Use these steps instead:
              </p>
            )}
            <ol className="space-y-3 text-sm font-body text-white list-decimal list-inside">
              <li>Open your browser menu (the three dots).</li>
              <li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
              <li>Open <b>Gaffer</b> from your home screen to get started.</li>
            </ol>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
