/** "Tunde reposted", "Tunde and Zainab reposted", "Tunde, Zainab and 3 others reposted". */
export function repostedByText(names: string[]): string {
  const list = names.filter(Boolean)
  if (list.length === 0) return ''
  if (list.length === 1) return `${list[0]} reposted`
  if (list.length === 2) return `${list[0]} and ${list[1]} reposted`
  const others = list.length - 2
  return `${list[0]}, ${list[1]} and ${others} ${others === 1 ? 'other' : 'others'} reposted`
}
