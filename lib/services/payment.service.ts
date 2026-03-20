import { api } from '@/lib/api'

export interface CoinPack {
  _id: string
  name: string
  description?: string
  coins: number
  priceAmount: number
  currency: 'NGN' | 'USD'
  bannerUrl?: string
}

export interface Wallet {
  _id: string
  userId: string
  balance: number
  updatedAt: string
}

export interface Transaction {
  _id: string
  type: 'purchase' | 'chip_buy' | 'reward' | 'refund'
  amount: number
  balanceAfter: number
  description?: string
  createdAt: string
}

// GET /payments/packs
export async function listCoinPacks(): Promise<CoinPack[]> {
  const res = await api.get<{ data: any[] }>('/payments/packs', { public: true })
  return res.data.map(p => ({
    _id: p.id,
    name: `${p.coins} Gaffer Coins`,
    coins: p.coins,
    priceAmount: p.naira,
    currency: 'NGN' as const,
    description: `Purchase ${p.coins} coins for the Gaffer store.`
  }))
}

// GET /payments/wallet
export async function getWallet(): Promise<Wallet> {
  const res = await api.get<{ data: Wallet }>('/payments/wallet')
  return res.data
}

// GET /payments/wallet/transactions
export async function listTransactions(): Promise<Transaction[]> {
  const res = await api.get<{ data: Transaction[] }>('/payments/wallet/transactions')
  return res.data
}

// POST /payments/coins/initiate
export async function initiatePurchase(packId: string): Promise<{ 
  authorization_url: string; 
  reference: string 
}> {
  const res = await api.post<{ data: any }>('/payments/coins/initiate', { packId })
  return {
    authorization_url: res.data.authorizationUrl,
    reference: res.data.reference
  }
}

// GET /payments/paystack/verify/:reference
export async function verifyPayment(reference: string): Promise<{ 
  status: string; 
  coinsAdded: number; 
  newBalance: number 
}> {
  const res = await api.get<{ data: any }>(`/payments/paystack/verify/${reference}`)
  return {
    status: 'success', // if we reached here, its successful
    coinsAdded: res.data.coins,
    newBalance: res.data.wallet.balance
  }
}
