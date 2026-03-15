'use client'

import { useState, type InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { type FieldError } from 'react-hook-form'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: FieldError
  showPasswordToggle?: boolean
}

export function AuthInput({
  label,
  error,
  showPasswordToggle = false,
  type,
  className = '',
  ...props
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const inputType = showPasswordToggle
    ? showPassword ? 'text' : 'password'
    : type

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-body font-medium text-white/80 pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`
            w-full px-4 py-3.5 rounded-xl
            bg-gaffer-card border border-gaffer-border
            text-white placeholder:text-gaffer-subtle
            font-body text-sm
            transition-all duration-200
            focus:outline-none focus:border-gaffer-orange focus:shadow-input-focus
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${showPasswordToggle ? 'pr-12' : ''}
            ${className}
          `}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gaffer-muted hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400 pl-1"
        >
          {error.message}
        </motion.p>
      )}
    </div>
  )
}
