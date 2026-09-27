/**
 * Fan-side journeys through the real UI: sign up, join a league by code,
 * open the league and a match.
 */
import { test, expect, state, login } from './fixtures'

test.describe('user journeys', () => {
  test('a new user signs up through the form and lands on the dashboard', async ({ page, guard }, testInfo) => {
    const email = `signup.${Date.now().toString(36)}.${testInfo.project.name.replace(/\W/g, '')}@example.com`
    await page.goto('/auth/signup')
    await page.getByPlaceholder('Charlie Westervelt').fill(email)
    const pw = page.getByPlaceholder('************')
    await pw.nth(0).fill('Password123!')
    await pw.nth(1).fill('Password123!')
    await page.locator('select').selectOption('female')
    await page.getByRole('button', { name: /get started/i }).click()
    await page.waitForURL(/\/app\/dashboard/, { timeout: 60_000 })
    await page.waitForLoadState('networkidle')
    await expect(page.locator('nextjs-portal')).toHaveCount(0)
    expect(guard.consoleErrors).toEqual([])
  })

  test('sign-up with mismatched passwords shows an error and stays on the form', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.getByPlaceholder('Charlie Westervelt').fill(`mismatch.${Date.now()}@example.com`)
    const pw = page.getByPlaceholder('************')
    await pw.nth(0).fill('Password123!')
    await pw.nth(1).fill('Different123!')
    await page.locator('select').selectOption('male')
    await page.getByRole('button', { name: /get started/i }).click()
    await expect(page).toHaveURL(/\/auth\/signup/)
    await expect(page.getByText(/match/i).first()).toBeVisible()
  })

  test('wrong password on login shows an error', async ({ page }) => {
    const s = state()
    await page.goto('/auth/login')
    await page.getByPlaceholder('Charlie Westervelt').fill(s.fan.email)
    await page.getByPlaceholder('************').fill('NotThePassword1!')
    await page.getByRole('button', { name: /^login$/i }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByText(/invalid|incorrect|wrong/i).first()).toBeVisible()
  })

  test('a fan joins the league by code and sees its page, table and a match', async ({ page, browser, guard }, testInfo) => {
    const s = state()
    // A brand-new fan per project so the join is real every time
    const email = `joiner.${Date.now().toString(36)}.${testInfo.project.name.replace(/\W/g, '')}@example.com`
    await page.goto('/auth/signup')
    await page.getByPlaceholder('Charlie Westervelt').fill(email)
    const pw = page.getByPlaceholder('************')
    await pw.nth(0).fill('Password123!')
    await pw.nth(1).fill('Password123!')
    await page.locator('select').selectOption('male')
    await page.getByRole('button', { name: /get started/i }).click()
    await page.waitForURL(/\/app\/dashboard/, { timeout: 60_000 })

    await page.goto(`/app/league?code=${encodeURIComponent(s.comp.code)}`)
    await page.locator('form').getByRole('button', { name: /join league/i }).click()
    await page.waitForURL(new RegExp(`/app/league/${s.comp.id}`), { timeout: 30_000 })
    await expect(page.getByText(new RegExp(s.comp.name, 'i')).first()).toBeVisible()

    await page.goto(`/app/league/${s.comp.id}/standings`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(new RegExp(s.teams[0].name, 'i')).first()).toBeVisible()

    await page.goto(`/app/match/${s.liveFixtureId}`)
    await page.waitForLoadState('networkidle')
    // The match header shows short names (LAG / ABU)
    await expect(page.getByText(s.teams[0].name.slice(0, 3).toUpperCase(), { exact: true }).first()).toBeVisible()
    expect(guard.consoleErrors).toEqual([])
  })

  test('a wrong join code shows an error', async ({ page }) => {
    const s = state()
    await login(page, s.fan, /\/app\/dashboard/)
    await page.goto('/app/league?code=NOPE-000000')
    await page.locator('form').getByRole('button', { name: /join league/i }).click()
    await expect(page.getByText(/not found|invalid|no league|doesn.t exist/i).first()).toBeVisible()
    await expect(page).toHaveURL(/\/app\/league\?/)
  })
})
