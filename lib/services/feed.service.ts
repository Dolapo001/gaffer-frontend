import { api } from '@/lib/api'

export interface MediaItem {
  url: string
  type: 'image' | 'video' | 'link'
}

export interface FeedItem {
  _id: string
  type: 'news' | 'post' | 'repost' | 'match_event'
  authorType: 'org' | 'team' | 'user'
  authorId: string
  orgId?: string
  teamId?: string
  body: string
  media?: MediaItem[]
  visibility: 'public' | 'org' | 'team'
  allowComments: boolean
  likesCount: number
  commentsCount: number
  isLiked?: boolean
  parentId?: string
  createdAt: string
  updatedAt: string
}

export interface FeedComment {
  _id: string
  feedItemId: string
  userId: { _id: string; fullName?: string; email: string }
  body: string
  createdAt: string
}

export interface FeedPage {
  items?: FeedItem[]
  data?: FeedItem[]
  total: number
  page: number
}

// GET /feed — PUBLIC, page 1 cached
export async function getGlobalFeed(page: number = 1): Promise<FeedPage> {
  return api.get<FeedPage>(`/feed?page=${page}`, { public: true })
}

// GET /feed/:id — PUBLIC
export async function getFeedItem(id: string): Promise<FeedItem> {
  return api.get<FeedItem>(`/feed/${id}`, { public: true })
}

// GET /feed/org/:orgId — PUBLIC
export async function getOrgFeed(orgId: string, page: number = 1): Promise<FeedPage> {
  return api.get<FeedPage>(`/feed/org/${orgId}?page=${page}`, { public: true })
}

// GET /feed/team/:teamId — PUBLIC
export async function getTeamFeed(teamId: string, page: number = 1): Promise<FeedPage> {
  return api.get<FeedPage>(`/feed/team/${teamId}?page=${page}`, { public: true })
}

// GET /feed/match/:fixtureId — PUBLIC
export async function getMatchFeed(fixtureId: string, page: number = 1): Promise<FeedPage> {
  return api.get<FeedPage>(`/feed/match/${fixtureId}?page=${page}`, { public: true })
}

// POST /feed/news
export async function publishNews(payload: {
  orgId: string
  body: string
  media?: MediaItem[]
  visibility?: 'public' | 'org'
}): Promise<FeedItem> {
  return api.post<FeedItem>('/feed/news', payload)
}

// POST /feed/posts
export async function publishPost(payload: {
  teamId: string
  body: string
  media?: MediaItem[]
  visibility?: 'public' | 'team'
}): Promise<FeedItem> {
  return api.post<FeedItem>('/feed/posts', payload)
}

// POST /feed/:id/repost
export async function repost(id: string, body?: string): Promise<FeedItem> {
  return api.post<FeedItem>(`/feed/${id}/repost`, { body })
}

// POST /feed/:id/like
export async function likeFeedItem(id: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/feed/${id}/like`)
}

// DELETE /feed/:id/like
export async function unlikeFeedItem(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/feed/${id}/like`)
}

// POST /feed/:id/comments
export async function addComment(id: string, body: string): Promise<FeedComment> {
  return api.post<FeedComment>(`/feed/${id}/comments`, { body })
}

// GET /feed/:id/comments — PUBLIC, newest first, 20/page
export async function getComments(id: string, page: number = 1): Promise<{
  comments: FeedComment[]
  total: number
  page: number
}> {
  return api.get(`/feed/${id}/comments?page=${page}`, { public: true })
}
