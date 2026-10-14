/**
 * Swiping left or right on a main page moves to the next or previous bottom tab (Home, Fantasy, League, News).
 * Kept as plain functions so the rules are easy to test and to tune.
 */

export interface SwipeInput {
  dx: number
  dy: number
  /** Milliseconds from touch start to touch end */
  ms: number
}

/** A deliberate sideways flick: far enough, mostly horizontal, and not a slow drag. */
export function swipeDirection({ dx, dy, ms }: SwipeInput): -1 | 0 | 1 {
  const MIN_DISTANCE = 70
  const MAX_MS = 600
  if (Math.abs(dx) < MIN_DISTANCE) return 0
  if (Math.abs(dx) < Math.abs(dy) * 1.6) return 0 // scrolling up or down, not swiping across
  if (ms > MAX_MS) return 0
  return dx < 0 ? 1 : -1 // finger moves left: go to the next tab
}

/** The tab to go to, or null at either end (and when the current page is not one of the tabs). */
export function adjacentTab(hrefs: string[], pathname: string, direction: -1 | 0 | 1): string | null {
  if (direction === 0) return null
  const i = hrefs.findIndex((h) => h.split('?')[0] === pathname)
  if (i < 0) return null
  return hrefs[i + direction] ?? null
}

/** True when the touch began inside something that scrolls sideways or takes input, where a swipe means something else. */
export function startsInsideSideScroller(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null
  while (el && el !== document.body) {
    if (el.matches('input, textarea, select, [contenteditable="true"], [data-no-swipe]')) return true
    const style = window.getComputedStyle(el)
    if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 4) return true
    el = el.parentElement
  }
  return false
}
