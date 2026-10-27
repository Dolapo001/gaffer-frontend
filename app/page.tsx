import type { Metadata } from 'next'
import LandingClient from '@/components/landing/LandingClient'

export const metadata: Metadata = {
  title: 'Gaffer | Fantasy Football for Local Leagues',
  description:
    'Gaffer is fantasy football for the local leagues and community tournaments you play in. Pick your squad, follow live points, and compete with your league.',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Gaffer | Fantasy Football for Local Leagues',
    description: 'Fantasy football for the local leagues and community tournaments you play in.',
    url: '/',
    type: 'website',
    siteName: 'Gaffer',
    locale: 'en_NG',
    images: [{ url: '/og-gaffer.webp', width: 1200, height: 630, alt: 'Gaffer: Fantasy football for the league you play in' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gaffer | Fantasy Football for Local Leagues',
    description: 'Fantasy football for the local leagues and community tournaments you play in.',
    images: ['/og-gaffer.webp'],
  },
}

export default function LandingPage() {
  return <LandingClient />
}
