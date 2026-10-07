export type CtaIntent = 'join' | 'organise' | 'login'

export type CtaAction =
  | { type: 'navigate' }
  | { type: 'ios-install'; intent: CtaIntent }
  | { type: 'native-install'; intent: CtaIntent }
  | { type: 'install-help'; intent: CtaIntent }

interface CtaContext {
  href: string | null | undefined
  isDev: boolean
  standalone: boolean
  ios: boolean
  hasInstallPrompt: boolean
}

/**
 * Gaffer only runs as an installed app: the /auth pages send any normal browser tab back to "/".
 * A sign-up or log-in link therefore has to start the install instead of navigating, otherwise the
 * visitor lands on the auth page and is bounced straight back to the landing page.
 */
export function ctaAction({ href, isDev, standalone, ios, hasInstallPrompt }: CtaContext): CtaAction {
  if (!href || !href.startsWith('/auth/')) return { type: 'navigate' }
  if (isDev || standalone) return { type: 'navigate' }
  const intent: CtaIntent = href.startsWith('/auth/signup/organization') ? 'organise' : href.startsWith('/auth/login') ? 'login' : 'join'
  if (ios) return { type: 'ios-install', intent }
  if (hasInstallPrompt) return { type: 'native-install', intent }
  return { type: 'install-help', intent }
}
