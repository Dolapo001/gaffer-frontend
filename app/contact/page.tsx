import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/LegalPage'
import { SITE_NAME, SITE_URL, SUPPORT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: `Contact | ${SITE_NAME}`,
  description: `How to reach the ${SITE_NAME} team.`,
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <LegalPage title="Contact us" intro={`Questions, a problem with a payment, a mistake in a match, or a request about your information? Tell us and we will get back to you.`}>
      <section>
        <h2>Email</h2>
        {SUPPORT_EMAIL ? (
          <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
        ) : (
          <p>Our support address is being set up. For now, message us on the {SITE_NAME} account where you found this link and we will reply.</p>
        )}
        <p className="mt-2">Please include the email address you signed up with and, if it is about a match, the tournament and the teams.</p>
      </section>

      <section>
        <h2>Match results and points</h2>
        <p>Results are recorded by each tournament&apos;s organiser. If you spot a mistake, tell the organiser of that tournament first. They can correct it and the points update.</p>
      </section>

      <section>
        <h2>Running a tournament</h2>
        <p>Organisations are checked before they can publish. To start one, sign up at <a href={SITE_URL}>{SITE_URL.replace('https://', '')}</a> and choose Run a tournament.</p>
      </section>

      <section>
        <h2>More</h2>
        <p>Read our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Use</Link>.</p>
      </section>
    </LegalPage>
  )
}
