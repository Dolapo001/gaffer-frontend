#!/usr/bin/env node
/**
 * Layout check: opens pages at a phone width (360px by default), scrolls each one top to bottom and reports
 *   - text that runs off the side of the screen (not counting rows that scroll sideways on purpose)
 *   - pieces of text sitting on top of each other
 *   - short labels (four words or fewer) that wrapped onto more than one line
 *   - text cut off with "…" that has a lot more to show
 *   - pages wider than the screen
 * and saves a full-page screenshot of each.
 *
 * Usage (against a running local copy):
 *   npm run check:layout                                   # the public pages
 *   LAYOUT_EMAIL=you@example.com LAYOUT_PASSWORD=... npm run check:layout -- /app/home /app/league
 *
 * Options (environment):
 *   LAYOUT_BASE_URL   default http://localhost:3000
 *   LAYOUT_WIDTH      default 360
 *   LAYOUT_OUT        default ./layout-check (screenshots + report.json)
 *   LAYOUT_EMAIL / LAYOUT_PASSWORD   sign in first (use a local test account, never a real one)
 *
 * Exits with code 1 when anything is found, so it can gate a pull request.
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.LAYOUT_BASE_URL || 'http://localhost:3000'
const WIDTH = Number(process.env.LAYOUT_WIDTH || 360)
const OUT = path.resolve(process.env.LAYOUT_OUT || 'layout-check')
const DEFAULT_PAGES = ['/', '/auth/login', '/auth/signup', '/onboarding', '/terms', '/privacy']
const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES

// Runs inside the page
function findProblems() {
  const vw = window.innerWidth
  const out = []
  const label = (el) => (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60)
  const visible = (el) => {
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 && r.width > 0 && r.height > 0
  }
  const pinned = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const p = getComputedStyle(n).position
      if (p === 'fixed' || p === 'sticky') return true
    }
    return false
  }
  // Inside a row that scrolls sideways on purpose (carousels, chip rows)
  const inSideScroller = (el) => {
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX
      if ((ox === 'auto' || ox === 'scroll') && n.scrollWidth > n.clientWidth + 2) return true
    }
    return false
  }
  // How many lines the text itself takes (padding doesn't count)
  const lineCount = (el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)))
    return tops.size
  }

  if (document.scrollingElement.scrollWidth > vw + 2) {
    out.push({ kind: 'page wider than screen', detail: `${document.scrollingElement.scrollWidth}px on a ${vw}px screen` })
  }

  const leaves = [...document.querySelectorAll('body *')].filter(
    (el) => el.children.length === 0 && (el.innerText || '').trim() && visible(el) && !pinned(el) &&
      !['SCRIPT', 'STYLE', 'OPTION', 'NOSCRIPT', 'TITLE'].includes(el.tagName),
  )
  for (const el of leaves) {
    const r = el.getBoundingClientRect()
    if ((r.right > vw + 2 || r.left < -2) && !inSideScroller(el)) out.push({ kind: 'text off the screen', text: label(el) })
    const words = (el.innerText || '').trim().split(/\s+/).length
    if (words <= 4 && lineCount(el) > 1) out.push({ kind: 'short label wrapped onto two lines', text: label(el), detail: `${Math.round(r.width)}px wide` })
    const s = getComputedStyle(el)
    if (s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth * 1.35) out.push({ kind: 'text cut off (…)', text: label(el), detail: `needs ${el.scrollWidth}px, has ${el.clientWidth}px` })
  }

  // Overlapping text: compare the boxes of the actual text, not the elements
  const boxes = leaves.flatMap((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return [...range.getClientRects()].filter((r) => r.width > 2 && r.height > 2).map((r) => ({ el, r }))
  })
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j]
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue
      const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
      const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
      // Tightly spaced lines touch a little; real overlaps cover a good part of the text
      if (ix > 4 && iy > Math.max(4, 0.4 * Math.min(a.r.height, b.r.height))) out.push({ kind: 'text on top of other text', text: `"${label(a.el)}" / "${label(b.el)}"` })
    }
  }
  const seen = new Set()
  return out.filter((p) => { const k = p.kind + p.text; if (seen.has(k)) return false; seen.add(k); return true })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' })
  // Look like the installed app, so pages don't show the "install Gaffer" screen
  await ctx.addInitScript(() => {
    Object.defineProperty(window.navigator, 'standalone', { get: () => true })
    const mm = window.matchMedia.bind(window)
    window.matchMedia = (q) => (/display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } : mm(q))
    const css = document.createElement('style')
    css.textContent = 'nextjs-portal{display:none!important}'
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(css))
  })
  const page = await ctx.newPage()
  page.setDefaultTimeout(60_000)

  if (process.env.LAYOUT_EMAIL && process.env.LAYOUT_PASSWORD) {
    await page.goto(BASE + '/auth/login', { waitUntil: 'domcontentloaded' })
    await page.fill('input[type=email]', process.env.LAYOUT_EMAIL)
    await page.fill('input[type=password]', process.env.LAYOUT_PASSWORD)
    await page.keyboard.press('Enter')
    await sleep(5000)
  }

  const report = {}
  let total = 0
  for (const p of pages) {
    const name = p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'home'
    try {
      await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 120_000 })
      await sleep(4000)
      const h = await page.evaluate(() => document.scrollingElement.scrollHeight)
      for (let y = 0; y < h; y += 600) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await sleep(120) }
      await page.evaluate(() => window.scrollTo(0, 0)); await sleep(400)
      const problems = await page.evaluate(findProblems)
      await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true })
      report[p] = problems
      total += problems.length
      console.log(`${String(problems.length).padStart(3)}  ${p}`)
      for (const x of problems) console.log(`       ${x.kind}: ${x.text ?? ''} ${x.detail ? `(${x.detail})` : ''}`)
    } catch (e) {
      report[p] = [{ kind: 'page did not load', detail: String(e.message).slice(0, 120) }]
      total += 1
      console.log(`ERR  ${p}  ${String(e.message).slice(0, 80)}`)
    }
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
  await browser.close()
  console.log(`\n${total} problem${total === 1 ? '' : 's'} on ${pages.length} page${pages.length === 1 ? '' : 's'} at ${WIDTH}px. Screenshots and report in ${OUT}`)
  process.exit(total ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(2) })
