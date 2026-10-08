import { api } from '@/lib/api'

export type VerificationStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type LifecycleStatus = 'active' | 'inactive' | 'suspended' | 'deleted'

export interface HqStats {
  users: { total: number; today: number; last7Days: number; last30Days: number; organisationOwners: number }
  organisations: { pending: number; approved: number; rejected: number; draft: number; suspended: number; deleted: number }
  leagues: { total: number; byStatus: Record<string, number>; playersJoined: number; fantasyTeams: number }
  signupsByDay: { date: string; signups: number }[]
}

export interface HqOrg {
  id: string
  name: string
  handle: string
  email: string | null
  description: string | null
  logoUrl: string | null
  verificationStatus: VerificationStatus
  lifecycleStatus: LifecycleStatus
  application: {
    socialLinks?: string[]
    phone?: string
    proofUrl?: string
    submittedAt?: string
    reviewedAt?: string
    rejectionReason?: string
  }
  suspension: { reason?: string; at?: string } | null
  deletedAt: string | null
  createdAt: string
  owner: { id: string; fullName?: string | null; email?: string } | null
}

export interface HqOrgList {
  orgs: HqOrg[]
  total: number
  page: number
  pageSize: number
}

export interface HqOrgDetail {
  org: HqOrg
  competitions: { id: string; name: string; status: string; createdAt: string }[]
  playersJoined: number
}

export interface HqAuditEntry {
  id: string
  actorEmail?: string
  action: string
  targetType: string
  targetLabel?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface NewOrgInput {
  name: string
  handle: string
  ownerEmail: string
  ownerName?: string
  description?: string
  phone?: string
  socialLinks?: string[]
}

export type HqNewsStatus = 'scheduled' | 'active' | 'unpublished'

export interface HqNews {
  id: string
  title: string
  body: string
  imageUrl: string | null
  isPinned: boolean
  status: HqNewsStatus
  push: boolean
  publishAt: string | null
  pushedAt: string | null
  createdAt: string
}

export interface NewsInput {
  title?: string
  body: string
  imageUrl?: string
  pinned?: boolean
  push?: boolean
  publishAt?: string
}

export interface WelcomeMessage {
  title: string
  body: string
  imageUrl: string | null
  postsUpdated?: number
}

export type ChipType = 'bench_boost' | 'free_hit' | 'triple_captain' | 'wildcard'

export interface ChipFields {
  coins?: number
  max?: number
  cooldown?: number
  available?: boolean
  freeGranted?: number
}

/** One layer of chip rules (HQ's global rules, or one tournament's override). Every field is optional. */
export interface ChipLayer {
  purchasesEnabled?: boolean
  grants?: { onJoin?: boolean; atGameweek?: number | null }
  chips?: Partial<Record<ChipType, ChipFields>>
}

export interface ChipRules {
  purchasesEnabled: boolean
  grants: { onJoin: boolean; atGameweek: number | null }
  chips: Record<ChipType, Required<ChipFields> & { naira?: number }>
}

export interface HqChips {
  chipTypes: ChipType[]
  defaults: ChipRules
  global: ChipLayer
  effective: ChipRules
  competitions: { id: string; name: string; status: string; hasOverride: boolean }[]
}

export interface HqUser {
  id: string
  email: string | null
  fullName: string | null
  username: string | null
  status: 'pending' | 'active' | 'suspended' | 'deleted'
  isOrgOwner: boolean
  platformRole: string | null
  createdAt: string
  lastLoginAt: string | null
  leaguesJoined?: number
}

export interface HqUserDetail {
  user: HqUser & { phone: string | null }
  leagues: { id: string; name: string; status: string; joinedAt: string }[]
  fantasyTeams: { id: string; name: string; tournament: string | null; points: number; hidden: boolean }[]
  organisations: { id: string; name: string; handle: string; verificationStatus: string; lifecycleStatus: string }[]
  wallet: { balance: number }
  transactions: { id: string; type: 'credit' | 'debit'; coins: number; source: string; balanceAfter: number; createdAt: string }[]
}

export interface HqTournament {
  id: string
  name: string
  status: string
  hidden: boolean
  hiddenReason: string | null
  organisation: { id: string; name: string; handle: string } | null
  playersJoined: number
  startDate: string | null
  createdAt: string
}

export interface HqPaymentsSummary {
  revenueNaira: number
  coinsSold: number
  paidPurchases: number
  pendingPurchases: number
  failedPurchases: number
  coinsInWallets: number
  walletsWithCoins: number
  coinsSpentOnChips: number
  chipsBought: number
  revenueByDay: { date: string; naira: number }[]
}

export interface HqPurchase {
  id: string
  user: { id: string; email: string; fullName: string | null } | null
  packId: string
  coins: number
  amountNaira: number
  status: 'pending' | 'paid' | 'failed'
  reference: string
  createdAt: string
  paidAt: string | null
}

export interface HqTransaction {
  id: string
  user: { id: string; email: string } | null
  type: 'credit' | 'debit'
  coins: number
  source: string
  balanceAfter: number
  createdAt: string
}

export interface HqContentItem {
  id: string
  type: string
  title: string | null
  body: string
  imageUrl: string | null
  author: string
  authorType: string
  organisation: string | null
  comments: number
  createdAt: string
}

export interface HqComment {
  id: string
  body: string
  createdAt: string
  user: { id: string; email: string; fullName: string | null } | null
}

function qs(params: Record<string, string | number | undefined>) {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const hqService = {
  me: () => api.get<{ admin: { userId: string; email: string } }>('/platform/me'),
  stats: () => api.get<HqStats>('/platform/stats'),

  listOrgs: (f: { verificationStatus?: VerificationStatus; lifecycleStatus?: LifecycleStatus; q?: string; page?: number }) =>
    api.get<HqOrgList>(`/platform/orgs${qs(f)}`),
  getOrg: (id: string) => api.get<HqOrgDetail>(`/platform/orgs/${id}`),
  createOrg: (input: NewOrgInput) => api.post<{ org: HqOrg; inviteLink: string | null }>('/platform/orgs', input),
  approveOrg: (id: string) => api.post<{ org: HqOrg }>(`/platform/orgs/${id}/approve`),
  rejectOrg: (id: string, reason: string) => api.post<{ org: HqOrg }>(`/platform/orgs/${id}/reject`, { reason }),
  suspendOrg: (id: string, reason?: string) => api.post<{ org: HqOrg }>(`/platform/orgs/${id}/suspend`, { reason }),
  restoreOrg: (id: string) => api.post<{ org: HqOrg }>(`/platform/orgs/${id}/restore`),
  deleteOrg: (id: string) => api.delete<{ org: HqOrg }>(`/platform/orgs/${id}`),

  listNews: (status?: HqNewsStatus) => api.get<{ news: HqNews[] }>(`/platform/news${qs({ status })}`),
  createNews: (input: NewsInput) => api.post<{ news: HqNews; sent: { notified: number; pushed: number } | null }>('/platform/news', input),
  updateNews: (id: string, changes: Partial<NewsInput>) => api.patch<{ news: HqNews }>(`/platform/news/${id}`, changes),
  unpublishNews: (id: string) => api.post<{ news: HqNews }>(`/platform/news/${id}/unpublish`),
  publishNews: (id: string, push = false) => api.post<{ news: HqNews; sent: { notified: number; pushed: number } | null }>(`/platform/news/${id}/publish`, { push }),
  deleteNews: (id: string) => api.delete<{ ok: boolean }>(`/platform/news/${id}`),
  uploadNewsImage: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ imageUrl: string }>('/platform/news/image', form)
  },

  getWelcome: () => api.get<WelcomeMessage>('/platform/welcome'),
  setWelcome: (w: { title: string; body: string; imageUrl?: string }) => api.put<WelcomeMessage>('/platform/welcome', w),

  getChips: () => api.get<HqChips>('/platform/chips'),
  setChipsGlobal: (layer: ChipLayer) => api.put<{ global: ChipLayer; effective: ChipRules }>('/platform/chips/global', layer),
  getChipsForCompetition: (id: string) =>
    api.get<{ competition: { id: string; name: string }; override: ChipLayer; effective: ChipRules }>(`/platform/chips/competitions/${id}`),
  setChipsForCompetition: (id: string, layer: ChipLayer) =>
    api.put<{ override: ChipLayer; effective: ChipRules }>(`/platform/chips/competitions/${id}`, layer),
  clearChipsForCompetition: (id: string) => api.delete<{ override: ChipLayer; effective: ChipRules }>(`/platform/chips/competitions/${id}`),
  giveChips: (input: { competitionId: string; chipType: ChipType; count?: number; email?: string }) =>
    api.post<{ players: number; count: number; chipType: ChipType }>('/platform/chips/give', input),

  listUsers: (f: { q?: string; status?: string; page?: number }) =>
    api.get<{ users: HqUser[]; total: number; page: number; pageSize: number }>(`/platform/users${qs(f)}`),
  getUser: (id: string) => api.get<HqUserDetail>(`/platform/users/${id}`),
  suspendUser: (id: string, reason?: string) => api.post<{ user: HqUser }>(`/platform/users/${id}/suspend`, { reason }),
  restoreUser: (id: string) => api.post<{ user: HqUser }>(`/platform/users/${id}/restore`),
  deleteUser: (id: string) => api.post<{ user: HqUser }>(`/platform/users/${id}/delete`),
  adjustCoins: (id: string, amount: number, reason: string) => api.post<{ balance: number; amount: number }>(`/platform/users/${id}/coins`, { amount, reason }),

  purgeOrg: (id: string, confirmName: string) => api.post<{ ok: boolean; tournaments: number; teams: number }>(`/platform/orgs/${id}/purge`, { confirmName }),

  listTournaments: (f: { q?: string; status?: string; hidden?: string; page?: number }) =>
    api.get<{ tournaments: HqTournament[]; total: number; page: number; pageSize: number }>(`/platform/tournaments${qs(f)}`),
  hideTournament: (id: string, reason?: string) => api.post<{ tournament: HqTournament }>(`/platform/tournaments/${id}/hide`, { reason }),
  unhideTournament: (id: string) => api.post<{ tournament: HqTournament }>(`/platform/tournaments/${id}/unhide`),
  deleteTournament: (id: string, confirmName: string) => api.post<{ ok: boolean }>(`/platform/tournaments/${id}/delete`, { confirmName }),

  paymentsSummary: () => api.get<HqPaymentsSummary>('/platform/payments/summary'),
  paymentsPurchases: (f: { status?: string; page?: number }) =>
    api.get<{ purchases: HqPurchase[]; total: number; page: number; pageSize: number }>(`/platform/payments/purchases${qs(f)}`),
  paymentsTransactions: (f: { source?: string; page?: number }) =>
    api.get<{ transactions: HqTransaction[]; total: number; page: number; pageSize: number }>(`/platform/payments/transactions${qs(f)}`),

  listContent: (f: { q?: string; type?: string; page?: number }) =>
    api.get<{ items: HqContentItem[]; total: number; page: number; pageSize: number }>(`/platform/content${qs(f)}`),
  removeContent: (id: string, reason?: string) => api.post<{ ok: boolean }>(`/platform/content/${id}/remove`, { reason }),
  editContent: (id: string, input: { title?: string; body?: string }) => api.patch<{ ok: boolean }>(`/platform/content/${id}`, input),
  listComments: (id: string) => api.get<{ comments: HqComment[] }>(`/platform/content/${id}/comments`),
  removeComment: (id: string, reason?: string) => api.post<{ ok: boolean }>(`/platform/comments/${id}/remove`, { reason }),

  audit: (f: { page?: number; action?: string }) =>
    api.get<{ entries: HqAuditEntry[]; total: number; page: number; pageSize: number }>(`/platform/audit${qs(f)}`),
}
