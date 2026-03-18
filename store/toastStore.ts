'use client'

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  addToast: (messageOrPayload: string | { message: string; type?: ToastType; duration?: number }, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (messageOrPayload, type = 'info', duration = 3000) => {
    let message: string
    let resolvedType: ToastType = type
    let resolvedDuration: number = duration

    if (typeof messageOrPayload === 'object') {
      message = messageOrPayload.message
      resolvedType = messageOrPayload.type ?? 'info'
      resolvedDuration = messageOrPayload.duration ?? 3000
    } else {
      message = messageOrPayload
    }

    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type: resolvedType, duration: resolvedDuration }],
    }))

    if (resolvedDuration !== Infinity) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, resolvedDuration)
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

// Alias for new code
export const useToastStore = useToast
