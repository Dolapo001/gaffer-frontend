/**
 * News Service
 *
 * Wraps all news-related API calls. Currently falls back to mock data
 * because the backend is not yet connected. Swap `USE_MOCK` to false
 * and point `NEXT_PUBLIC_API_URL` at the live backend to go live.
 */

import { apiClient } from '@/lib/apiClient'
import { TOP_NEWS, type Article } from '@/lib/mockData'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const newsService = {
  /** Fetch the top/featured news articles. */
  async getTopNews(): Promise<Article[]> {
    if (USE_MOCK) {
      await delay(600)
      return TOP_NEWS
    }
    return apiClient.get<Article[]>('/news/top')
  },

  /** Fetch all news articles (paginated). */
  async getNews(page = 1, limit = 20): Promise<Article[]> {
    if (USE_MOCK) {
      await delay(600)
      return TOP_NEWS
    }
    return apiClient.get<Article[]>(`/news?page=${page}&limit=${limit}`)
  },

  /** Fetch a single article by ID. */
  async getArticle(id: string): Promise<Article> {
    if (USE_MOCK) {
      await delay(400)
      const article = TOP_NEWS.find((a) => a.id === id)
      if (!article) throw new Error(`Article ${id} not found`)
      return article
    }
    return apiClient.get<Article>(`/news/${id}`)
  },

  /** Search news articles by query string. */
  async searchNews(query: string): Promise<Article[]> {
    if (USE_MOCK) {
      await delay(400)
      const q = query.toLowerCase()
      return TOP_NEWS.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q),
      )
    }
    return apiClient.get<Article[]>(`/news/search?q=${encodeURIComponent(query)}`)
  },
}
