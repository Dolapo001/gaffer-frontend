'use client'

import { type SelectHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { type FieldError } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: FieldError
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectInput({
  label,
  error,
  options,
  placeholder = 'Select...',
  className = '',
  ...props
}: SelectInputProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-body font-medium text-white/80 pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`
            w-full px-4 py-3.5 rounded-xl appearance-none
            bg-gaffer-card border border-gaffer-border
            text-white font-body text-sm
            transition-all duration-200 cursor-pointer
            focus:outline-none focus:border-gaffer-orange focus:shadow-input-focus
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="" disabled className="bg-gaffer-card text-gaffer-subtle">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-gaffer-card text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gaffer-muted">
          <ChevronDown size={16} />
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
}
