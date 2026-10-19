import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/LegalPage'
import { SITE_NAME, SUPPORT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: `How ${SITE_NAME} collects, uses and protects your information.`,
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`${SITE_NAME} is a fantasy football game for community tournaments. This page explains what we collect when you use it, why, and what control you have. We keep it short and plain on purpose.`}
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Your account:</strong> your email address, name or username, and a password (stored only in scrambled form, never in plain text). If you sign in with Google we receive your name, email address and profile picture from Google.</li>
          <li><strong>Your game:</strong> the Fantasy teams you pick, your points, your rank, transfers, chips and the coins in your wallet.</li>
          <li><strong>Tournament information entered by organisers:</strong> team names, player names, positions, shirt numbers, match results and events, and photos organisers or players choose to upload.</li>
          <li><strong>Notifications:</strong> if you turn alerts on, a push subscription from your phone so we can send goal, result and deadline alerts, plus your notification settings and the tournaments and teams you follow.</li>
          <li><strong>Technical information:</strong> basic details about your device and sign-in sessions (such as browser type and approximate time of use) so we can keep your account secure and fix problems.</li>
        </ul>
      </section>

      <section>
        <h2>What we use it for</h2>
        <ul>
          <li>To run the game: build teams, score matches, show leaderboards and tournament tables.</li>
          <li>To send the alerts you ask for, and service messages about your account.</li>
          <li>To keep {SITE_NAME} secure, prevent misuse and fix faults.</li>
          <li>To let a tournament organiser run their competition, including seeing the Fantasy managers who joined it.</li>
        </ul>
        <p className="mt-2">We do not sell your personal information.</p>
      </section>

      <section>
        <h2>Who can see what</h2>
        <ul>
          <li>Other players in a tournament can see your Fantasy team name, your name, your rank and points. They see your squad once a round has locked.</li>
          <li>The organiser of a tournament can see the managers who joined it and the teams they picked.</li>
          <li>{SITE_NAME} staff can see account information when needed to run the service and help you.</li>
        </ul>
      </section>

      <section>
        <h2>Payments</h2>
        <p>Buying coins is handled by our payment partner, Paystack. We never see or store your card number. We keep a record that a payment happened and the coins it bought.</p>
      </section>

      <section>
        <h2>Cookies and storage</h2>
        <p>We use a small number of cookies and browser storage to keep you signed in, remember whether you are using a player or organiser account, and remember settings on your device. We do not use advertising cookies.</p>
        <p>We also count visits and what people do in the app, such as which pages are opened and which buttons are tapped, so we can see what works and what does not. This uses a random number stored on your own device. It is not linked to your name or phone number, no IP address is stored, and it is not shared with advertisers or anyone else. If you are signed in, the count is linked to your account so we can see what new players do first. We keep the detailed records for 13 months and the daily totals after that.</p>
      </section>

      <section>
        <h2>Other services we use</h2>
        <p>We rely on trusted providers to run {SITE_NAME}: hosting, a database, Google (for sign-in, if you choose it), Paystack (payments), and your phone&apos;s push service (for alerts). They only receive what they need to do their job.</p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>We keep your account and game history while your account is open. If you ask us to delete your account we remove your personal details, apart from records we must keep, such as payment records, and results that are part of a tournament&apos;s history.</p>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>You can turn notifications off at any time in the app or in your phone settings.</li>
          <li>You can ask to see, correct or delete the information we hold about you.</li>
          <li>You can stop using {SITE_NAME} whenever you like.</li>
        </ul>
        <p className="mt-2">We handle personal information in line with the Nigeria Data Protection Act. To use any of these rights, use our <Link href="/contact">contact page</Link>{SUPPORT_EMAIL ? <> or write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></> : null}.</p>
      </section>

      <section>
        <h2>Children</h2>
        <p>{SITE_NAME} is meant for people aged 13 and over. If you are under 18, please use it with a parent or guardian&apos;s knowledge. If we learn that a younger child has signed up, we will delete the account.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>If we change this policy in a way that matters, we will update the date above and, where we can, tell you in the app.</p>
      </section>
    </LegalPage>
  )
}
