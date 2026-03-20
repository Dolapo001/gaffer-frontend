/**
 * Human-readable error message map.
 *
 * Keys are the `code` strings returned by the backend in the standard
 * error envelope: { error: { code, message, details, requestId } }
 *
 * Values are the strings shown directly to the user in toasts / inline
 * error banners.
 */

const ERROR_MAP: Record<string, string> = {
  // ── Auth ────────────────────────────────────────────────────────────────
  INVALID_CREDENTIALS:   'Incorrect email or password. Please try again.',
  EMAIL_ALREADY_EXISTS:  'An account with this email already exists. Try logging in.',
  EMAIL_NOT_FOUND:       'No account found with that email address.',
  ACCOUNT_DISABLED:      'Your account has been suspended. Contact support.',
  ACCOUNT_DELETED:       'This account no longer exists.',
  TOKEN_EXPIRED:         'Your link has expired. Please request a new one.',
  TOKEN_INVALID:         'Invalid or used link. Please request a new one.',
  SESSION_EXPIRED:       'Your session has expired. Please log in again.',
  REFRESH_TOKEN_INVALID: 'Your session has expired. Please log in again.',
  INVALID_REFRESH:       'Your session has expired. Please log in again.',
  UNAUTHORIZED:          'You need to be logged in to do that.',

  // ── Validation ──────────────────────────────────────────────────────────
  VALIDATION_ERROR:      'Please check your details and try again.',
  MISSING_FIELDS:        'Please fill in all required fields.',
  INVALID_EMAIL:         'Please enter a valid email address.',
  WEAK_PASSWORD:         'Password must be at least 8 characters.',
  PASSWORD_MISMATCH:     'Passwords do not match.',

  // ── Resources ───────────────────────────────────────────────────────────
  NOT_FOUND:             'The requested item could not be found.',
  FORBIDDEN:             "You don't have permission to do that.",
  CONFLICT:              'This item already exists.',

  // ── Network / Server ────────────────────────────────────────────────────
  INTERNAL_ERROR:        'Something went wrong on our end. Please try again.',
  SERVICE_UNAVAILABLE:   'The service is temporarily unavailable. Try again shortly.',
  RATE_LIMITED:          'Too many requests. Please slow down and try again.',

  // ── Fallback ────────────────────────────────────────────────────────────
  UNKNOWN_ERROR:         'An unexpected error occurred. Please try again.',
}

/**
 * Translate a raw backend error code or message into a user-friendly string.
 *
 * Priority order:
 *  1. code lookup in ERROR_MAP
 *  2. message lookup in ERROR_MAP (some backends send the code as the message)
 *  3. the raw `message` as-is if it looks human-readable
 *  4. generic fallback
 */
export function translateError(code?: string, message?: string): string {
  // 1. Prioritize codes if they exist in our map
  if (code && ERROR_MAP[code]) return ERROR_MAP[code]

  // 2. Map generic codes like INTERNAL_ERROR even if the message is specific
  if (code === 'INTERNAL_ERROR') return ERROR_MAP.INTERNAL_ERROR

  // 3. Fallback: surface the message if it looks human-readable (not snake_case)
  if (message && !/^[A-Z0-9_]+$/.test(message)) return message

  return ERROR_MAP.UNKNOWN_ERROR
}
