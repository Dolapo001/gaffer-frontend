/**
 * The app's one way of writing dates and times, so every screen reads the same:
 *   formatDate      "Tue 17 Nov"         (adds the year when it isn't this year: "Tue 17 Nov 2025")
 *   formatShortDate "17 Nov"
 *   formatTime      "15:00"              (24-hour)
 *   formatDateTime  "Tue 17 Nov, 15:00"
 * Anything that can't be read as a date comes back as an empty string.
 */
type DateInput = string | number | Date | null | undefined

function toDate(v: DateInput): Date | null {
  if (v == null || v === '') return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

const sameYear = (d: Date) => d.getFullYear() === new Date().getFullYear()

export function formatDate(v: DateInput): string {
  const d = toDate(v)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', ...(sameYear(d) ? {} : { year: 'numeric' }) })
}

export function formatShortDate(v: DateInput): string {
  const d = toDate(v)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(sameYear(d) ? {} : { year: '2-digit' }) })
}

export function formatTime(v: DateInput): string {
  const d = toDate(v)
  if (!d) return ''
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDateTime(v: DateInput): string {
  const d = toDate(v)
  if (!d) return ''
  return `${formatDate(d)}, ${formatTime(d)}`
}
