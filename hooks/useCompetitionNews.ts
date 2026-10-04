import { useQuery } from '@tanstack/react-query'
import { getCompetition } from '@/lib/services/competition.service'
import { getOrgFeed, type FeedItem } from '@/lib/services/feed.service'
import { rankTopNews, resolveOrgId } from '@/lib/newsRanking'

/** News published by the organisation running a competition, ranked for "Top News". */
export function useCompetitionNews(competitionId: string) {
  const { data: competition } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => getCompetition(competitionId),
    enabled: !!competitionId,
  })
  const orgId = resolveOrgId(competition?.orgId)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['org-feed', orgId],
    queryFn: async (): Promise<FeedItem[]> => {
      const res = await getOrgFeed(orgId!)
      return rankTopNews((res.items ?? res.data ?? []) as FeedItem[])
    },
    enabled: !!orgId,
    staleTime: 60_000,
    refetchOnMount: true,
  })

  return { news: items, orgId, isLoading }
}
