'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function FantasyWelcomePage() {
  const router = useRouter()

  return (
    /**
     * Outer wrapper — fills the viewport (minus the fixed bottom nav which
     * the app layout adds as pb-20).  The background image + overlay sit as
     * absolute layers so the content column can use flex layout freely.
     */
    <div className="relative flex flex-col min-h-[calc(100vh-5rem)] overflow-hidden">

      {/* ── Background hero image ───────────────────────────────────────────── */}
      <Image
        src="/images/hero-bg.jpg"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* ── Dark overlay (matches the ~60% dark tint in the reference) ──────── */}
      <div className="absolute inset-0 bg-gaffer-bg/75" />

      {/* ── Content column ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col justify-between flex-1 px-6 pt-16 pb-8">

        {/* ── Headline & subtitle ─────────────────────────────────────────── */}
        <div className="space-y-4 max-w-xs">
          <h1 className="font-display text-4xl font-bold text-white leading-tight tracking-tight">
            Welcome to Fantasy
          </h1>
          <p className="font-body text-base text-white/80 leading-relaxed">
            Create your team, make transfer and become the{' '}
            <span className="text-white font-semibold">GAFFER</span> who tops
            the Leaderboard.
          </p>
        </div>

        {/* ── Get Started button ──────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push('/app/fantasy/team')}
          className={[
            'w-full rounded-2xl bg-white py-4',
            'font-display text-lg font-bold text-gaffer-bg tracking-wide',
            'active:scale-[0.97] transition-transform',
            // Subtle shadow so the button lifts off the dark background
            'shadow-[0_4px_20px_rgba(0,0,0,0.5)]',
          ].join(' ')}
        >
          Get Started
        </button>
      </div>
    </div>
  )
}
