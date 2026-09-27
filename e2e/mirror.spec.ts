/**
 * Admin ↔ user mirror in the browser: an admin action in one browser context,
 * checked straight away in a fan's separate context.
 */
import { test, expect, login, state, api } from './fixtures'

test.describe('admin ↔ fan mirror', () => {
  test('news posted in /admin/news shows on the fan news page; deleting asks for confirmation and removes it', async ({ page, browser }, testInfo) => {
    const s = state()
    const title = `UI news ${testInfo.project.name} ${Date.now().toString(36)}`

    await login(page, s.owner, /\/admin/)
    await page.goto('/admin/news')
    await page.getByPlaceholder('e.g. Bowen Fans League Round 3 Preview').fill(title)
    await page.getByPlaceholder("Write what's news today...").fill('Matchday preview from the e2e run')
    await page.getByRole('button', { name: /post news/i }).click()
    await expect(page.getByText(/news published successfully/i)).toBeVisible()
    await expect(page.getByText(title).first()).toBeVisible()

    const fanCtx = await browser.newContext({ ...testInfo.project.use })
    const fan = await fanCtx.newPage()
    await login(fan, s.fan, /\/app\/dashboard/)
    await fan.goto('/app/news')
    await expect(fan.getByText(title).first()).toBeVisible({ timeout: 30_000 })

    // Destructive action → ConfirmDialog; cancel keeps it, confirm removes it.
    // Scoped to this post's card (the feed also holds the org's pinned welcome post)
    const card = page.locator('div', { has: page.getByText(title, { exact: true }) })
      .filter({ has: page.getByLabel('Delete post') }).last()
    await card.getByLabel('Delete post').click()
    await expect(page.getByText(/delete post/i).first()).toBeVisible()
    await page.getByRole('button', { name: /cancel/i }).click()
    await expect(page.getByText(title).first()).toBeVisible()
    await card.getByLabel('Delete post').click()
    await page.getByRole('button', { name: /^(confirm|delete)$/i }).click()
    await expect(page.getByText(/post deleted/i)).toBeVisible()
    await expect(page.getByText(title, { exact: true })).toHaveCount(0)

    await fan.reload()
    await fan.waitForLoadState('networkidle')
    await expect(fan.getByText(title)).toHaveCount(0)
    await fanCtx.close()
  })

  test('a goal logged by the admin reaches the fan match page live (no reload), and a deletion reverts it', async ({ page }, testInfo) => {
    const s = state()
    const [home, away] = s.teams
    // Fresh fixture per project so both viewports see a real kickoff
    const created = await api('POST', `/competitions/${s.comp.id}/fixtures`, s.owner.token, {
      homeTeamId: home.id, awayTeamId: away.id, stageType: 'league',
      // Well clear of the generated fixtures (the API refuses a team playing twice within 2 h)
      kickoffAt: new Date(Date.now() + (testInfo.project.name === 'pixel-7' ? 40 : 30) * 86400e3).toISOString(),
    })
    expect(created.status).toBe(201)
    const fx = created.body.fixture ?? created.body

    await login(page, s.fan, /\/app\/dashboard/)
    await page.goto(`/app/match/${fx._id}`)
    await page.waitForLoadState('networkidle')
    const scores = page.locator('span.text-\\[48px\\]')
    await expect(scores).toHaveText(['0', '0'])

    expect((await api('POST', `/fixtures/${fx._id}/start`, s.owner.token)).status).toBeLessThan(300)
    const goal = await api('POST', `/fixtures/${fx._id}/events`, s.owner.token, {
      type: 'goal', minute: 12, teamId: home.id, playerId: home.players[12].id,
    })
    expect(goal.status).toBe(201)
    const t0 = Date.now()
    await expect(scores).toHaveText(['1', '0'], { timeout: 35_000 })
    testInfo.annotations.push({ type: 'live-latency-ms', description: String(Date.now() - t0) })
    await expect(page.getByText(new RegExp(home.players[12].name, 'i')).first()).toBeVisible()

    const eventId = (goal.body.event ?? goal.body)._id
    expect((await api('DELETE', `/matches/${fx._id}/events/${eventId}`, s.owner.token)).status).toBe(200)
    await expect(scores).toHaveText(['0', '0'], { timeout: 35_000 })
  })

  test('a viewer collaborator sees no manager-only actions', async ({ page }) => {
    const s = state()
    await login(page, s.viewer, /\/(admin|app)/)
    await page.goto('/admin/players')
    await page.waitForLoadState('networkidle')
    const addVisible = await page.getByRole('button', { name: /^\s*add\s*$/i }).isVisible().catch(() => false)
    await page.goto('/admin/news')
    await page.waitForLoadState('networkidle')
    const postVisible = await page.getByRole('button', { name: /post news/i }).isVisible().catch(() => false)
    test.info().annotations.push({ type: 'viewer-ui', description: `players Add visible: ${addVisible}; news Post visible: ${postVisible}` })
    expect({ addVisible, postVisible }).toEqual({ addVisible: false, postVisible: false })
  })
})
