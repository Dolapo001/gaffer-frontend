import type { Metadata, Viewport } from 'next'
import { Chakra_Petch } from 'next/font/google'
import { PWAProvider } from '@/components/PWAProvider'
import { AuthProvider } from '@/components/AuthProvider'
import { BrowserProtection } from '@/components/BrowserProtection'
import { ToastContainer } from '@/components/ToastContainer'
import { QueryProvider } from '@/components/QueryProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { GoogleAuthProvider } from '@/components/GoogleAuthProvider'
import './globals.css'

const chakraPetch = Chakra_Petch({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-chakra',
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
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={chakraPetch.variable}>
      <head>
        {/* Barlow & Poppins still loaded via Google Fonts link for font-display / font-body overrides */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@500;600;700;800;900&family=Poppins:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* apple-touch-icon: 180x180 is the canonical size for modern iOS */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans bg-gaffer-bg text-white antialiased overscroll-none">
        <GoogleAuthProvider>
        <QueryProvider>
          <PWAProvider>
            <AuthProvider>
              <BrowserProtection>
                <ErrorBoundary>
                  <ToastContainer />
                  {children}
                </ErrorBoundary>
              </BrowserProtection>
            </AuthProvider>
          </PWAProvider>
        </QueryProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  )
}
