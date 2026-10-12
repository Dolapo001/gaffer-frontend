/**
 * A list from the server, or an empty list if it came back as anything else.
 * A screen that calls .slice() or .map() on an unexpected shape crashes with "x.slice is not a function";
 * showing an empty list is always better than the error page.
 */
export function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}
