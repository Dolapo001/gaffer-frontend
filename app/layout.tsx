import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import { PWAProvider } from '@/components/PWAProvider'
import './globals.css'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The GAFFER — Dominate The Field',
  description:
    'Manage your personal sporting activities and sports organizations with GAFFER.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GAFFER',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'The GAFFER',
    description: 'Manage your personal sporting activities and sports organizations.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF6B00',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FF6B00" />
      </head>
      <body className="font-body bg-gaffer-bg text-white antialiased overscroll-none">
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  )
}
