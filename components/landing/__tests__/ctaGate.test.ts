import { describe, it, expect } from 'vitest'
import { ctaAction } from '../ctaGate'

const browser = { isDev: false, standalone: false, ios: false, hasInstallPrompt: false }

describe('ctaAction', () => {
  it('lets in-page links through', () => {
    expect(ctaAction({ ...browser, href: '#chips' })).toEqual({ type: 'navigate' })
    expect(ctaAction({ ...browser, href: null })).toEqual({ type: 'navigate' })
  })

  it('navigates when the app is already installed', () => {
    expect(ctaAction({ ...browser, standalone: true, href: '/auth/signup' })).toEqual({ type: 'navigate' })
  })

  it('navigates in development so engineers can use the browser', () => {
    expect(ctaAction({ ...browser, isDev: true, href: '/auth/signup' })).toEqual({ type: 'navigate' })
  })

  it('starts the native install when the browser offers a prompt', () => {
    expect(ctaAction({ ...browser, hasInstallPrompt: true, href: '/auth/signup' })).toEqual({ type: 'native-install', intent: 'join' })
  })

  it('shows iOS instructions on iPhone', () => {
    expect(ctaAction({ ...browser, ios: true, href: '/auth/signup/organization' })).toEqual({ type: 'ios-install', intent: 'organise' })
  })

  it('explains how to install when the browser has no prompt', () => {
    expect(ctaAction({ ...browser, href: '/auth/login' })).toEqual({ type: 'install-help', intent: 'login' })
  })
})
