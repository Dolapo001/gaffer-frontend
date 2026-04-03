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

// GET /chips?competitionId=...
export async function listChips(competitionId: string): Promise<ChipInfo[]> {
  const res = await api.get<{ data: ChipInfo[] }>(`/chips?competitionId=${competitionId}`)
  return res.data
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
