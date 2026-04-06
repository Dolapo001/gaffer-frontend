'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function SplashPage() {
  const router = useRouter()
  const { isAuthenticated, role, isLoading } = useAuthStore()

  // Track whether the 4-second minimum timer has elapsed
  const timerElapsedRef = useRef(false)
  // Track whether the video has naturally ended
  const videoEndedRef = useRef(false)

  const navigate = useCallback(() => {
    // Only redirect once both the timer has elapsed AND auth state is resolved
    if (!timerElapsedRef.current || isLoading) return
    if (isAuthenticated) {
      router.replace(role === 'organization' ? '/admin' : '/app/dashboard')
    } else {
      router.replace('/onboarding/welcome')
    }
  }, [router, isAuthenticated, role, isLoading])

  // Minimum 4000ms timer — matches video length
  useEffect(() => {
    const timer = setTimeout(() => {
      timerElapsedRef.current = true
      navigate()
    }, 4000)

    return () => clearTimeout(timer)
  }, [navigate])

  // If auth state resolves after the timer has already elapsed, navigate immediately
  useEffect(() => {
    if (timerElapsedRef.current) {
      navigate()
    }
  }, [isAuthenticated, isLoading, navigate])

  // Called when video ends naturally
  const handleVideoEnded = () => {
    videoEndedRef.current = true
    timerElapsedRef.current = true
    navigate()
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
