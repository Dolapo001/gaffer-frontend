import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  ApiError: class ApiError extends Error {
    code: string
    status: number
    constructor(status: number, code: string, message: string) {
      super(message)
      this.code = code
      this.status = status
    }
  },
}))

import { api, ApiError } from '@/lib/api'
import { saveLineup } from '../fixture.service'

const post = api.post as unknown as ReturnType<typeof vi.fn>
const payload = { teamId: 't1', starters: ['p1', 'p2'] }

beforeEach(() => post.mockReset())

describe('saveLineup', () => {
  it('submits the lineup and confirms it in the same step', async () => {
    post.mockResolvedValueOnce({ lineup: { status: 'pending' } }).mockResolvedValueOnce({ lineup: { status: 'approved' } })
    const result = await saveLineup('f1', payload)
    expect(post).toHaveBeenNthCalledWith(1, '/fixtures/f1/lineups', payload)
    expect(post).toHaveBeenNthCalledWith(2, '/fixtures/f1/lineups/approve', { teamId: 't1' })
    expect(result).toEqual({ status: 'approved' })
  })

  it('leaves it pending for a helper who is not allowed to confirm', async () => {
    post.mockResolvedValueOnce({ lineup: { status: 'pending' } }).mockRejectedValueOnce(new (ApiError as any)(403, 'FORBIDDEN', 'no'))
    await expect(saveLineup('f1', payload)).resolves.toEqual({ status: 'pending' })
  })

  it('reports any other failure', async () => {
    post.mockResolvedValueOnce({ lineup: {} }).mockRejectedValueOnce(new (ApiError as any)(500, 'INTERNAL_ERROR', 'boom'))
    await expect(saveLineup('f1', payload)).rejects.toThrow('boom')
  })
})
