import { describe, it, expect, beforeAll } from 'vitest'
import type { FeedItem } from '../services/feed.service'

beforeAll(() => { process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com/v1' })

const base = { _id: '1', type: 'news', authorType: 'org', body: 'b', visibility: 'public', allowComments: true, likesCount: 0, createdAt: '', updatedAt: '' } as FeedItem

describe('pickNewsImage', () => {
  it('uses the post\'s own picture first', async () => {
    const { pickNewsImage } = await import('../newsImage')
    const r = pickNewsImage({ ...base, imageUrl: 'uploads/pic.jpg', authorId: { _id: 'o', logoUrl: 'uploads/logo.png' } })
    expect(r).toEqual({ src: 'https://api.example.com/uploads/pic.jpg', isLogo: false })
  })
  it('falls back to the first image in media', async () => {
    const { pickNewsImage } = await import('../newsImage')
    const r = pickNewsImage({ ...base, media: [{ url: 'https://cdn/x.jpg', type: 'image' }], authorId: { _id: 'o', logoUrl: 'uploads/logo.png' } })
    expect(r).toEqual({ src: 'https://cdn/x.jpg', isLogo: false })
  })
  it('an organisation post with no picture shows the organisation account picture', async () => {
    const { pickNewsImage } = await import('../newsImage')
    const r = pickNewsImage({ ...base, authorId: { _id: 'o', logoUrl: 'uploads/logo.png' } })
    expect(r).toEqual({ src: 'https://api.example.com/uploads/logo.png', isLogo: true })
  })
  it('uses the populated org logo when the author has none', async () => {
    const { pickNewsImage } = await import('../newsImage')
    const r = pickNewsImage({ ...base, authorId: { _id: 'o' }, orgId: { _id: 'o', logoUrl: 'https://cdn/org.png' } as unknown as string })
    expect(r).toEqual({ src: 'https://cdn/org.png', isLogo: true })
  })
  it('a person\'s avatar is never used as a news picture', async () => {
    const { pickNewsImage } = await import('../newsImage')
    const r = pickNewsImage({ ...base, authorType: 'user', authorId: { _id: 'u', logoUrl: 'uploads/me.png' } })
    expect(r.isLogo).toBe(false)
  })
  it('Gaffer\'s own posts, or an account with no logo, keep the stock picture', async () => {
    const { pickNewsImage, DEFAULT_NEWS_IMAGE } = await import('../newsImage')
    expect(pickNewsImage({ ...base, authorType: 'system', authorId: null })).toEqual({ src: DEFAULT_NEWS_IMAGE, isLogo: false })
    expect(pickNewsImage({ ...base, authorId: { _id: 'o' } })).toEqual({ src: DEFAULT_NEWS_IMAGE, isLogo: false })
  })
})
