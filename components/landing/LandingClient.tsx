'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isStandalone, isIOS, getDeferredPrompt, triggerInstallPrompt } from '@/lib/pwa'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { IOSInstallBanner } from '@/components/IOSInstallBanner'
import { IOSInstallModal } from '@/components/IOSInstallModal'
import { InstallHelp } from './InstallHelp'
import { ctaAction } from './ctaGate'
import { landingMarkup } from './landingMarkup'

const STYLES = ['/landing/phone.css', '/landing/device.css', '/landing/landing.css']

type LandingWindow = Window & { Phone?: unknown; Tour?: unknown; __gafferLanding?: { destroy: () => void } }

// The element is registered with `bucket` before it loads, so cleanup removes it even if the page is left mid-load.
function loadScript(src: string, bucket: HTMLElement[]) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    bucket.push(s)
    document.body.appendChild(s)
  })
}

function loadStyle(href: string, bucket: HTMLElement[]) {
  return new Promise<void>((resolve) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = href
    // a stylesheet that fails to load should not block the page; it just renders unstyled
    l.onload = () => resolve()
    l.onerror = () => resolve()
    bucket.push(l)
    document.head.appendChild(l)
  })
}

export default function LandingClient() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  // Initialize PWA hook to capture install prompt event early
  const { handleInstall, showIOSModal, closeIOSModal } = usePWAInstall()
  const [helpIntent, setHelpIntent] = useState<'join' | 'organise' | 'login' | null>(null)

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
    const added: HTMLElement[] = []
    const w = window as LandingWindow
    const prevBg = document.body.style.background
    document.body.style.background = '#090A14'
    document.documentElement.style.background = '#090A14'
    ;(async () => {
      try {
        // measure layout only after the styles are in, otherwise the scripts read unstyled sizes
        await Promise.all(STYLES.map((href) => loadStyle(href, added)))
        if (cancelled) return
        if (!w.Phone) await loadScript('/landing/phone.js', added)
        if (cancelled) return
        if (!w.Tour) await loadScript('/landing/tour.js', added)
        if (cancelled) return
        await loadScript('/landing/landing.js', added)
        if (cancelled) w.__gafferLanding?.destroy()
      } catch {
        /* the static page still reads fine without the motion layer */
      }
    })()
    return () => {
      cancelled = true
      // stop timers, observers, window listeners and the running demos before the markup goes away
      w.__gafferLanding?.destroy()
      w.__gafferLanding = undefined
      added.forEach((el) => el.remove())
      document.body.style.background = prevBg
      document.documentElement.style.background = ''
      document.body.classList.remove('ready')
    }
  }, [checking])

  // Gaffer only runs as an installed app: the auth pages send any normal browser tab straight back to '/'.
  // So a tap on a sign-up / log-in button in a browser starts the install instead of a navigation that would bounce.
  const onMarkupClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const href = (e.target as HTMLElement).closest('a')?.getAttribute('href')
    const action = ctaAction({
      href,
      // set NEXT_PUBLIC_FORCE_INSTALL_GATE=1 to see the production behaviour on a local dev server
      isDev: process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_FORCE_INSTALL_GATE,
      standalone: isStandalone(),
      ios: isIOS(),
      hasInstallPrompt: !!getDeferredPrompt(),
    })
    if (action.type === 'navigate') return
    e.preventDefault()
    try { localStorage.setItem('gaffer-post-install-intent', action.intent) } catch { /* private mode */ }
    if (action.type === 'ios-install') await handleInstall()
    else if (action.type === 'native-install') await triggerInstallPrompt()
    else setHelpIntent(action.intent)
  }

  if (checking) {
    return <div style={{ minHeight: '100vh', background: '#090A14' }} aria-busy="true" />
  }

  return (
    <>
      <div onClick={onMarkupClick} dangerouslySetInnerHTML={{ __html: landingMarkup }} />
      <IOSInstallModal isOpen={showIOSModal} onClose={closeIOSModal} />
      <InstallHelp
        isOpen={helpIntent !== null}
        onClose={() => setHelpIntent(null)}
        intent={helpIntent ?? 'join'}
        onInstall={async () => (getDeferredPrompt() ? (await triggerInstallPrompt(), true) : false)}
      />
      {/* iOS-only: auto-appearing install banner + modal */}
      <IOSInstallBanner />
    </>
  )
}
