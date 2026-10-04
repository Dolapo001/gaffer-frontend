import { api } from '@/lib/api'

export type ChipType = 'wildcard' | 'triple_captain' | 'bench_boost' | 'free_hit'

export interface ChipInfo {
  chipType: ChipType
  price: { coins: number; naira: number }
  owned: number
  used: number
  remaining: number
  max: number
  cooldownGameweeks: number
  /** false = "Coming soon": can't be bought or activated yet (backend returns 422 CHIP_NOT_AVAILABLE) */
  available: boolean
  cooldown: {
    active: boolean
    nextAvailableGameweek: number | null
  }
}

export interface ChipInventory {
  _id: string
  userId: string
  competitionId: string
  chipType: ChipType
  owned: number
  used: number
  lastUsedGameweekNumber?: number
}

export interface ActiveChipUsage {
  _id: string
  chipType: ChipType
  gameweekId: string
  gameweekNumber: number
}

export interface ListChipsResult {
  chips: ChipInfo[]
  activeUsages: ActiveChipUsage[]
}

// GET /chips?competitionId=...
export async function listChips(competitionId: string): Promise<ListChipsResult> {
  const res = await api.get<{ data: ChipInfo[]; activeUsages?: ActiveChipUsage[] }>(`/chips?competitionId=${competitionId}`)
  if (Array.isArray(res.data)) {
    return { chips: res.data, activeUsages: (res as any).activeUsages ?? [] }
  }
  return { chips: (res.data as any)?.chips ?? [], activeUsages: (res as any).activeUsages ?? [] }
}

// POST /chips/purchase
export async function purchaseChip(competitionId: string, chipType: ChipType): Promise<{
  inventory: ChipInventory
  coinsDeducted: number
  walletBalance: number
}> {
  const res = await api.post<{ data: { inventory: ChipInventory; coinsDeducted: number; walletBalance: number } }>('/chips/purchase', { competitionId, chipType })
  return res.data
}

// POST /chips/activate
export async function activateChip(competitionId: string, chipType: ChipType, gameweekId: string): Promise<{
  usage: any
  inventory: ChipInventory
}> {
  const res = await api.post<{ data: { usage: any; inventory: ChipInventory } }>('/chips/activate', { competitionId, chipType, gameweekId })
  return res.data
}
