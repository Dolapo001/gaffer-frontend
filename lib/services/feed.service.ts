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
  const data = await api.get<{ feed: FeedPage }>(`/feed?page=${page}`, { public: true })
  return data.feed
}

// GET /feed/:id — PUBLIC
export async function getFeedItem(id: string): Promise<FeedItem> {
  const data = await api.get<{ item: FeedItem }>(`/feed/${id}`, { public: true })
  return data.item
}

// GET /feed/org/:orgId — PUBLIC
export async function getOrgFeed(orgId: string, page: number = 1): Promise<FeedPage> {
  const data = await api.get<{ feed: FeedPage }>(`/feed/org/${orgId}?page=${page}`, { public: true })
  return data.feed
}

// GET /feed/team/:teamId — PUBLIC
export async function getTeamFeed(teamId: string, page: number = 1): Promise<FeedPage> {
  const data = await api.get<{ feed: FeedPage }>(`/feed/team/${teamId}?page=${page}`, { public: true })
  return data.feed
}

// GET /feed/match/:fixtureId — PUBLIC
export async function getMatchFeed(fixtureId: string, page: number = 1): Promise<FeedPage> {
  const data = await api.get<{ feed: FeedPage }>(`/feed/match/${fixtureId}?page=${page}`, { public: true })
  return data.feed
}

// POST /feed/news
export async function publishNews(payload: {
  orgId: string
  body: string
  media?: MediaItem[]
  visibility?: 'public' | 'org'
}): Promise<FeedItem> {
  const data = await api.post<{ item: FeedItem }>('/feed/news', payload)
  return data.item
}

// POST /feed/posts
export async function publishPost(payload: {
  teamId: string
  body: string
  media?: MediaItem[]
  visibility?: 'public' | 'team'
}): Promise<FeedItem> {
  const data = await api.post<{ item: FeedItem }>('/feed/posts', payload)
  return data.item
}

// POST /feed/:id/repost
export async function repost(id: string, body?: string): Promise<FeedItem> {
  const data = await api.post<{ item: FeedItem }>(`/feed/${id}/repost`, { body })
  return data.item
}

// POST /feed/:id/like
export async function likeFeedItem(id: string): Promise<{ message: string }> {
  const data = await api.post<{ message: string; item: FeedItem }>(`/feed/${id}/like`)
  return data
}

// DELETE /feed/:id/like
export async function unlikeFeedItem(id: string): Promise<{ message: string }> {
  const data = await api.delete<{ message: string; item: FeedItem }>(`/feed/${id}/like`)
  return data
}

// POST /feed/:id/comments
export async function addComment(id: string, body: string): Promise<FeedComment> {
  const data = await api.post<{ comment: FeedComment }>(`/feed/${id}/comments`, { body })
  return data.comment
}

// GET /feed/:id/comments — PUBLIC, newest first, 20/page
export async function getComments(id: string, page: number = 1): Promise<{
  comments: FeedComment[]
  total: number
  page: number
}> {
  const data = await api.get<{
    comments: FeedComment[]
    total: number
    page: number
  }>(`/feed/${id}/comments?page=${page}`, { public: true })
  return data
}

// GET /feed/search — Search items by body text
export async function searchFeedItems(query: string, page: number = 1): Promise<FeedPage> {
  if (!query.trim()) return { items: [], total: 0, page: 1 }
  const data = await api.get<{ feed: FeedPage }>(`/feed/search?q=${encodeURIComponent(query)}&page=${page}`, { public: true })
  // Backend search returns the full FeedPage object or wraps it in 'feed'?
  // Controller says: res.status(200).json(result); where result is from service.search
  // service.search returns { items, total, page }
  return (data as any).items ? (data as any) : data.feed
}

// GET /feed/news — Fetch published news items
export async function getNews(page: number = 1): Promise<FeedPage> {
  const data = await api.get<{ items: FeedItem[]; total: number; page: number }>(
    `/feed/news?page=${page}`,
    { public: true },
  )
  return { items: data.items, total: data.total, page: data.page }
}

// PUT /feed/posts/:postId — Edit a post
export async function updatePost(
  postId: string,
  payload: { body?: string; media?: MediaItem[] },
): Promise<FeedItem> {
  const data = await api.put<{ item: FeedItem }>(`/feed/posts/${postId}`, payload)
  return data.item
}

// DELETE /feed/posts/:postId — Delete a post
export async function deletePost(postId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/feed/posts/${postId}`)
}

// PUT /feed/posts/:postId/comments/:commentId — Edit a comment
export async function updateComment(
  postId: string,
  commentId: string,
  body: string,
): Promise<FeedComment> {
  const data = await api.put<{ comment: FeedComment }>(
    `/feed/posts/${postId}/comments/${commentId}`,
    { body },
  )
  return data.comment
}

// DELETE /feed/posts/:postId/comments/:commentId — Delete a comment
export async function deleteComment(
  postId: string,
  commentId: string,
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/feed/posts/${postId}/comments/${commentId}`)
}
