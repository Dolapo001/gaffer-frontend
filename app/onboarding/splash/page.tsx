'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function SplashPage() {
  const router = useRouter()

  // Refs so the timer closure never goes stale and never resets
  const timerElapsedRef = useRef(false)
  const hasNavigatedRef = useRef(false)

  // Read auth state at redirect-time via the store directly — not captured in
  // a useCallback closure (which would cause the timer useEffect to re-run and
  // reset the 4s countdown every time isLoading / isAuthenticated changes).
  const doNavigate = () => {
    if (hasNavigatedRef.current) return
    const { isAuthenticated, role, isLoading } = useAuthStore.getState()
    if (isLoading) return // auth still resolving — wait for the watcher below
    hasNavigatedRef.current = true
    if (isAuthenticated) {
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
    } else {
      router.replace('/onboarding/welcome')
    }
  }

  // 4000ms minimum timer — set once, never reset
  useEffect(() => {
    const timer = setTimeout(() => {
      timerElapsedRef.current = true
      doNavigate()
    }, 4000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Watch for auth resolution AFTER the timer has already fired
  const { isLoading } = useAuthStore()
  useEffect(() => {
    if (timerElapsedRef.current && !isLoading) {
      doNavigate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  // If video ends before 4s timer, mark timer elapsed and attempt navigate
  const handleVideoEnded = () => {
    timerElapsedRef.current = true
    doNavigate()
  }

  // If video fails to load (e.g. codec, network, SW range-request issue),
  // let the 4s timer handle navigation — don't hang on a blank screen
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
