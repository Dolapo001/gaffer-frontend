// Mock data for development — replace with real API calls in production

export interface Article {
  id: string
  title: string
  summary: string
  excerpt: string
  content: string
  image: string
  imageUrl: string
  category: string
  date: string
  publishedAt: string
  likes: number
  timeAgo: string
  source: {
    name: string
    avatar?: string
    verified?: boolean
  }
  author: {
    name: string
    handle: string
    avatar?: string
    verified?: boolean
  }
}

export interface League {
  id: string
  name: string
  country: string
  logo?: string
  season: string
  dateRange: string
  verified?: boolean
}

const AUTHOR_DESK = { name: 'GAFFER Sports Desk', handle: '@gaffersports', verified: true }
const SOURCE_DESK = { name: 'GAFFER Sports Desk', verified: true }

export const TOP_NEWS: Article[] = [
  {
    id: '1',
    title: 'Premier League Roundup: Week 28',
    summary: "All the action from this weekend's top-flight fixtures.",
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    image: '/images/news-hero.jpg',
    imageUrl: '/images/news-hero.jpg',
    category: 'Football',
    date: 'Mar 10, 2024',
    publishedAt: '2024-03-10T10:00:00Z',
    excerpt: 'Read more...',
    timeAgo: '2h ago',
    likes: 247,
    source: SOURCE_DESK,
    author: AUTHOR_DESK,
  },
  {
    id: '2',
    title: 'Transfer Window: Latest Rumours',
    summary: 'Which clubs are making moves ahead of the summer transfer window?',
    content:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
    image: '/images/news-hero.jpg',
    imageUrl: '/images/news-hero.jpg',
    category: 'Transfers',
    date: 'Mar 9, 2024',
    publishedAt: '2024-03-09T14:30:00Z',
    excerpt: 'Read more...',
    timeAgo: '1d ago',
    likes: 184,
    source: SOURCE_DESK,
    author: AUTHOR_DESK,
  },
  {
    id: '3',
    title: 'Injury Update: Key Players Return',
    summary: 'Good news for several clubs as first-team stars return to training.',
    content:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo.',
    image: '/images/news-hero.jpg',
    imageUrl: '/images/news-hero.jpg',
    category: 'Injuries',
    date: 'Mar 8, 2024',
    publishedAt: '2024-03-08T09:15:00Z',
    excerpt: 'Read more...',
    timeAgo: '2d ago',
    likes: 92,
    source: SOURCE_DESK,
    author: AUTHOR_DESK,
  },
  {
    id: '4',
    title: 'Champions League Preview',
    summary: 'The biggest games of the week — who will advance to the semi-finals?',
    content:
      'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti.',
    image: '/images/news-hero.jpg',
    imageUrl: '/images/news-hero.jpg',
    category: 'Champions League',
    date: 'Mar 7, 2024',
    publishedAt: '2024-03-07T08:00:00Z',
    excerpt: 'Read more...',
    timeAgo: '3d ago',
    likes: 315,
    source: SOURCE_DESK,
    author: AUTHOR_DESK,
  },
]

export const TRENDING_POSTS: Article[] = [
  {
    id: 't1',
    title: 'Top 5 Goals of the Month',
    summary: 'The most spectacular strikes from across the footballing world.',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    image: '/images/news-hero.jpg',
    imageUrl: '/images/news-hero.jpg',
    category: 'Highlights',
    date: 'Mar 10, 2024',
    publishedAt: '2024-03-10T12:00:00Z',
    excerpt: 'Read more...',
    timeAgo: '5h ago',
    likes: 528,
    source: SOURCE_DESK,
    author: AUTHOR_DESK,
  },
  {
    id: 't2',
    title: 'Manager of the Month Award',
    summary: 'Who takes home the prestigious award this month?',
    content: 'Ut enim ad minim veniam, quis nostrud exercitation.',
    image: '/images/news-hero.jpg',
    imageUrl: '/images/news-hero.jpg',
    category: 'Awards',
    date: 'Mar 9, 2024',
    publishedAt: '2024-03-09T16:00:00Z',
    excerpt: 'Read more...',
    timeAgo: '1d ago',
    likes: 203,
    source: SOURCE_DESK,
    author: AUTHOR_DESK,
  },
  {
    id: 't3',
    title: 'Academy Stars to Watch',
    summary: 'The next generation of football talent coming through the ranks.',
    content: 'Duis aute irure dolor in reprehenderit in voluptate velit.',
    image: '/images/news-hero.jpg',
    imageUrl: '/images/news-hero.jpg',
    category: 'Youth',
    date: 'Mar 8, 2024',
    publishedAt: '2024-03-08T11:00:00Z',
    excerpt: 'Read more...',
    timeAgo: '2d ago',
    likes: 147,
    source: SOURCE_DESK,
    author: AUTHOR_DESK,
  },
]

export const FAVOURITE_LEAGUES: League[] = [
  { id: '1', name: 'Premier League', country: 'England', season: '2023/24', dateRange: 'Aug 2023 – May 2024', verified: true },
  { id: '2', name: 'La Liga', country: 'Spain', season: '2023/24', dateRange: 'Aug 2023 – May 2024', verified: true },
  { id: '3', name: 'Bundesliga', country: 'Germany', season: '2023/24', dateRange: 'Aug 2023 – May 2024', verified: true },
  { id: '4', name: 'Serie A', country: 'Italy', season: '2023/24', dateRange: 'Aug 2023 – May 2024', verified: true },
  { id: '5', name: 'Ligue 1', country: 'France', season: '2023/24', dateRange: 'Aug 2023 – May 2024', verified: true },
  { id: '6', name: 'NPFL', country: 'Nigeria', season: '2023/24', dateRange: 'Sep 2023 – Jun 2024' },
]
