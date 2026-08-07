// Currency formatting helpers. Coins are Gaffer's in-app currency (wallet,
// chip prices); naira is used wherever a real-money amount is shown (shop
// prices, chip naira-equivalent).

export function formatCoins(amount: number): string {
  return `💰 ${amount.toLocaleString('en-NG')}`
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

// Fantasy squad-value prices (FantasyPlayer.price, SQUAD_RULES budget) are a
// separate in-game abstraction from real money, but use the same ₦ symbol —
// single source so every fantasy screen renders it identically (was
// inconsistently hardcoded as both £ and Ǥ before).
export function formatSquadValue(amount: number): string {
  return `₦${amount.toFixed(1)}m`
}
