import Link from 'next/link'
import { LEGAL_UPDATED, SITE_NAME } from '@/lib/site'

/** Shared look for the plain-language pages every real site has: privacy, terms, contact. */
export function LegalPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#181928] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="font-black tracking-tight text-lg">{SITE_NAME}</Link>
          <nav className="flex gap-4 text-xs text-white/60" aria-label="Legal">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-xs text-white/40 mt-2">Last updated {LEGAL_UPDATED}</p>
        {intro && <p className="mt-6 text-white/80 leading-relaxed">{intro}</p>}
        <div className="mt-8 space-y-8 text-white/75 leading-relaxed [&_h2]:text-white [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-orange-400 [&_a]:underline">
          {children}
        </div>
      </main>
    </div>
  )
}
