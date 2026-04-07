'use client'

// Onboarding routes (splash, welcome, role-select) are public entry points.
// We intentionally do NOT apply useStandaloneGuard here because:
//  1. The splash page itself needs to render immediately so the video plays.
//     Blocking it with a spinner + standalone check causes a blank screen.
//  2. app/page.tsx already redirects standalone users to /onboarding/splash,
//     so non-standalone users arriving here via URL are fine to proceed.
//  3. Individual protected app/admin routes still enforce standalone via
//     useAuthGuard → useStandaloneGuard.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
