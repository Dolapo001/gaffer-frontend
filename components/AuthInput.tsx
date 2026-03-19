'use client'

import { useState, type InputHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { type FieldError } from 'react-hook-form'

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: FieldError
  showPasswordToggle?: boolean
  prefix?: string
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(({
  label,
  error,
  showPasswordToggle = false,
  prefix,
  type,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)

  const inputType = showPasswordToggle
    ? showPassword ? 'text' : 'password'
    : type

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-chakra font-medium text-white/70 pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-chakra text-sm pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`
            w-full py-3.5 rounded-xl
            bg-white/5 border border-white/10
            text-white placeholder:text-white/20
            font-chakra text-sm
            transition-all duration-200
            focus:outline-none focus:border-gaffer-orange focus:ring-1 focus:ring-gaffer-orange/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${prefix ? 'pl-9' : 'px-4'}
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
})

AuthInput.displayName = 'AuthInput'
