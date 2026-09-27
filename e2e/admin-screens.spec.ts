/**
 * Every admin screen (ADMIN_TEST_PROMPT.md §4.4) loads for the org owner on a
 * phone viewport: no crash overlay, no console errors, no backend 5xx.
 */
import { test, expect, login, state } from './fixtures'

// [name, path, text that proves real data rendered (optional)]
const screens = (s: ReturnType<typeof state>): (readonly [string, string, RegExp?])[] => [
  ['dashboard', '/admin'],
  ['organise', '/admin/organise'],
  ['tournaments', '/admin/tournaments', new RegExp(s.comp.name, 'i')],
  ['tournament detail', `/admin/tournaments/${s.comp.id}`, new RegExp(s.comp.name, 'i')],
  ['tournament success', `/admin/tournaments/${s.comp.id}/success`],
  ['players', '/admin/players', /(Abuja|Lagos)1 Player/],
  ['schedule', '/admin/schedule'],
  ['schedule detail', `/admin/schedule/${s.comp.id}`],
  ['fantasy pricing', `/admin/fantasy/${s.comp.id}/pricing/${s.teams[0].id}`],
  ['news', '/admin/news'],
  ['collaborators', '/admin/collaborators'],
  ['notifications', '/admin/notifications'],
  ['settings', '/admin/settings'],
  ['profile', '/admin/profile'],
]

test.describe('admin screens (owner)', () => {
  test('owner logs in through the login page and lands on /admin', async ({ page }) => {
    const s = state()
    await login(page, s.owner, /\/admin(\/|$)/)
    await expect(page).toHaveURL(/\/admin/)
  })

  // Names only at collection time; paths come from this run's seeded state
  const NAMES = ['dashboard', 'organise', 'tournaments', 'tournament detail', 'tournament success', 'players', 'schedule',
    'schedule detail', 'fantasy pricing', 'news', 'collaborators', 'notifications', 'settings', 'profile']
  for (const name of NAMES) {
    test(`${name} loads without errors`, async ({ page, guard }, testInfo) => {
      const s = state()
      const [, path, proof] = screens(s).find(([n]) => n === name)!
      await login(page, s.owner, /\/admin(\/|$)/)
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      if (proof) await expect(page.getByText(proof).first()).toBeVisible()
      await expect(page.locator('nextjs-portal')).toHaveCount(0) // Next.js error overlay
      await expect(page.getByText(/application error|unhandled runtime error|something went wrong/i)).toHaveCount(0)
      await page.screenshot({ path: testInfo.outputPath(`${name.replace(/\s+/g, '-')}.png`), fullPage: true })
      expect(guard.consoleErrors, `console errors on ${path}`).toEqual([])
    })
  }
})
