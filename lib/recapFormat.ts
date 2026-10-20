/** 1 -> "1st", 2 -> "2nd", 12 -> "12th", 23 -> "23rd" */
export function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

/** "Top 5%" style line from the percent of managers beaten. */
export function standingLine(rank: number, managers: number, beatPercent: number): string {
  if (managers <= 1) return 'You were the only manager.'
  if (rank === 1) return 'You finished top of every manager.'
  if (beatPercent >= 50) return `You beat ${beatPercent}% of managers.`
  return `${managers - rank} managers finished behind you.`
}

/** Short text for the chips line. */
export function chipsLine(chips: string[]): string {
  if (chips.length === 0) return 'You played no chips.'
  if (chips.length === 1) return `You played the ${chips[0]}.`
  return `You played ${chips.slice(0, -1).join(', ')} and ${chips[chips.length - 1]}.`
}
