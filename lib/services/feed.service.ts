import { api } from '@/lib/api'
import { track } from '@/lib/analytics'

export interface MediaItem {
  url: string
  type: 'image' | 'video' | 'link'
}

export interface PopulatedAuthor {
  _id: string
  name?: string | null
  handle?: string | null
  logoUrl?: string | null
  fullName?: string | null
  /** The name the person asked to be called */
  displayName?: string | null
  username?: string | null
  avatarUrl?: string | null
}

export interface FeedItem {
  _id: string
  type: 'news' | 'post' | 'repost' | 'match_event' | 'poll'
  authorType: 'org' | 'team' | 'user' | 'system'
  authorRef?: 'Org' | 'Team' | 'User' | null
  /** Display name for system posts where authorId is absent (e.g. "GAFFER") */
  authorName?: string | null
  authorId?: PopulatedAuthor | null
  orgId?: string | null
  teamId?: string | null
  title?: string | null
  body: string
  imageUrl?: string | null
  media?: MediaItem[]
  visibility: 'public' | 'org' | 'team'
  allowComments: boolean
  likesCount: number
  commentsCount?: number
  commentCount?: number
  repostCount?: number
  isLiked?: boolean
  /** True when the signed-in viewer has already reposted this item */
  isReposted?: boolean
  /** On a repost card: the people you follow who reposted it (several plain reposts are one card) */
  repostedBy?: { id: string; name: string }[]
  /** Polls: the question is body. Results are left out until the viewer has voted or the poll has closed. */
  poll?: {
    kind?: 'standard' | 'motm'
    endsAt?: string | null
    closed?: boolean
    totalVotes?: number
    options: { _id: string; text: string; votes?: number }[]
  }
  /** Polls: the option the viewer voted for */
  myVote?: string | null
  parentFeedId?: FeedItem | null
  /** True on auto-generated welcome posts created by the backend */
  isDefault?: boolean
  /** True when the post should be surfaced at the top of the feed */
  isPinned?: boolean
  createdAt: string
  updatedAt: string
}

export interface FeedComment {
  _id: string
  feedItemId?: string
  userId: { _id: string; fullName?: string | null; displayName?: string | null; username?: string | null; avatarUrl?: string | null } | null
  body: string
  createdAt: string
  /** Set on a reply: the top-level comment whose thread it belongs to */
  parentCommentId?: string | null
  /** Set on a reply: who it is answering */
  replyToUserId?: { _id: string; fullName?: string | null; displayName?: string | null; username?: string | null } | null
  /** On a top-level comment: how many replies it has */
  replyCount?: number
}

export interface FeedPage {
  items?: FeedItem[]
  data?: FeedItem[]
  total: number
  page: number
}

// GET /feed — main feed (all types), page 1 cached.
// Auth header is included when a token is present so the backend can return
// org-scoped items (visibility:'org') that the logged-in user is a member of.
export async function getGlobalFeed(page: number = 1): Promise<FeedPage> {
  const raw = await api.get<unknown>(`/feed?page=${page}`)
  const r = raw as any
  if (Array.isArray(r?.feed)) return { items: r.feed, total: r.feed.length, page }
  if (r?.feed?.items || r?.feed?.data) return r.feed as FeedPage
  if (r?.items || r?.data) return r as FeedPage
  return { items: [], total: 0, page: 1 }
}

// GET /feed/news — news items only.
// Auth header is sent so the backend can return org-scoped news for the
// logged-in user.  Falls back to the global feed when the endpoint is
// unavailable (404) OR returns an empty result set.
export async function getNewsFeed(page: number = 1): Promise<FeedPage> {
  try {
    const raw = await api.get<unknown>(`/feed/news?page=${page}`)
    const r = raw as any
    if (Array.isArray(r?.feed) && r.feed.length > 0) return { items: r.feed, total: r.feed.length, page }
    if (r?.feed?.items?.length || r?.feed?.data?.length) return r.feed as FeedPage
    if (r?.items?.length || r?.data?.length) return r as FeedPage
  } catch {
    // endpoint not available — fall through
  }
  return getGlobalFeed(page)
}

// GET /feed/:id — single post detail
// Not marked public: the api client attaches the token when present so the
// backend can resolve isLiked correctly for authenticated users, while
// unauthenticated requests still work (no token = no Authorization header).
export async function getFeedItem(id: string): Promise<FeedItem> {
  const raw = await api.get<unknown>(`/feed/${id}`)
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

// DELETE /feed/:postId — delete a news or feed post
export async function deletePost(id: string): Promise<void> {
  await api.delete<unknown>(`/feed/${id}`)
}

// PATCH /feed/:id/pin — pin an item to the top of the feeds, or unpin it
export async function setPinned(id: string, isPinned: boolean): Promise<void> {
  await api.patch<unknown>(`/feed/${id}/pin`, { isPinned })
}

// POST /feed/polls — publish a poll as an organisation
export async function publishPoll(payload: {
  orgId: string
  question: string
  options: string[]
  endsAt?: string
  motm?: boolean
  fixtureId?: string
}): Promise<FeedItem> {
  const raw = await api.post<unknown>('/feed/polls', payload)
  const r = raw as any
  return r?.item ?? r
}

// POST /feed/:id/vote — one vote per person
export async function votePoll(id: string, optionId: string): Promise<FeedItem> {
  const raw = await api.post<unknown>(`/feed/${id}/vote`, { optionId })
  track('poll_voted')
  const r = raw as any
  return r?.item ?? r
}

// GET /feed/:id/reposts — who reposted a post
export async function getReposters(id: string): Promise<{ userId: string; name: string; avatarUrl: string | null; quote: string | null; at: string }[]> {
  const d = await api.get<{ reposters: { userId: string; name: string; avatarUrl: string | null; quote: string | null; at: string }[] }>(`/feed/${id}/reposts`)
  return d.reposters ?? []
}

// POST /feed/:postId/like — like a post
export async function likeFeedItem(id: string): Promise<{ message: string }> {
  const data = await api.post<{ message: string }>(`/feed/${id}/like`)
  track('reaction_given')
  return data
}

// DELETE /feed/:postId/like — unlike a post
export async function unlikeFeedItem(id: string): Promise<{ message: string }> {
  const data = await api.delete<{ message: string }>(`/feed/${id}/like`)
  return data
}

// GET /feed/:postId/comments — fetch comments (newest first, 20/page)
export async function getComments(
  id: string,
  page: number = 1
): Promise<{ comments: FeedComment[]; total: number; page: number }> {
  const data = await api.get<{ comments: FeedComment[]; total: number; page: number }>(
    `/feed/${id}/comments?page=${page}`,
    { public: true }
  )
  return data
}

// GET /feed/:postId/comments/:commentId/replies — the replies in one comment's thread, oldest first
export async function getReplies(id: string, commentId: string, page: number = 1): Promise<FeedComment[]> {
  const data = await api.get<{ comments: FeedComment[] }>(`/feed/${id}/comments/${commentId}/replies?page=${page}`, { public: true })
  return data?.comments ?? []
}

// POST /feed/:postId/comments — add a comment, or a reply when parentCommentId is given
export async function addComment(id: string, body: string, parentCommentId?: string): Promise<FeedComment> {
  const raw = await api.post<unknown>(`/feed/${id}/comments`, { body, parentCommentId })
  track('comment_posted')
  const r = raw as any
  return r?.comment ?? r
}

// PUT /feed/:postId/comments/:commentId — edit a comment
export async function editComment(
  postId: string,
  commentId: string,
  body: string
): Promise<FeedComment> {
  const raw = await api.put<unknown>(`/feed/${postId}/comments/${commentId}`, { body })
  const r = raw as any
  return r?.comment ?? r
}

// DELETE /feed/:postId/comments/:commentId — delete a comment
export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await api.delete<unknown>(`/feed/${postId}/comments/${commentId}`)
}

// GET /feed/search — search posts/feed content
export async function searchFeedItems(query: string, page: number = 1): Promise<FeedPage> {
  if (!query.trim()) return { items: [], total: 0, page: 1 }
  const raw = await api.get<unknown>(
    `/feed/search?q=${encodeURIComponent(query)}&page=${page}`
  )
  const r = raw as any
  if (Array.isArray(r?.feed)) return { items: r.feed, total: r.feed.length, page }
  if (r?.feed?.items || r?.feed?.data) return r.feed as FeedPage
  if (r?.items || r?.data) return r as FeedPage
  return { items: [], total: 0, page: 1 }
}

// GET /feed/org/:orgId — org-scoped feed.
// Auth header included so members see visibility:'org' items.
export async function getOrgFeed(orgId: string, page: number = 1): Promise<FeedPage> {
  const raw = await api.get<unknown>(`/feed/org/${orgId}?page=${page}`)
  const r = raw as any
  if (Array.isArray(r?.feed)) return { items: r.feed, total: r.feed.length, page }
  if (r?.feed?.items || r?.feed?.data) return r.feed as FeedPage
  if (r?.items || r?.data) return r as FeedPage
  return { items: [], total: 0, page: 1 }
}

// GET /feed/team/:teamId — team-scoped feed (PUBLIC)
export async function getTeamFeed(teamId: string, page: number = 1): Promise<FeedPage> {
  const raw = await api.get<unknown>(`/feed/team/${teamId}?page=${page}`, { public: true })
  const r = raw as any
  if (Array.isArray(r?.feed)) return { items: r.feed, total: r.feed.length, page }
  if (r?.feed?.items || r?.feed?.data) return r.feed as FeedPage
  if (r?.items || r?.data) return r as FeedPage
  return { items: [], total: 0, page: 1 }
}

// GET /feed/match/:fixtureId — match-scoped feed (PUBLIC)
export async function getMatchFeed(fixtureId: string, page: number = 1): Promise<FeedPage> {
  const raw = await api.get<unknown>(`/feed/match/${fixtureId}?page=${page}`, { public: true })
  const r = raw as any
  if (Array.isArray(r?.feed)) return { items: r.feed, total: r.feed.length, page }
  if (r?.feed?.items || r?.feed?.data) return r.feed as FeedPage
  if (r?.items || r?.data) return r as FeedPage
  return { items: [], total: 0, page: 1 }
}

// POST /feed/news — publish org news article
export async function publishNews(payload: {
  orgId: string
  title?: string
  body: string
  imageUrl?: string
  media?: MediaItem[]
  targetType?: 'competition' | 'fixture' | 'team' | 'org' | 'user'
  targetId?: string
  visibility?: 'public' | 'org'
  isPinned?: boolean
}): Promise<FeedItem> {
  const raw = await api.post<unknown>('/feed/news', payload)
  const r = raw as any
  return r?.item ?? r
}

// POST /feed/posts — create a team/user post
export async function publishPost(payload: {
  /** Exactly one of orgId (the organisation posts as itself) or teamId */
  orgId?: string
  teamId?: string
  body: string
  media?: MediaItem[]
  visibility?: 'public' | 'org' | 'team'
}): Promise<FeedItem> {
  const raw = await api.post<unknown>('/feed/posts', payload)
  const r = raw as any
  return r?.item ?? r
}

// POST /feed/:id/repost
export async function repost(id: string, body?: string): Promise<FeedItem> {
  const raw = await api.post<unknown>(`/feed/${id}/repost`, { body })
  track('repost_made')
  const r = raw as any
  return r?.item ?? r
}

