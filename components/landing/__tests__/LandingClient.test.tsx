import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const pwa = vi.hoisted(() => ({
  isStandalone: vi.fn(() => false),
  isIOS: vi.fn(() => false),
  getDeferredPrompt: vi.fn((): unknown => null),
  triggerInstallPrompt: vi.fn(async () => true),
}))

vi.mock('@/lib/pwa', () => pwa)
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }))
vi.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: () => ({ handleInstall: vi.fn(), showIOSModal: false, closeIOSModal: vi.fn() }),
}))
vi.mock('@/components/IOSInstallBanner', () => ({ IOSInstallBanner: () => null }))

import LandingClient from '../LandingClient'

async function cta(name: RegExp) {
  render(<LandingClient />)
  await waitFor(() => expect(document.querySelector('.hero')).not.toBeNull())
  return Array.from(document.querySelectorAll('a')).find((a) => name.test(a.textContent || '') && a.getAttribute('href')?.startsWith('/auth/')) as HTMLAnchorElement
}

describe('landing call-to-action buttons', () => {
  beforeEach(() => {
    pwa.isStandalone.mockReturnValue(false)
    pwa.isIOS.mockReturnValue(false)
    pwa.getDeferredPrompt.mockReturnValue(null)
    pwa.triggerInstallPrompt.mockClear()
    localStorage.clear()
  })

  it('in a normal browser tab, Join a league explains the install instead of navigating to a page that bounces back', async () => {
    const link = await cta(/join a league/i)
    const navigated = fireEvent.click(link)
    expect(navigated).toBe(false) // default prevented: no navigation
    expect(await screen.findByText(/install gaffer to join a league/i)).toBeTruthy()
    expect(localStorage.getItem('gaffer-post-install-intent')).toBe('join')
  })

  it('Run a tournament names the right action', async () => {
    const link = await cta(/run a tournament/i)
    fireEvent.click(link)
    expect(await screen.findByText(/install gaffer to run a tournament/i)).toBeTruthy()
  })

  it('uses the browser install prompt when one is available', async () => {
    pwa.getDeferredPrompt.mockReturnValue({})
    const link = await cta(/join a league/i)
    expect(fireEvent.click(link)).toBe(false)
    await waitFor(() => expect(pwa.triggerInstallPrompt).toHaveBeenCalled())
  })

  it('the install panel has an Install app button that falls back to the steps when the browser has no prompt', async () => {
    const link = await cta(/join a league/i)
    fireEvent.click(link)
    fireEvent.click(await screen.findByRole('button', { name: /install app/i }))
    expect(await screen.findByText(/has not offered the install yet/i)).toBeTruthy()
    expect(pwa.triggerInstallPrompt).not.toHaveBeenCalled()
  })

  it('the Install app button starts the install once the browser has offered it', async () => {
    const link = await cta(/join a league/i)
    fireEvent.click(link) // no prompt yet, so the panel opens
    pwa.getDeferredPrompt.mockReturnValue({}) // the browser offers the install while the panel is open
    fireEvent.click(await screen.findByRole('button', { name: /install app/i }))
    await waitFor(() => expect(pwa.triggerInstallPrompt).toHaveBeenCalled())
  })

  it('goes straight through when the app is already installed', async () => {
    pwa.isStandalone.mockReturnValue(true)
    // an installed app is redirected away from the landing page, so there is nothing to click here
    render(<LandingClient />)
    await waitFor(() => expect(document.querySelector('.hero')).toBeNull())
  })
})
