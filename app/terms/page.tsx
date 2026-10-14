import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage } from '@/components/legal/LegalPage'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: `Terms of Use | ${SITE_NAME}`,
  description: `The rules for using ${SITE_NAME}.`,
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={`These terms are the rules for using ${SITE_NAME}. By creating an account or using the app you agree to them. If you do not agree, please do not use it.`}
    >
      <section>
        <h2>What {SITE_NAME} is</h2>
        <p>{SITE_NAME} is a fantasy football game and tournament tool for community competitions. Players pick Fantasy teams from the real teams in a tournament and earn points as real matches are played. Organisers run those tournaments and record the match events.</p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>Give accurate information and keep your password to yourself. You are responsible for what happens on your account.</li>
          <li>One person, one account. Do not use someone else&apos;s account or pretend to be another person.</li>
          <li>You must be at least 13 years old. If you are under 18, use {SITE_NAME} with a parent or guardian&apos;s knowledge.</li>
        </ul>
      </section>

      <section>
        <h2>Playing fair</h2>
        <ul>
          <li>Do not cheat, use bots or scripts, or try to break, overload or get around the app.</li>
          <li>Do not post anything unlawful, abusive, hateful, or that infringes someone else&apos;s rights.</li>
          <li>Do not upload photos of people unless they are happy for you to.</li>
        </ul>
      </section>

      <section>
        <h2>Organisers</h2>
        <p>An organiser is responsible for their tournament: the teams and players they register, the results and events they record, and any rules, fees or prizes they set. {SITE_NAME} provides the tools. We check new organisations before they can publish, and we can hide a tournament or suspend an organisation that breaks these terms or the law.</p>
      </section>

      <section>
        <h2>Points, results and prizes</h2>
        <p>Points depend on what organisers record during real matches. They can correct a mistake afterwards, and points and rankings can change when they do. {SITE_NAME} does not run betting and does not pay cash for results. Any prize in a tournament is arranged and given out by that tournament&apos;s organiser, not by {SITE_NAME}.</p>
      </section>

      <section>
        <h2>Coins and chips</h2>
        <p>Coins are used inside the app to play chips. You can get some free and buy more through our payment partner. Coins have no cash value, cannot be withdrawn or transferred, and purchases are final unless the law says otherwise or we made a mistake. If something goes wrong with a payment, <Link href="/contact">contact us</Link> and we will look into it.</p>
      </section>

      <section>
        <h2>Our content and yours</h2>
        <p>The {SITE_NAME} name, logo, design and software belong to us. What you upload stays yours, but you let us show it in the app for the purpose of running the game and the tournament it belongs to.</p>
      </section>

      <section>
        <h2>The service</h2>
        <p>We work hard to keep {SITE_NAME} running, but it is provided as it is. It may be unavailable at times, and features may change. To the extent the law allows, we are not responsible for losses that come from using, or being unable to use, the app.</p>
      </section>

      <section>
        <h2>Ending your use</h2>
        <p>You can stop using {SITE_NAME} at any time and ask us to delete your account. We can suspend or close accounts that break these terms.</p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p>We may update these terms. If the change matters, we will update the date above and tell you where we can. Questions? See our <Link href="/privacy">Privacy Policy</Link> or <Link href="/contact">contact us</Link>.</p>
      </section>
    </LegalPage>
  )
}
