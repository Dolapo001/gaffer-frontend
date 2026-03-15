'use client'

import { useState, useEffect } from 'react'
import {
  setDeferredPrompt,
  triggerInstallPrompt,
  isStandalone,
  isIOS,
} from '@/lib/pwa'

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    setIsInstalled(isStandalone())
    setIsIOSDevice(isIOS())

    // Listen for Chrome install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (isIOSDevice) {
      setShowIOSInstructions(true)
      return
    }
    const accepted = await triggerInstallPrompt()
    if (accepted) setIsInstalled(true)
  }

  const dismissIOSInstructions = () => setShowIOSInstructions(false)

  return {
    canInstall,
    isInstalled,
    isIOSDevice,
    showIOSInstructions,
    install,
    dismissIOSInstructions,
  }
}
