# Gaffer Frontend — Session Handoff

**Date:** 2026-04-05
**Branch:** `Adefolabi` (23 commits ahead of `origin/adefolabi`)
**Stack:** Next.js 14 App Router · TanStack Query v5 · Zustand · Zod + react-hook-form · Framer Motion · Tailwind CSS (custom gaffer-* tokens) · TypeScript strict

---

## Project Location
```
C:\Users\adefo\OneDrive\Desktop\gaffer-frontend
```

## Key Environment Facts
- `eslint: { ignoreDuringBuilds: true }` is set in `next.config.js` — build won't fail on lint errors
- `NEXT_PUBLIC_API_URL` must NOT have a trailing slash (handled in `lib/api.ts` with `.replace(/\/$/, '')`)
- `JerseyPattern` type only accepts `'solid'` — no `'stripes'`, `'gradient'`, `'split'`
- Deploy via Vercel CLI: `vercel --prod` (not GitHub-linked, CLI-only)

## Auth Architecture
- JWT Bearer token stored **in-memory** + mirrored to a `gaffer-auth-token` cookie for SSR
- HttpOnly refresh cookie handled automatically by `lib/api.ts` (auto-retries on 401)
- `useAuthStore` (Zustand): `user`, `role` (`'personal' | 'organization' | null`), `logout()`, `setProfile()`
- Google OAuth: `useGoogleLogin` from `@react-oauth/google`, calls `POST /auth/google { idToken }` → `googleAuth()` in `auth.service.ts`

## API Client (`lib/api.ts`)
```ts
api.get<T>(path, opts?)
api.post<T>(path, body?, opts?)
api.put<T>(path, body?, opts?)
api.patch<T>(path, body?, opts?)
api.delete<T>(path, opts?)
// opts.public = true → skips Bearer token
```
Error helper: `getErrorMessage(err)` — handles ApiError + Zod details
Image URL helper: `getImageUrl(path)` — prefixes relative paths with backend base URL

---

## Modules Completed This Session

### 1. Feed Module (`lib/services/feed.service.ts`)
All 13 endpoints wired:

| Method | Path | Service fn | UI |
|--------|------|-----------|-----|
| GET | `/feed` | `getGlobalFeed(page)` | `app/app/news/page.tsx` |
| GET | `/feed/news` | `getNewsFeed(page)` | `app/app/news/page.tsx` (news section) |
| GET | `/feed/posts/:postId` | `getFeedItem(id)` | `app/app/news/[articleId]/page.tsx` |
| PUT | `/feed/posts/:postId` | `updatePost(id, payload)` | (available, not yet surfaced in UI) |
| DELETE | `/feed/posts/:postId` | `deletePost(id)` | `app/admin/news/page.tsx` (trash button) |
| POST | `/feed/posts/:postId/likes` | `likeFeedItem(id)` | `NewsCard`, `TrendingPost`, `ArticleDetail` |
| DELETE | `/feed/posts/:postId/likes` | `unlikeFeedItem(id)` | same — optimistic toggle |
| GET | `/feed/posts/:postId/comments` | `getComments(id, page)` | `ArticleDetail` (expandable section) |
| POST | `/feed/posts/:postId/comments` | `addComment(id, body)` | `ArticleDetail` (input + Enter key) |
| PUT | `/feed/posts/:postId/comments/:commentId` | `editComment(postId, commentId, body)` | (available, not yet surfaced) |
| DELETE | `/feed/posts/:postId/comments/:commentId` | `deleteComment(postId, commentId)` | (available, not yet surfaced) |
| GET | `/feed/search` | `searchFeedItems(query, page)` | `app/app/news/search/page.tsx` |
| POST | `/feed/news` | `publishNews(payload)` | `app/admin/news/page.tsx` |
| POST | `/feed/posts` | `publishPost(payload)` | (available) |

**Key pattern:** Like/unlike uses optimistic update → revert on error.
`ArticleDetail` now accepts `isLiked`, `commentsCount` props (passed from parent).

---

### 2. Notifications Module (`lib/services/notifications.service.ts`)
All 13 endpoints wired:

| Method | Path | Service fn | UI |
|--------|------|-----------|-----|
| GET | `/notifications` | `getInboxNotifications(page)` | `app/app/notifications/page.tsx` + `app/admin/notifications/page.tsx` |
| PATCH | `/notifications/:id/read` | `markNotificationRead(id)` | tap notification item |
| PATCH | `/notifications/read-all` | `markAllRead()` | "Mark all read" button |
| DELETE | `/notifications/:id` | `deleteNotification(id)` | X button per notification |
| DELETE | `/notifications` | `clearAllNotifications()` | "Clear All" footer button |
| POST | `/notifications/push/subscribe` | `subscribePush(sub)` | `hooks/usePushNotifications.ts` |
| DELETE | `/notifications/push/subscribe` | `unsubscribePush(endpoint)` | same hook |
| POST | `/notifications/follow/match/:matchId` | `followMatch(id)` | Bell button in `app/app/match/[matchId]/page.tsx` header |
| DELETE | `/notifications/follow/match/:matchId` | `unfollowMatch(id)` | same |
| POST | `/notifications/follow/team/:teamId` | `followTeam(id)` | Bell button per row in `app/app/league/[leagueId]/table/page.tsx` |
| DELETE | `/notifications/follow/team/:teamId` | `unfollowTeam(id)` | same |
| POST | `/notifications/follow/competition/:competitionId` | `followCompetition(id)` | Bell button in league home + details page headers |
| DELETE | `/notifications/follow/competition/:competitionId` | `unfollowCompetition(id)` | same |

**Follow state** is derived from `GET /notifications/preferences` → `preferences.followedMatches / followedTeams / followedCompetitions`.
**Admin notifications page** was previously pure mock (local Zustand store) — now fully replaced with real API queries.

---

## Previously Completed (before this session)

### Authentication
- `POST /auth/login` → `login()` — `app/auth/login/page.tsx`
- `POST /auth/signup` → `register()` — `app/auth/signup/page.tsx`
- `POST /auth/signup/organization` → `registerOrg()` — `app/auth/signup/organization/page.tsx`
- `POST /auth/google` → `googleAuth(idToken)` — login + signup pages
- `POST /auth/refresh` — automatic, handled in `lib/api.ts`
- `POST /auth/logout` → `logout()` — profile + sidebar

### User Profile
- `GET /users/me` → `getProfile()` — `app/app/profile/page.tsx`, `app/admin/profile/page.tsx`
- `PUT /users/me` → `updateProfile()` — edit mode in both pages
- `POST /users/me/avatar` → `uploadAvatar(file)` — camera button in profile
- `DELETE /users/me` → `deleteAccount()` — destructive button with ConfirmDialog

### Organisation
- `GET /orgs` → `listOrgs()` — used across admin pages
- `POST /orgs` → `createOrg()` — AccountUpgradeModal
- `PUT /orgs/:id/logo` → `updateOrgLogo(id, file)` — `app/admin/settings/page.tsx`
- `DELETE /orgs/:id` → `deleteOrg(id)` — OrganizationSidebar destructive button

### Fantasy
- `GET /fantasy/:id/team/me` → `getMyFantasyTeam(id)` — FantasyTeamScreen (on mount)
- `POST /fantasy/:id/team` → `createFantasyTeam(id, payload)` — team creation flow
- `PUT /fantasy/:id/team/squad` → `setSquad(id, payload)` — squad save
- `POST /fantasy/:id/transfers` → `makeTransfer(id, payload)` — transfers page
- `POST /fantasy/:id/chips/:gwId` → `activateChip(id, type, gwId)` — chips page
- `GET /fantasy/:id/gameweeks` → `listGameweeks(id)` — chips + league home pages

---

## Remaining Work (not yet wired)
These service methods exist but have **no UI call site yet**:

- `updatePost(id, payload)` — PUT `/feed/posts/:postId` — edit post modal needed
- `editComment(postId, commentId, body)` — PUT `/feed/posts/:postId/comments/:commentId`
- `deleteComment(postId, commentId)` — DELETE `/feed/posts/:postId/comments/:commentId`
- `repost(id, body)` — POST `/feed/:id/repost`
- `getOrgFeed`, `getTeamFeed`, `getMatchFeed` — already wired in some places; team/match feeds not surfaced in dedicated UI yet

## Common Patterns Used

### Data fetch (React Query)
```ts
const { data, isLoading } = useQuery({
  queryKey: ['key', id],
  queryFn: () => serviceMethod(id),
  staleTime: 60_000,
})
```

### Mutation with optimistic update
```ts
const mutation = useMutation({
  mutationFn: () => apiCall(),
  onMutate: () => { /* optimistic */ },
  onSuccess: () => qc.invalidateQueries({ queryKey: ['key'] }),
  onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
})
```

### Toast
```ts
const toast = useToastStore()
toast.addToast('Message', 'success' | 'error' | 'info')
// or via useToast hook:
const { addToast } = useToast()
addToast('Message', 'success')
```

### Safe back navigation
```ts
const goBack = useGoBack('/fallback/path')  // hook in hooks/useGoBack.ts
```

### ConfirmDialog (destructive actions)
```tsx
<ConfirmDialog
  open={showDialog}
  title="Title"
  message="Are you sure?"
  confirmLabel="Delete"
  destructive
  onConfirm={() => mutation.mutate()}
  onCancel={() => setShowDialog(false)}
/>
```

---

## File Structure Quick Reference
```
lib/
  api.ts                          ← core fetch client
  services/
    auth.service.ts
    user.service.ts
    org.service.ts
    team.service.ts
    player.service.ts
    competition.service.ts
    fixture.service.ts
    match.service.ts
    standings.service.ts
    stats.service.ts
    fantasy.service.ts
    feed.service.ts               ← Feed module ✅
    notifications.service.ts      ← Notifications module ✅
store/
  authStore.ts
  toastStore.ts
  uiStore.ts                      ← activeCompetitionId, activeOrgId
  notifStore.ts                   ← legacy mock, replaced by real API
hooks/
  useGoBack.ts
  usePushNotifications.ts
  useAuthGuard.ts
components/
  ConfirmDialog.tsx
  home/
    NewsCard.tsx                  ← real like/unlike ✅
    TrendingPost.tsx              ← real like/unlike ✅
    ArticleDetail.tsx             ← real like + comments section ✅
```
