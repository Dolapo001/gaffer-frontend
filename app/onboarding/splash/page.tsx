'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function SplashPage() {
  const router = useRouter()
  const hasNavigatedRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const doNavigate = () => {
    if (hasNavigatedRef.current) return
    hasNavigatedRef.current = true

    // A player arriving via an invite link must always reach the onboarding
    // form — they are not expected to have an account and must not be sent to
    // the dashboard or welcome screen. Check localStorage first (set by
    // OnboardingClient when the invite URL was opened in Safari, before iOS
    // potentially relaunched the PWA at this splash start_url).
    const pendingInvite = localStorage.getItem('gaffer-pending-invite-url')
    if (pendingInvite) {
      localStorage.removeItem('gaffer-pending-invite-url')
      router.replace(pendingInvite)
      return
    }

    // Normal app boot: read auth state at call-time (not captured in a closure).
    // We do NOT wait for isLoading here — the destination page's own auth guard
    // will validate the session and redirect if needed.
    const { isAuthenticated, role } = useAuthStore.getState()
    if (isAuthenticated) {
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
    } else {
      router.replace('/onboarding/welcome')
    }
  }

  // Force-start playback via ref.play() on mount.
  // On iOS Safari PWA standalone mode, the autoPlay HTML attribute alone is
  // not enough — the browser shows its own overlay play button until JS calls
  // .play() programmatically. Calling it in useEffect (after mount) is treated
  // as non-gesture-blocked in standalone mode.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {
      // Autoplay was blocked (e.g. non-standalone browser tab) — timers handle nav
    })
  }, [])

  // Primary: 4 s timer matching video length
  useEffect(() => {
    const timer = setTimeout(doNavigate, 4000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hard failsafe: if something prevents the 4 s timer from navigating
  // (e.g. rapid re-renders clearing it), force navigation at 6 s no matter what.
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true
        router.replace('/onboarding/welcome')
      }
    }, 6000)
    return () => clearTimeout(fallback)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If the video ends before 4 s (e.g. shorter render), navigate immediately
  const handleVideoEnded = () => doNavigate()

  // If video fails, the timers above still handle navigation — no hang
  const handleVideoError = () => {
    console.warn('[Splash] Video failed to load — timer will handle navigation')
  }

  return (
    <div
      style={{
        backgroundColor: '#262A39',
        // 100dvh = dynamic viewport height — fills the full screen on iOS PWA
        // including below the home indicator, eliminating the bottom gap that
        // 100vh (static) leaves on notched devices in standalone mode.
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        src="/gaffer-splash.mp4"
        autoPlay
        muted
        playsInline
        disablePictureInPicture
        // @ts-ignore — non-standard WebKit attribute that suppresses AirPlay overlay
        x-webkit-airplay="deny"
        // Prevent browser media session controls (cast button, pip overlay)
        // from appearing over the splash on Android Chrome
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          // Suppresses any browser-native playback overlay on WebKit
          WebkitMediaControlsPanel: 'none',
        } as React.CSSProperties}
      />
    </div>
  )
}
