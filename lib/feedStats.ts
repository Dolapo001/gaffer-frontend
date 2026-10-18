import { create } from 'zustand'

export interface PostStats {
  liked?: boolean
  likes?: number
  comments?: number
  reposts?: number
  reposted?: boolean
}

interface FeedStatsState {
  byId: Record<string, PostStats>
  patch: (id: string, stats: PostStats) => void
  clear: (id: string) => void
}

/**
 * What the person has just done to a post (liked it, reposted it, commented on it), kept in one place per post.
 * Every card showing the same post (the repost card and the original, the home feed and the article page) reads
 * from here, so they always agree. When fresh numbers arrive from the server they replace it.
 */
export const useFeedStats = create<FeedStatsState>((set) => ({
  byId: {},
  patch: (id, stats) => set((s) => ({ byId: { ...s.byId, [id]: { ...s.byId[id], ...stats } } })),
  clear: (id) => set((s) => {
    if (!s.byId[id]) return s
    const { [id]: _gone, ...rest } = s.byId
    return { byId: rest }
  }),
}))
