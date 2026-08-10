/**
 * Unit tests for lib/services/payment.service.ts
 *
 * Verifies correct endpoint paths and response parsing for the coin
 * wallet / Paystack purchase flow. The `api` client is mocked so no real
 * HTTP requests (and no real payments) are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/lib/api'
import { listCoinPacks, getWallet, listTransactions, initiatePurchase, verifyPayment } from '@/lib/services/payment.service'

const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>

beforeEach(() => {
  vi.clearAllMocks()
})

// ── listCoinPacks ──────────────────────────────────────────────────────────────

describe('listCoinPacks()', () => {
  it('calls GET /payments/packs as a public request and maps the raw shape', async () => {
    mockApi.get.mockResolvedValue({ data: [{ id: 'pack-1', coins: 500, naira: 2500 }] })

    const result = await listCoinPacks()

    expect(mockApi.get).toHaveBeenCalledWith('/payments/packs', { public: true })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      _id: 'pack-1',
      coins: 500,
      priceAmount: 2500,
      currency: 'NGN',
    })
    expect(result[0].name).toContain('500')
  })

  it('returns an empty array when no packs exist', async () => {
    mockApi.get.mockResolvedValue({ data: [] })
    const result = await listCoinPacks()
    expect(result).toEqual([])
  })
})

// ── getWallet ──────────────────────────────────────────────────────────────────

describe('getWallet()', () => {
  it('calls GET /payments/wallet and unwraps the data envelope', async () => {
    const wallet = { _id: 'w1', userId: 'u1', balance: 120, updatedAt: '2026-01-01' }
    mockApi.get.mockResolvedValue({ data: wallet })

    const result = await getWallet()

    expect(mockApi.get).toHaveBeenCalledWith('/payments/wallet')
    expect(result.balance).toBe(120)
  })
})

// ── listTransactions ───────────────────────────────────────────────────────────

describe('listTransactions()', () => {
  it('calls GET /payments/wallet/transactions and unwraps the data envelope', async () => {
    const tx = { _id: 't1', type: 'purchase' as const, amount: 500, balanceAfter: 620, createdAt: '2026-01-01' }
    mockApi.get.mockResolvedValue({ data: [tx] })

    const result = await listTransactions()

    expect(mockApi.get).toHaveBeenCalledWith('/payments/wallet/transactions')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('purchase')
  })
})

// ── initiatePurchase ───────────────────────────────────────────────────────────

describe('initiatePurchase()', () => {
  it('calls POST /payments/coins/initiate with the pack ID and returns the Paystack handoff', async () => {
    mockApi.post.mockResolvedValue({
      data: { authorizationUrl: 'https://paystack.com/pay/abc123', reference: 'ref-001' },
    })

    const result = await initiatePurchase('pack-1')

    expect(mockApi.post).toHaveBeenCalledWith('/payments/coins/initiate', { packId: 'pack-1' })
    expect(result.authorization_url).toBe('https://paystack.com/pay/abc123')
    expect(result.reference).toBe('ref-001')
  })
})

// ── verifyPayment ──────────────────────────────────────────────────────────────

describe('verifyPayment()', () => {
  it('calls GET /payments/paystack/verify/:reference and reports success on a 2xx response', async () => {
    mockApi.get.mockResolvedValue({
      data: { coins: 500, wallet: { balance: 620 } },
    })

    const result = await verifyPayment('ref-001')

    expect(mockApi.get).toHaveBeenCalledWith('/payments/paystack/verify/ref-001')
    expect(result.status).toBe('success')
    expect(result.coinsAdded).toBe(500)
    expect(result.newBalance).toBe(620)
  })

  it('propagates the error when verification fails (non-2xx from the api client)', async () => {
    mockApi.get.mockRejectedValue(new Error('Payment verification failed'))

    await expect(verifyPayment('bad-ref')).rejects.toThrow('Payment verification failed')
  })
})
