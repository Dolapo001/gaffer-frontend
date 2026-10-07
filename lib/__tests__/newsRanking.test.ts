import { describe, it, expect } from 'vitest'
import { rankTopNews, isGafferNews } from '../newsRanking'
import type { FeedItem } from '../services/feed.service'

function item(over: Partial<FeedItem> & { _id: string }): FeedItem {
  return {
    type: 'news', authorType: 'org', body: '', visibility: 'public', allowComments: false, likesCount: 0,
    createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', ...over,
  } as FeedItem
}

describe('rankTopNews', () => {
  it('puts official Gaffer news ahead of organisation news, even older and unpinned', () => {
    const org = item({ _id: 'org', isPinned: true, createdAt: '2026-10-05T00:00:00Z' })
    const gaffer = item({ _id: 'gaffer', authorType: 'system', createdAt: '2026-09-01T00:00:00Z' })
    expect(rankTopNews([org, gaffer]).map((i) => i._id)).toEqual(['gaffer', 'org'])
  })

  it('orders several Gaffer posts pinned first, then newest', () => {
    const a = item({ _id: 'a', authorType: 'system', createdAt: '2026-10-03T00:00:00Z' })
    const b = item({ _id: 'b', authorType: 'system', isPinned: true, createdAt: '2026-10-01T00:00:00Z' })
    const c = item({ _id: 'c', authorType: 'system', createdAt: '2026-10-04T00:00:00Z' })
    expect(rankTopNews([a, b, c]).map((i) => i._id)).toEqual(['b', 'c', 'a'])
  })

  it('shows the welcome post only when there is nothing else', () => {
    const welcome = item({ _id: 'w', authorType: 'system', isDefault: true, isPinned: true })
    expect(rankTopNews([welcome]).map((i) => i._id)).toEqual(['w'])
    expect(rankTopNews([welcome, item({ _id: 'n' })]).map((i) => i._id)).toEqual(['n'])
  })

  it('does not treat a welcome post or a match event as Gaffer news', () => {
    expect(isGafferNews(item({ _id: 'w', authorType: 'system', isDefault: true }))).toBe(false)
    expect(isGafferNews(item({ _id: 'm', authorType: 'system', type: 'match_event' }))).toBe(false)
    expect(isGafferNews(item({ _id: 'g', authorType: 'system' }))).toBe(true)
  })
})
