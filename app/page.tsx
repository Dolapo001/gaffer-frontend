import type { Metadata } from 'next'
import LandingClient from '@/components/landing/LandingClient'

export const metadata: Metadata = {
  title: 'Gaffer — Fantasy football for the league you play in',
  description:
    'Pick a squad from your community tournament. Your players score as the real match is played, and your whole league sees the table move.',
  openGraph: {
    title: 'Gaffer — Fantasy football for the league you play in',
    description: 'Pick a squad from your community tournament and score as the real match is played.',
    type: 'website',
    url: '/',
    siteName: 'Gaffer',
    locale: 'en_NG',
    images: [{ url: '/og-gaffer.png', width: 1200, height: 630, alt: 'Gaffer: Fantasy football for the league you play in' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gaffer — Fantasy football for the league you play in',
    description: 'Pick a squad from your community tournament and score as the real match is played.',
    images: ['/og-gaffer.png'],
  },
}

export default function LandingPage() {
  return <LandingClient />
}
