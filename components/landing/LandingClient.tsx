'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isStandalone } from '@/lib/pwa'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { IOSInstallBanner } from '@/components/IOSInstallBanner'
import { landingMarkup } from './landingMarkup'

const STYLES = ['/landing/phone.css', '/landing/device.css', '/landing/landing.css']

function loadScript(src: string) {
  return new Promise<HTMLScriptElement>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve(s)
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.body.appendChild(s)
  })
}

export default function LandingClient() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  // Initialize PWA hook to capture install prompt event early
  usePWAInstall()

  useEffect(() => {
    // iOS PWA deep-link recovery: when iOS opens the PWA at root (/) instead
    // of the actual invite URL (a known iOS standalone limitation), the
    // OnboardingClient stores the full invite URL in localStorage. We pick it
    // up here and send the player where they intended to go — no login needed.
    const pendingInvite = localStorage.getItem('gaffer-pending-invite-url')
    if (pendingInvite) {
      localStorage.removeItem('gaffer-pending-invite-url')
      router.replace(pendingInvite)
      return
    }

    // Redirect if already in PWA/Standalone mode
    if (isStandalone()) {
      router.replace('/onboarding/splash')
      return
    }
    setChecking(false)
  }, [router])

  // The landing page owns its own stylesheet and motion scripts; attach them only while it is on screen.
  useEffect(() => {
    if (checking) return
    let cancelled = false
    const links = STYLES.map((href) => {
      const l = document.createElement('link')
      l.rel = 'stylesheet'
      l.href = href
      document.head.appendChild(l)
      return l
    })
    const scripts: HTMLScriptElement[] = []
    const prevBg = document.body.style.background
    document.body.style.background = '#090A14'
    document.documentElement.style.background = '#090A14'
    ;(async () => {
      try {
        const w = window as unknown as { Phone?: unknown; Tour?: unknown }
        if (!w.Phone) scripts.push(await loadScript('/landing/phone.js'))
        if (!w.Tour) scripts.push(await loadScript('/landing/tour.js'))
        if (!cancelled) scripts.push(await loadScript('/landing/landing.js'))
      } catch {
        /* the static page still reads fine without the motion layer */
      }
    })()
    return () => {
      cancelled = true
      links.forEach((l) => l.remove())
      document.body.style.background = prevBg
      document.documentElement.style.background = ''
      document.body.classList.remove('ready')
      scripts.forEach((s) => s.remove())
    }
  }, [checking])

  if (checking) {
    return <div style={{ minHeight: '100vh', background: '#090A14' }} aria-busy="true" />
  }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: landingMarkup }} />
      {/* iOS-only: auto-appearing install banner + modal */}
      <IOSInstallBanner />
    </>
  )
}
