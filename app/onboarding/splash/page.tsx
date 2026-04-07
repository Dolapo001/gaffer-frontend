'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function SplashPage() {
  const router = useRouter()
  const hasNavigatedRef = useRef(false)

  const doNavigate = () => {
    if (hasNavigatedRef.current) return
    hasNavigatedRef.current = true
    // Read state at call-time — not captured in a closure.
    // We do NOT wait for isLoading here: after 4 s the splash is done regardless
    // of whether the auth refresh has resolved. The destination page's auth guard
    // will validate the session and redirect if needed.
    const { isAuthenticated, role } = useAuthStore.getState()
    if (isAuthenticated) {
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
    } else {
      router.replace('/onboarding/welcome')
    }
  }

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
      style={{ backgroundColor: '#262A39' }}
      className="fixed inset-0 overflow-hidden"
    >
      <video
        src="/gaffer-splash.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        onError={handleVideoError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  )
}
