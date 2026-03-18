'use client'

import { useState, useEffect } from 'react'
import { getDeferredPrompt, triggerInstallPrompt, isStandalone, isIOS } from '@/lib/pwa'

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const standalone = isStandalone()
    setIsInstalled(standalone)
    
    // Always consider iOS installable if not already installed
    if (isIOS() && !standalone) {
      setIsInstallable(true)
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      // Store event globally in lib/pwa
      const { setDeferredPrompt } = require('@/lib/pwa')
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Check if it's already installable (event might have fired already)
    if (getDeferredPrompt()) {
      setIsInstallable(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    // If already in standalone mode, clicking "GO TO DASHBOARD" works
    if (isInstalled) {
      window.location.href = '/app/dashboard'
      return true
    }
    
    // For iOS, we show instructions
    if (isIOS()) {
      setShowIOSModal(true)
      return false
    }
    
    // Explicitly check for deferred prompt
    const prompt = getDeferredPrompt()
    if (!prompt) {
      return false
    }

    setIsInstalling(true)
    const success = await triggerInstallPrompt()
    setIsInstalling(false)
    
    if (success) {
      setIsInstallable(false)
      setIsInstalled(true)
      // Redirect after install
      setTimeout(() => {
        window.location.href = '/app/dashboard'
      }, 800)
    }
    
    return success
  }

  return { isInstallable, isInstalled, isInstalling, handleInstall, showIOSModal, setShowIOSModal }
}
