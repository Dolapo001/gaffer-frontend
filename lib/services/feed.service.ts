import { api } from '@/lib/api'

export interface MediaItem {
  url: string
  type: 'image' | 'video' | 'link'
}

export interface FeedItem {
  _id: string
  type: 'news' | 'post' | 'repost' | 'match_event'
  authorType: 'org' | 'team' | 'user' | 'system'
  /** Display name for system posts where authorId is absent (e.g. "GAFFER") */
  authorName?: string
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
  /** True on auto-generated welcome posts created by the backend */
  isDefault?: boolean
  /** True when the post should be surfaced at the top of the feed */
  isPinned?: boolean
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

// GET /feed — main feed (all types), page 1 cached
export async function getGlobalFeed(page: number = 1): Promise<FeedPage> {
  const data = await api.get<{ feed: FeedPage }>(`/feed?page=${page}`, { public: true })
  return data.feed
}

// GET /feed/news — news items only.
// Falls back to the global feed filtered for news/system posts if the dedicated
// endpoint is unavailable (404) — backend may not have implemented it yet.
export async function getNewsFeed(page: number = 1): Promise<FeedPage> {
  try {
    const raw = await api.get<unknown>(`/feed/news?page=${page}`, { public: true })
    const r = raw as any
    if (r?.feed) return r.feed
    if (r?.items || r?.data) return r as FeedPage
    // Unexpected shape — fall through to global fallback below
  } catch {
    // /feed/news not yet available on this backend — use global feed
  }
  // /feed/news not available — return the full global feed unfiltered so the
  // news page can show all content (org posts, system posts, etc.)
  return getGlobalFeed(page)
}

// GET /feed/posts/:postId — single post detail
export async function getFeedItem(id: string): Promise<FeedItem> {
  const raw = await api.get<unknown>(`/feed/posts/${id}`, { public: true })
  const r = raw as any
  return r?.item ?? r?.post ?? r
}

// PUT /feed/posts/:postId — edit a post
export async function updatePost(
  id: string,
  payload: { body?: string; media?: MediaItem[]; visibility?: string }
): Promise<FeedItem> {
  const raw = await api.put<unknown>(`/feed/posts/${id}`, payload)
  const r = raw as any
  return r?.item ?? r?.post ?? r
}

// DELETE /feed/posts/:postId — delete a post
export async function deletePost(id: string): Promise<void> {
  await api.delete<unknown>(`/feed/posts/${id}`)
}

// POST /feed/posts/:postId/likes — like a post
export async function likeFeedItem(id: string): Promise<{ message: string }> {
  const data = await api.post<{ message: string }>(`/feed/posts/${id}/likes`)
  return data
}

// DELETE /feed/posts/:postId/likes — unlike a post
export async function unlikeFeedItem(id: string): Promise<{ message: string }> {
  const data = await api.delete<{ message: string }>(`/feed/posts/${id}/likes`)
  return data
}

// GET /feed/posts/:postId/comments — fetch comments (newest first, 20/page)
export async function getComments(
  id: string,
  page: number = 1
): Promise<{ comments: FeedComment[]; total: number; page: number }> {
  const data = await api.get<{ comments: FeedComment[]; total: number; page: number }>(
    `/feed/posts/${id}/comments?page=${page}`,
    { public: true }
  )
  return data
}

// POST /feed/posts/:postId/comments — add a comment
export async function addComment(id: string, body: string): Promise<FeedComment> {
  const raw = await api.post<unknown>(`/feed/posts/${id}/comments`, { body })
  const r = raw as any
  return r?.comment ?? r
}

// PUT /feed/posts/:postId/comments/:commentId — edit a comment
export async function editComment(
  postId: string,
  commentId: string,
  body: string
): Promise<FeedComment> {
  const raw = await api.put<unknown>(`/feed/posts/${postId}/comments/${commentId}`, { body })
  const r = raw as any
  return r?.comment ?? r
}

// DELETE /feed/posts/:postId/comments/:commentId — delete a comment
export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await api.delete<unknown>(`/feed/posts/${postId}/comments/${commentId}`)
}

// GET /feed/search — search posts/feed content
export async function searchFeedItems(query: string, page: number = 1): Promise<FeedPage> {
  if (!query.trim()) return { items: [], total: 0, page: 1 }
  const raw = await api.get<unknown>(
    `/feed/search?q=${encodeURIComponent(query)}&page=${page}`,
    { public: true }
  )
  const r = raw as any
  if (r?.feed) return r.feed
  if (r?.items || r?.data) return r as FeedPage
  return { items: [], total: 0, page: 1 }
}

// GET /feed/org/:orgId — org-scoped feed (PUBLIC)
export async function getOrgFeed(orgId: string, page: number = 1): Promise<FeedPage> {
  const data = await api.get<{ feed: FeedPage }>(`/feed/org/${orgId}?page=${page}`, { public: true })
  return data.feed
}

// GET /feed/team/:teamId — team-scoped feed (PUBLIC)
export async function getTeamFeed(teamId: string, page: number = 1): Promise<FeedPage> {
  const data = await api.get<{ feed: FeedPage }>(`/feed/team/${teamId}?page=${page}`, { public: true })
  return data.feed
}

// GET /feed/match/:fixtureId — match-scoped feed (PUBLIC)
export async function getMatchFeed(fixtureId: string, page: number = 1): Promise<FeedPage> {
  const data = await api.get<{ feed: FeedPage }>(`/feed/match/${fixtureId}?page=${page}`, { public: true })
  return data.feed
}

// POST /feed/news — publish org news article
export async function publishNews(payload: {
  orgId: string
  body: string
  media?: MediaItem[]
  visibility?: 'public' | 'org'
}): Promise<FeedItem> {
  const raw = await api.post<unknown>('/feed/news', payload)
  const r = raw as any
  return r?.item ?? r
}

// POST /feed/posts — create a team/user post
export async function publishPost(payload: {
  teamId?: string
  body: string
  media?: MediaItem[]
  visibility?: 'public' | 'team'
}): Promise<FeedItem> {
  const raw = await api.post<unknown>('/feed/posts', payload)
  const r = raw as any
  return r?.item ?? r
}

// POST /feed/:id/repost
export async function repost(id: string, body?: string): Promise<FeedItem> {
  const raw = await api.post<unknown>(`/feed/${id}/repost`, { body })
  const r = raw as any
  return r?.item ?? r
}

