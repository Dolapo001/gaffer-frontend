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
  },
}

export default function LandingPage() {
  return <LandingClient />
}
