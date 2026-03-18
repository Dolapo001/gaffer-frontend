'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/store/toastStore'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-3 pointer-events-none w-full max-w-[340px] px-6">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl w-full
              backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)]
              ${toast.type === 'success' ? 'bg-[#16A34A]/20 text-[#16A34A]' : 
                toast.type === 'error' ? 'bg-red-500/20 text-red-500' : 
                toast.type === 'warning' ? 'bg-[#ff6b00]/20 text-[#ff6b00]' : 
                'bg-white/10 text-white'}
            `}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'warning' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>
            <p className="flex-1 text-[13px] font-bold tracking-tight">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="opacity-40 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
