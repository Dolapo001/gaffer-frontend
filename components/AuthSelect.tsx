'use client'

import { type SelectHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { type FieldError } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'

interface AuthSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: FieldError
  options: { value: string; label: string }[]
  placeholder?: string
}

export const AuthSelect = forwardRef<HTMLSelectElement, AuthSelectProps>(({
  label,
  error,
  options,
  placeholder = 'Select...',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-chakra font-medium text-white/70 pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-4 py-3.5 rounded-xl
            bg-white/5 border border-white/10
            text-white placeholder:text-white/20
            font-chakra text-sm
            transition-all duration-200
            appearance-none
            focus:outline-none focus:border-gaffer-orange focus:ring-1 focus:ring-gaffer-orange/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="" disabled className="bg-[#181928] text-white/40">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#181928] text-white">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
          <ChevronDown size={18} />
        </div>
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

AuthSelect.displayName = 'AuthSelect'
