'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check } from 'lucide-react'

interface CopyLinkProps {
  /** The full URL to copy */
  link: string
  /** Button label before copy (default: "Copy Invite Link") */
  label?: string
  /** Button label after copy (default: "Link copied!") */
  copiedLabel?: string
  /** Extra Tailwind classes on the outer button */
  className?: string
}

/**
 * CopyLink — copies a URL to the clipboard and shows brief feedback.
 * Always visible after invite creation so players can be reached even
 * if the email delivery is delayed.
 */
export function CopyLink({
  link,
  label = 'Copy Invite Link',
  copiedLabel = 'Link copied!',
  className = '',
}: CopyLinkProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-display font-bold text-sm transition-all active:scale-[0.97] ${
        copied
          ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : 'bg-gaffer-orange/10 border-gaffer-orange/30 text-gaffer-orange hover:bg-gaffer-orange/20'
      } ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2"
          >
            <Check size={15} />
            {copiedLabel}
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2"
          >
            <Copy size={15} />
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
