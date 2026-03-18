'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface GradientButtonProps {
  children: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'outline' | 'ghost' | 'google'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  className?: string
  style?: React.CSSProperties
}

export function GradientButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  className = '',
  style = {},
}: GradientButtonProps) {
  const base = `relative flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-display font-semibold text-base tracking-wide transition-all duration-200 ${fullWidth ? 'w-full' : ''} disabled:opacity-50 disabled:cursor-not-allowed`

  const variants = {
    primary: 'bg-orange-gradient-btn text-white shadow-orange-glow hover:brightness-110',
    outline: 'bg-transparent border-2 border-white text-white hover:bg-white/10',
    ghost: 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm',
    google: 'bg-gaffer-card border border-gaffer-border text-white hover:bg-gaffer-border',
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      className={`${base} ${variants[variant]} ${className}`}
      style={style}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  )
}
