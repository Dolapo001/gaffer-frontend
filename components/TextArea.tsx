'use client'

import { type TextareaHTMLAttributes, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { type FieldError } from 'react-hook-form'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: FieldError
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  label,
  error,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-body font-medium text-white/80 pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3.5 rounded-xl
            bg-gaffer-card border border-gaffer-border
            text-white placeholder:text-gaffer-subtle
            font-body text-sm min-h-[120px] resize-none
            transition-all duration-200
            focus:outline-none focus:border-gaffer-orange focus:shadow-input-focus
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
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

TextArea.displayName = 'TextArea'
