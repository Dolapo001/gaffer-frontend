import type { Metadata, Viewport } from 'next'
import { PWAProvider } from '@/components/PWAProvider'
import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

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
    <html lang="en">
      <head>
        {/* Google Fonts — link tag avoids build-time network fetch in App Router */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800;900&family=Chakra+Petch:wght@500&family=Poppins:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#FF6B00" />
      </head>
      <body className="font-body bg-gaffer-bg text-white antialiased overscroll-none">
        <PWAProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PWAProvider>
      </body>
    </html>
  )
}
