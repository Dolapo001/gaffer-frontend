# Gaffer Frontend — Application Flow Document

**Method:** This document was produced by a direct, read-only audit of `app/`, `components/`, and `lib/services/` in this repository (no assumptions about intended behavior, no git history consulted). Every route, click, mutation, and state change below was traced to actual source code — file paths are cited throughout so any claim can be independently re-verified. Where a behavior was ambiguous, unreachable, or apparently dead, it is flagged explicitly rather than guessed at.

**Roles covered:** Public/Unauthenticated visitor, Authenticated Player (personal account), Organization/Admin (tournament manager).

---

## Table of Contents

- [Part I — Routing & Access Control (middleware.ts)](#part-i--routing--access-control-middlewarets)
- [Part II — Public & Auth Flows](#part-ii--public--auth-flows)
  1. Root Landing Page (`/`)
  2. Onboarding-Adjacent Public Screens (`/onboarding/**`)
  3. Auth Routes (`/auth/**`)
  4. Other Public Routes (invite acceptance, recruitment forms)
- [Part III — Authenticated Player App](#part-iii--authenticated-player-app)
  1. App Shell & Bottom Navigation
  2. Dashboard (`/app/dashboard`)
  3. Fantasy Picker (`/app/fantasy`)
  4. Fantasy Competition Shell & Onboarding Wizard
  5. Fantasy Tabs (Home / My Team / Fixtures / Stats)
  6. Shop (`/app/shop`)
  7. Player Onboarding — Invite Acceptance (`/player/onboarding`)
- [Part IV — League Section (Player-Facing Tournament View)](#part-iv--league-section-player-facing-tournament-view)
  0. League Discovery (`/app/league`)
  1. Tab Shell Layout
  2. Overview / Matches / Standings / Knockout / Stats Tabs
- [Part V — Admin (Organization) App](#part-v--admin-organization-app)
  1. Admin Shell & Navigation
  2. Admin Home/Dashboard
  3. Tournaments List & Create Wizard
  4. Tournament Detail (5 tabs)
  5. Fantasy Team Pricing
  6. Tournament Publish Success
  7. Organise — Teams & Groups
  8. Global Schedule
  9. Fixture Detail / Live Match Console
  10. Collaborators (Staff)
  11. News
  12. Notifications
  13. Players (standalone roster page)
  14. Profile
  15. Settings (Org profile)
- [Part VI — Consolidated Cross-Cutting QA Flags](#part-vi--consolidated-cross-cutting-qa-flags)
- [Part VII — Dead / Unreachable Code Inventory](#part-vii--dead--unreachable-code-inventory)

---

# Part I — Routing & Access Control (middleware.ts)

File: `middleware.ts`

**Route classification:**
- `PUBLIC_ROUTES = ['/', '/onboarding']` (exact or prefix match) — fully bypasses the auth gate.
- `RECRUIT_PREFIX = '/recruit'` — any `/recruit/*` path is public unconditionally.
- **Dynamic public catch-all**: `RESERVED_TOP_SEGMENTS = ['auth','admin','app','onboarding','organization','player','recruit']`. Any first path segment NOT in this list is treated as a `/[competition]/[...slug]` public recruitment route and let through — covers URLs like `/premier-league/team-handle`.
- `INVITE_ROUTES = ['/player/onboarding', '/organization/onboarding']` — always public; the token in the URL is the credential.
- `AUTH_ROUTES = ['/auth']`, `APP_ROUTES = ['/app']`, `ADMIN_ROUTES = ['/admin']` — gated on the `gaffer-auth-token` cookie.

**Redirect rules (evaluated in order):**
1. Unauthenticated + non-public, non-auth route → `/auth/login?next=<originalPath>`.
2. Authenticated but role ≠ `organization` visiting `/admin/*` → `/app/dashboard`.
3. Authenticated user visiting any `/auth/*` page → `/admin` (if `organization`) or `/app/dashboard` (otherwise) — **except** `/auth/signup/organization`, which authenticated users are allowed to keep filling out.
4. Otherwise, request proceeds.

The auth signal is a lightweight presence cookie `gaffer-auth-token` (set/cleared by `tokenStore` in `lib/api.ts`) plus `gaffer-user-role` (set by `authStore.setRole`/`login`). The cookie carries no sensitive data itself — real authorization happens server-side.

The middleware `matcher` excludes `_next/static`, `_next/image`, favicon/manifest/icons/sw.js/workbox files, and common image/font/video extensions.

---

# Part II — Public & Auth Flows

## II.1 Root Landing Page — `/`

File: `app/page.tsx`

**Page Purpose:** Public marketing/landing page for unauthenticated visitors — a PWA-install funnel ("DOMINATE THE FIELD") rather than a traditional page with login/signup links.

**Data Displayed:** No backend data. Static marketing copy/images via child components (`Navbar`, `Hero`, `StatsBar`, `Features`, `ProductShowcase`, `ForClubs`, `Testimonials`, `Pricing`, `FinalCTA`, `Footer`). On mount, reads `localStorage['gaffer-pending-invite-url']` (iOS PWA deep-link recovery) and calls `isStandalone()` (`lib/pwa.ts`).

**Interactive Elements & Clicks:**
- **Navbar**: 4 in-page anchor links (`#features`, `#fantasy`, `#clubs`, `#pricing`); a "DOWNLOAD" button; mobile hamburger toggle; mobile menu's own "DOWNLOAD APP" button.
- **Hero**: "DOWNLOAD APP" button; "Watch Demo" button (scrolls to `#features`).
- **Pricing**: "Get Started Free" and "Upgrade to Manager" buttons — both cosmetic, no plan-selection logic.
- **FinalCTA**: "DOWNLOAD THE APP" button.
- **ForClubs**: left/right carousel scroll buttons — pure UI.
- **Footer**: Product links scroll to in-page anchors; Company/Legal links (`href="#"`) call `e.preventDefault()` and toast `"${name} feature is coming soon!"`; 4 social icons toast `"Follow us for updates!"` — no real social links exist.
- **IOSInstallBanner**: auto-shows on iOS Safari (non-standalone) after 2.5s; "How?" opens `IOSInstallModal`; dismiss persists via `localStorage['gaffer-ios-banner-dismissed']`.

**Action Outcomes:** **There is no visible "Login" or "Sign Up" link anywhere on the landing page** (confirmed via grep across `components/marketing/*` — no `/auth` references found). Every primary CTA calls the same `handleInstall()` (`hooks/usePWAInstall.ts`):
- Already installed/standalone → `window.location.href = '/app/dashboard'` (middleware redirects unauthenticated visitors to `/auth/login?next=/app/dashboard`).
- iOS (non-standalone) → shows `IOSInstallModal` with manual instructions (no navigation).
- Native `beforeinstallprompt` available → triggers it; on success, navigates to `/app/dashboard` after an 800ms delay.
- No native prompt available → simulates a 1.5s "Downloading..." state then navigates to `/app/dashboard`.

There is no direct button anywhere on this page to `/auth/signup` or `/onboarding/welcome`.

**State Changes:**
- `checking` state shows a spinner while standalone/pending-invite detection runs; in standalone mode, replaces to `/onboarding/splash` without rendering marketing content.
- Footer toasts via the global toast store.

## II.2 Onboarding-Adjacent Public Screens — `app/onboarding/**`

These are `PUBLIC_ROUTES` per middleware and form the pre-auth "Get Started" funnel.

### II.2.1 Splash — `/onboarding/splash`
**Purpose:** Auto-playing video splash shown when the PWA launches in standalone mode.
**Interactive elements:** None; video auto-plays.
**Outcomes:**
- `localStorage['gaffer-pending-invite-url']` set → `router.replace(pendingInvite)` (clears the key first).
- Else `isAuthenticated` → `router.replace(role === 'organization' ? '/admin' : '/app/dashboard')`.
- Else → `router.replace('/onboarding/welcome')`.
- Triggered by video `onEnded`, a 4s primary timer, or a 6s hard failsafe timer.

### II.2.2 Welcome — `/onboarding/welcome`
**Interactive elements:** "GET STARTED" → `/onboarding/role-select`. "LOGIN" → `/auth/login`.
**State:** Pure navigation, no data/loading states.

### II.2.3 Role Select — `/onboarding/role-select`
**Interactive elements:** Back button (`useGoBack('/')`); two `RoleCard` tiles (Personal/Organization, `setSelectedRole`); "Next" (disabled until a role is picked); "Login" link → `/auth/login`.
**Outcomes:**
- "Next" → `setRole(selectedRole)` on `useAuthStore`, opens `AccountInfoModal`.
- Modal CTA ("Continue as Personal"/"Continue as Organization") → closes modal, routes to `/auth/signup/organization` or `/auth/signup`.
**State:** No error/toast states — navigation-only.

### II.2.4 Organization Setup (post-login) — `/onboarding/organization`
**Purpose:** Isolated org-creation screen for an **already-authenticated personal user** switching to/creating an organization. Distinct from `/auth/signup/organization` (fresh signups).
**Data:** Pre-fills `email` from `useAuthStore`. Validated by `organizationSignUpSchema` (`lib/schemas.ts`).
**Interactive elements:** Back → `/app/dashboard`; Org Name, Handle (`@`-prefixed), Sport select; "Create Organization" submit.
**Outcomes:** `createOrg({...})` (`lib/services/org.service.ts`). On success: `updateUser({isOrgActive:true, lastRole:'organization'})`, `setRole('organization')`, toast "Organization created successfully!", `router.replace('/admin')`.
**State:**
- Guard: unauthenticated → `router.replace('/auth/login')` — **this page requires a session despite living under the nominally-public `/onboarding` prefix**, enforced only by a client-side redirect, not middleware. Possible flash-of-protected-content on direct hit.
- If `user.isOrgActive` already true → auto-redirects to `/admin`, skipping the form.
- On error: toast `getErrorMessage(err)`, form stays interactive.

## II.3 Auth Routes — `app/auth/**`

Layout (`app/auth/layout.tsx`): if authenticated, immediately `router.replace(role === 'organization' ? '/admin' : '/app/dashboard')`.

### II.3.1 Login — `/auth/login`
**Interactive elements:** Back (`useGoBack('/')`, honors `?returnTo=`); Email/Password inputs (`signInSchema`); password-visibility toggle; **"Remember Me" checkbox — decorative only, not wired to any state or submit payload**; "Forget Password?" → `/auth/forgot-password`; "Login" submit; "Login with Google"; footer "Sign Up" → `/onboarding/role-select` (not `/auth/signup` directly).
**Outcomes:**
- Submit → `login(email, password)` (auth store → `POST /auth/login`), sets `gaffer-user-role` cookie, `router.replace(role==='organization' ? '/admin' : '/app/dashboard')`.
- On failure: store sets `error` (translated via `translateError`), rendered as a red banner; page-level catch is a no-op.
- Google login → `googleAuth(access_token)`; **on error, silently swallowed (`onError: () => {}`) — no user-facing feedback for a failed/cancelled Google popup.**
**State:** `isSubmitting` disables/animates submit button; `clearError()` on unmount.

### II.3.2 Sign Up (Personal) — `/auth/signup`
**Interactive elements:** Email/Password/Confirm/Gender (`signUpSchema`); "Get started" submit; "Sign Up with Google"; footer "Sign In" → `/auth/login`.
**Outcomes:** `registerUser(email, password)` (POST `/auth/register`, falls back to `login()` internally if the backend returns no user/token payload) → `setRole('personal')` → dynamically imports and calls `updateProfile({isPersonalActive:true, lastRole:'personal'})` → `router.replace('/app/dashboard')`.
**Flag:** if `updateProfile` throws after `registerUser` already succeeded, the whole try/catch swallows it silently — no distinct error, and no redirect occurs since `router.replace` is only reached after both awaits succeed.

### II.3.3 Sign Up (Organization) — `/auth/signup/organization`
**Purpose:** Two-step wizard (org identity + registration, then org details) creating both a new org account and its profile in one flow.
**Interactive elements — Step 1:** Org Name, Handle; Full Name/Email/Password/Confirm (only if not authenticated); "Next" (client-side field validation only, no network call).
**Interactive elements — Step 2:** Sport multi-select toggle buttons; Description textarea (max 500); "Get started" submit.
**Outcomes:** If no user yet, `registerUser(email, password)` first; then `createOrg({name, handle, description, sports, ownerId, userFullName})` (creates org **and** updates user profile server-side in one call); on success `setRole('organization')`, `router.replace('/admin')`. On error: `setOrgError(...)`, shown alongside the auth-store `error`.

### II.3.4 Forgot Password — `/auth/forgot-password`
**Interactive elements:** Email input; "Send Reset Link"; (post-send) "Back to Login".
**Outcomes:** `resetPassword(email)` (`lib/services/auth.service.ts` via `lib/auth.ts` re-export). Success → `setSent(true)`, swaps to a confirmation panel (no toast). **Failure shows a hardcoded string** ("Failed to send reset email...") rather than the server's actual message.

### II.3.5 Reset Password — `/auth/reset-password?token=...`
**Interactive elements:** No-token state → "Request New Link" → `/auth/forgot-password`. With token: New/Confirm Password inputs; "Set New Password"; (post-success) "Go to Login".
**Outcomes:** `confirmPasswordReset(token, password)`. Success → `setDone(true)` (no auto-redirect — user must click "Go to Login" manually). **Failure shows a hardcoded string** rather than the server's message.
**Note:** the page's own back button uses plain `router.push('/auth/login')`, unlike other auth pages which use `useGoBack`.

## II.4 Other Public Routes

### II.4.1 Organization Invite Onboarding — `/organization/onboarding?token=...`
**Purpose:** Accept an org-staff invite without a prior account (token is the credential).
**Data:** `useInviteValidation(token, 'organization')` → `validateInvite()` (`lib/services/invite.service.ts`).
**States:** `loading` → spinner; `invalid`/`expired`/`used` → `InviteErrorScreen` with "Go to Homepage" → `/`; `valid` → `OrgInviteForm` (First/Last Name*, Phone, Role picker — 6 options) → "Accept Invitation" → `acceptInvite(token, 'organization', {...})`; success → `isDone=true`, `router.replace('/app/dashboard')` after 3s; error → status-mapped messages (404/410/400) in a red banner.

### II.4.2 Public Team Recruitment (handle) — `/recruit/:handle`
**Purpose:** Fully public "join this team" form; the `[token]` param is actually a **team handle**, not a JWT.
**Data:** `getPublicTeamByHandle(handle)`.
**Interactive elements:** First/Last Name*, Position* (4 toggle buttons), Phone/Email/Jersey# (optional); "Submit Application".
**Outcomes:** `registerPublicPlayer(handle, {...})`. Success → "Application Sent!" panel (no redirect). Failure → error banner, stays on page.

### II.4.3 Public Recruitment via Competition Slug — `/:competitionSlug/:teamHandle` (or `/:group/:teamHandle`)
**Data:** `getPublicTeamByHandle`, `getPublicCompetitionBySlug` (derives sport → position list).
**Interactive elements:** Photo picker (with preview); First/Last Name*; Role toggle (player/captain/coach); Position select + Jersey# (hidden for coach); "Confirm Registration".
**Outcomes:** `registerPublicPlayer(handle, payload)`, then (best-effort, separately caught) `uploadPublicPlayerPhoto(...)` if a photo was picked — a photo-upload failure does **not** fail registration (toasts a warning instead of the success toast). Success → "You're In!" screen, "Finish" → `/`.

---

# Part III — Authenticated Player App

## III.1 App Shell — `app/app/layout.tsx`

**Purpose:** Wraps every `/app/*` route in an auth guard (`useAuthGuard('personal')`), a page-transition wrapper, and the global bottom nav.

**Nav item computation** (based on `activeCompetitionId` from `store/uiStore.ts`):
- **No active competition:** Home → `/app/dashboard`, Fantasy → `/app/fantasy`, League → `/app/league`, News → `/app/news`.
- **Active competition set:** Home → `/app/league/{id}`, Fantasy → `/app/fantasy/{id}`, League → `/app/league/{id}/standings`, News → `/app/news`.

**State:** `EXIT_PATHS = ['/app/dashboard', '/app/league', '/app/fantasy']` — a `useEffect` calls `clearActiveCompetition()` whenever `pathname` **exactly** matches one of these (not sub-paths), resetting nav highlighting. `/app/league/:id` is intentionally excluded so visiting a specific league doesn't reset context; the bare `/app/fantasy` picker is included so it resets a stale `activeCompetitionId` after leaving a competition.

### Bottom Navigation — `components/BottomNavbar.tsx`
Reads `isNavbarHidden` (uiStore) — hidden while a player drawer (`PlayerDetailDrawer`, `CreateTeamPlayerDrawer`) is open, or while inside the League tab shell (layout-scoped `hideNavbar()`/`showNavbar()`).
**Active-state logic:** `/app/dashboard`/`/admin` require exact match; other items match via `pathname.startsWith(itemPath)` with a "longest-prefix wins" disambiguation so siblings don't both light up.

## III.2 Dashboard — `/app/dashboard`

**Data:** `listOrgs()`, `useWallet()`, `getGlobalFeed(1)` (top 1 shown), `useAuthStore`.

**Interactive elements & outcomes:**
- Menu icon → opens `OrganizationSidebar`.
- Wallet pill → `/app/shop`.
- Profile icon → `/app/profile`.
- News card (if present) → `/app/news/{id}?returnTo=/app/dashboard`.
- Tournament CTA: if `hasOrg` → "Go to Organization" (`updateUser({isOrgActive:true, lastRole:'organization'})`, `setRole('organization')`, → `/admin`); else "Upgrade to Org" → `/onboarding/organization`.
- A `window` `'gaffer:upgrade-org'` event listener also routes to `/onboarding/organization` (fired elsewhere, e.g. the sidebar).

**State:** Skeleton pulse while news loads; feed-fetch errors are only `console.error`'d (no user-facing error state); no toasts on this page.

## III.3 Fantasy Competition Picker — `/app/fantasy`

**Data:** `listJoinedCompetitions()`; per competition, `getFantasySeason` + `listGameweeks` (parallel `useQueries`); `hasSeenWelcome` (fantasyStore).

**Interactive elements & outcomes:**
- `FantasyWelcome` full-screen "Get Started" (only if `!hasSeenWelcome`) — fades out over 300ms then sets `hasSeenWelcome=true` (persisted, one-time per device).
- "Discover Leagues" (empty state) → `/app/league`.
- Each `CompetitionFantasyCard` (only competitions with a truthy `season`, i.e. fantasy-enabled) → `/app/fantasy/{competitionId}`.
- "Join New League" → `/app/league`.

**State:** Loading spinner while any query is in flight; two distinct empty states (no joined competitions vs. joined-but-none-fantasy-enabled).

## III.4 Fantasy Competition Shell — `/app/fantasy/[competitionId]`

File: `layout.tsx`. Handles the **onboarding gate** and sets global "active competition" context.

**Data:** `getCompetition`, `getFantasySeason` (→ `squadBudget`), `getMyFantasyTeam` (`retry:false`, drives the gate), `listFixtures` (hydrates `players` via `mapApiTeamToSquad`).

**Interactive elements:** Back → `/app/fantasy`; tab strip (Home `''`, My Team `/team`, Fixtures `/fixtures`, Stats `/stats`).

**Onboarding gate** (`!myTeam && !(hasCreatedTeam && hasNamedTeam && hasOrganizedBench)`) — renders **instead of** the tab shell/children:
1. `!hasCreatedTeam` → `CreateTeamScreen`
2. `!hasNamedTeam` → `TeamNamingScreen`
3. else → `PickTeamOnboarding`

Once cleared, effects fire: `setActiveCompetition(id, orgId)` (switches the global bottom nav to competition-context items), `setSquadBudget`, back-fills onboarding flags from `myTeam`, syncs `teamName`.

### III.4.1 CreateTeamScreen (Step 1)
Tap an empty pitch/bench slot → `PlayerSearchOverlay` (search, All Teams/Max Price filters, 3-per-team cap with a 2.5s toast-style warning) → select adds player, `adjustBudget(-price)`. Tap a filled slot → `CreateTeamPlayerDrawer` (**Remove**; **Transfer** button present but `onTransfer` is not passed by this screen — a no-op during initial creation). "Save Team" (disabled until ≥1 drafted) → `SaveTeamConfirmationModal` → Confirm runs local `apply442()` (auto-4-4-2) + `setPlayers()` — **no backend call at this step**.

### III.4.2 TeamNamingScreen (Step 2)
Text input (uppercased, max 50) → "Confirm" (disabled until non-empty/`isSaving`) → `createTeamOnApi(name)` (**first real backend team-creation call**, `POST /fantasy/:id/team`). Success → `onComplete(name)`. **Failure is only `console.error`'d — user stays on screen with no visible error, unless `code==='TEAM_EXISTS'`, in which case the store proceeds anyway.**

### III.4.3 PickTeamOnboarding (Step 3)
Back → returns to Step 2. `BoostSelector` — **code-marked `@deprecated`**, its cards' own "Play" buttons have no `onClick` at all. Pitch/bench taps → `PlayerDetailDrawer`. "Save Team" → `saveTeamToApi()` (`PUT /fantasy/:id/team/squad`). Success → clears the gate for good. Failure → toast (unlike step 2, this one does surface an error).

## III.5 Fantasy Tabs

### III.5.1 Home — `components/fantasy/home/FantasyHomeTab.tsx`
**Data:** `getMyFantasyTeam`, `getLeaderboard(id,1)`, `listGameweeks`, `listFantasyPlayers(id,{pageSize:50})`.
**Interactive elements:** `ManagerSnapshotCard` "Manage Team" → `/app/fantasy/{id}/team`. `TopPlayersLeaderboard` Total/Average toggle — display-only, no nav/mutation. `CountdownTimer` — display-only.
**Note:** an in-code comment confirms "Top players by round"/"Team of the Round" widgets were **intentionally not built** (no bulk per-round points endpoint; see Backend Contract §9).

### III.5.2 My Team — `components/fantasy/team/MyTeamTab.tsx` (most interaction-dense screen)
**Data:** `getMyFantasyTeam`, `getFantasySeason`, `getFantasyStats`, `listGameweeks`, `listFixtures`; locked players via `computeLockedPlayerIds`.

**Interactive elements & outcomes:**
1. Pitch/bench tap → if `substitutingOutId` is armed: same player cancels; another player → `performSubstitution(outId, inId)` (**local-only**, validates GK-for-GK and position min/max, sets `substituteError` on violation; persists only on next Save). Otherwise → opens `PlayerDetailDrawer`.
2. "Cancel" (while substituting) → clears `substitutingOutId`.
3. "Save Team" (disabled while `isSaving`) → `saveTeamToApi()`. Success → 2200ms "Team Saved!" animation. Failure → `setTeamError(...)` replaces the pitch.
4. "Transfers" → opens `TransfersPanel` (pick-out mode).
5. "Chips" → opens `ChipStoreDrawer`. `ActiveChipBanner` (if a chip is active) also opens it.
6. `PlayerDetailDrawer` actions: **"Make Captain"** → `setSquad(...)` directly (bypasses `saveTeamToApi`), invalidates `['fantasy-team-me', id]`, toasts success/error. **"Sub Out"/"Sub In"** → arms inline substitution mode (item 1). **"Transfer"** → opens `TransfersPanel` pre-seeded with that player.

**State:** `substituteError` surfaces via a toast effect. Both player drawers call `hideNavbar()`/`showNavbar()` on open/close.

### III.5.3 TransfersPanel
Squad row (step 1) → `setPlayerOutId`. Replacement row (step 2, position-filtered, excludes current squad) → `makeTransfer(id, inId, outId)`. Success → invalidates `['fantasy-team-me', id]` (+ `['wallet']` if coin-cost) and toasts a cost-specific message (coin-deducted / points-hit / free); closes panel. Error → toast.

### III.5.4 ChipStoreDrawer
Chip row → nested purchase/activate dialog. "Confirm Purchase" (disabled if insufficient coins/pending) → `purchaseChip(id, chipType)` → invalidates `['chips',id]`+`['wallet']`, toasts success. "Activate for GW{n}" (only if an open/last gameweek exists) → `activateChip(id, chipType, gwId)` → invalidates `['chips',id]`, calls `setActiveChipType` (drives `ActiveChipBanner`), toasts success.

### III.5.5 Fixtures Tab
Delegates to shared `GroupedFixturesView` (By round/date/group/team filters). Fixture row click → `/app/match/{id}`.

### III.5.6 Stats Tab
Goals/Assists toggle (local state, both queries always fetched regardless of active tab). **`TopPlayersList`'s "See All" button has no `onSeeAll` prop passed here — it renders but is a no-op click.**

## III.6 Shop — `/app/shop`

**Data:** `listCoinPacks`, `useWallet()`; reads a `reference` query param set by Paystack's return redirect.

**Interactive elements & outcomes:**
- Back → `useGoBack('/app/dashboard')`.
- Coin-pack row (disabled while pending) → `initiatePurchase(packId)` → success does a **hard redirect** (`window.location.href = authorization_url`, leaves the SPA for Paystack). Error → toast.
- On return (`reference` present): `verifyPayment(reference)`. Success → toast "{n} coins added", invalidates `['wallet']`, `router.replace('/app/shop')` (strips the query param). Failure → toast to contact support.

**State:** Skeleton rows while loading; collapsible "Verifying Payment" banner; full-screen "Redirecting to Paystack..." overlay during purchase.

## III.7 Player Onboarding (Invite Acceptance) — `/player/onboarding?token=...`

Files: `page.tsx` (reads `token`) → `OnboardingClient.tsx`.

**Data:** `useInviteValidation(token,'player')` → `status`: loading/invalid/expired/used/valid, plus `invite.{email,teamName}`.

**States:** `loading` → `InviteLoadingScreen`; invalid/expired/used → `InviteErrorScreen`; `valid` → shows invited-as card + `InviteForm` (`components/player/InviteForm.tsx` — internal submit/validation **not traced in this pass**, flagged for separate coverage if needed).

**Outcomes:** `InviteForm`'s `onSuccess` → `handleSuccess()`: `isDone=true`, clears `localStorage['gaffer-pending-invite-url']`, `setTimeout(3000ms)` → `router.replace('/app/dashboard')`. A separate mount effect writes the current URL into that same localStorage key (iOS PWA deep-link recovery, not a user click).

---

# Part IV — League Section (Player-Facing Tournament View)

### Directory map (confirmed via Glob — supersedes any assumption about the pre-restructure single scrolling page)
```
app/app/league/page.tsx                     → League discovery/list (entry point, outside the tab shell)
app/app/league/[leagueId]/layout.tsx         → Tab shell (header + tab strip)
app/app/league/[leagueId]/page.tsx           → Overview tab
app/app/league/[leagueId]/matches/page.tsx   → Matches tab
app/app/league/[leagueId]/standings/page.tsx → Standings tab
app/app/league/[leagueId]/knockout/page.tsx  → Knockout tab (conditional)
app/app/league/[leagueId]/stats/page.tsx     → Stats tab
```
Five files under `components/league/` (`LeagueHeader.tsx`, `LiveMatchCard.tsx`, `MatchInfo.tsx`, `TeamOfTheWeekSection.tsx`, `TopAssiterButton.tsx`) are unimported anywhere and render nothing reachable — see Part VII.

## IV.0 League Discovery — `/app/league`

**Data:** `listJoinedCompetitions()`; `listAllPublicCompetitions()` (shown under "All Leagues" when no joined/filtered results and no active search); `searchCompetitions(query)` (only once `searchQuery.trim().length >= 2`).

**Interactive elements & outcomes:**
- Search input — filters joined list client-side; also drives the server-side "Discover Leagues" search once ≥2 chars.
- "JOIN LEAGUE" → opens Join modal.
- Joined-league row → `/app/league/{id}` (Overview tab).
- "Try Again" (on fetch error) → invalidates `['joined-competitions']`.
- `DiscoveryCompetitionCard` click → `joinCompetitionById(id)`. Success → invalidates `['joined-competitions']`, `router.push('/app/league/{id}')`. Error → status-specific toast (409 already joined, 404 not found, 403 no permission, else generic).
- Join modal (code input, auto-uppercased) → `joinCompetition(code)`. Success → same as above. Error → **inline text under the input** (not a toast) — 404/409/400/403-specific messages.

**State:** Skeleton rows while loading; while any discovery-card join is pending, all other cards dim to 50% opacity and become unclickable, the active one shows a spinner.

## IV.1 Tab Shell Layout

**Data:** `getCompetition(leagueId)` — supplies name/banner/orgId and `stages` (only used to decide whether the Knockout tab shows).

**Interactive elements:** `LeagueTabHeader` (back, crest, name, follow bell — no followers count, no season chip, both deliberate per an in-code comment: Gaffer competitions are one-off, no season concept); tab strip (Overview/Matches/Standings/Knockout-conditional/Stats), plain `<Link>`s.

**State:**
- **Bottom nav hide/show is layout-scoped, not tab-scoped**: `hideNavbar()`/`showNavbar()` fire once on entering/leaving the whole `/app/league/[leagueId]/*` subtree (the `useEffect` lives in the layout, not per-tab). Switching tabs within the section does not re-trigger it.
- `setActiveCompetition(leagueId, orgId)` fires whenever `competition` resolves.
- Active-tab highlight: exact match for Overview, `pathname.startsWith(href)` for the rest.
- **`/knockout` is directly reachable even when not shown as a tab** — the layout only conditionally shows the tab *link*; it doesn't block the route.

## IV.2 Overview Tab

**Data:** `getCompetition`, `getStandings` (limit-8 teaser), `listCompetitionTeams`, `listFixtures` (`refetchInterval: 20s`), `getOrgFeed(orgId)`, `getMyFantasyTeam`, `listGameweeks`.

**Interactive elements & outcomes:**
- `LiveMatchSection` carousel — non-active card tap advances carousel; active-card tap → `/app/match/{id}`. Auto-advances every 5s if >1 match. Joins Socket.IO rooms per live fixture and live-patches the cached fixtures query on `goal`/`own_goal`/`penalty_scored`/`event_deleted` events.
- `LeagueSummaryCard` "Set Up Team →" (only if no fantasy team yet) → `/app/fantasy/{leagueId}`.
- `FeaturedNewsCard` → `/app/news/{id}?returnTo=<pathname>`.
- `NextMatchCard` (only if a `scheduled` fixture exists) → `/app/match/{id}`.
- "Latest" compact feed items — **not clickable** (no `onClick`).
- `TableStandings` (limit 8) "See All"/"+N more" → `/app/league/{leagueId}/standings`.

**State:** Combined loading skeleton; every section is conditionally rendered based on data presence (live match, news, next match, latest feed all independently hide if empty); `TableStandings` falls back to zero-stat rows if no matches played yet, or a "No Rankings Yet" card if no teams at all.

## IV.3 Matches Tab

**Data:** `listFixtures` (`refetchInterval: 20s`), `listCompetitionTeams` (team filter chips). Thin wrapper around shared `GroupedFixturesView`.

**Interactive elements & outcomes:** 4 filter pills (By round/date/group/team, client-side only); team chips (team mode); fixture row (`CompactFixtureRow`) → `/app/match/{id}`. **The row's bell/mute icon has no `onClick` at all — purely decorative, clicking it just triggers the row's own click.**

**State:** Active pill highlighted; loading spinner; distinct empty states per mode; "By round" groups Round → Group → fixtures, group titles taken verbatim from admin-set `groupName` (never double-prefixed with "Group").

## IV.4 Standings Tab

**Purpose:** Bespoke table (does **not** reuse the Overview's `TableStandings` component) with a per-team follow toggle.

**Data:** `getStandings`; `listCompetitionTeams` (group assignment **always** comes from `CompetitionTeam.groupName`, per an explicit in-code comment — `Standing` itself carries no group/stage field); `getPreferences()` → `preferences.followedTeams`.

**Interactive elements & outcomes:** Per-team bell button → `followTeamMutation` (follow/unfollow via `notifications.service.ts`). `onMutate` disables/spins just that button; success invalidates `['notification-preferences']` and toasts "Following/Unfollowed team..."; error toasts `getErrorMessage`.

**State:** Empty state if zero groups at all; "No matches played yet" caption under the first group only if teams exist but no standings yet; teams sorted by points descending within alphabetically-sorted groups.

## IV.5 Knockout Tab (conditional)

**Purpose:** Renders the reused **`components/admin/TournamentBracket.tsx`** verbatim (same component as the admin side) — confirmed via import, the player page just wraps it, passing only `competitionId`.

**Interactive elements:** **None** — the entire bracket is read-only on both the player and admin sides (no drill-down to a match screen here, unlike Overview/Matches rows).

**Rendering (see Part V.4.4 for full detail, since it's the same component):** two-sided converging bracket tree, third-place match floated beside the Final, "~N teams remaining" pill explicitly labeled as a client-derived estimate.

## IV.6 Stats Tab

**Data:** `getTopScorers`, `getTopAssists` (both fetched unconditionally regardless of active toggle).

**Interactive elements:** Goals/Assists segmented toggle (instant, both datasets pre-fetched). **`TopPlayersList`'s "See All" button has no `onSeeAll` prop wired here either — a no-op click**, same issue as the Fantasy Stats tab (Part III.5.6).

**State:** Each list caps at 6 entries regardless of API response size; no explicit loading skeleton (list just renders empty until data arrives).

## Shared Component — `LeagueTabHeader`

**Data:** `getPreferences()` → `followedCompetitions`.
**Interactive elements & outcomes:** Back chevron → **always** `/app/league` (not browser-back, so drilling in from elsewhere still lands here on exit). Follow bell → `followCompetition`/`unfollowCompetition`; success invalidates `['notification-preferences']`, toasts; error toasts.

---

# Part V — Admin (Organization) App

## V.1 Admin Shell — `app/admin/layout.tsx`

`useAuthGuard('organization')`. Bottom nav (6 items): Home (`/admin`), League (`/admin/tournaments`), Schedule (`/admin/schedule`), Organize (`/admin/organise`), Staff (`/admin/collaborators`), News (`/admin/news`). Not in the nav: `/admin/players`, `/admin/profile`, `/admin/settings`, `/admin/notifications`, `/admin/fantasy/**`, `/admin/tournaments/[id]/**`, `/admin/schedule/[id]` — reached only via in-page links.

## V.2 Admin Home — `/admin`

File: `app/admin/page.tsx` → `OrganizationHome.tsx`.

**Data:** `getGlobalFeed(1)`, `listOrgs()`, `listCompetitions(orgs[0]._id)` (first 2 shown) — all fetched imperatively in a `useEffect`/`Promise.all`, **not** via React Query (no cache/invalidation on this page).

**Interactive elements & outcomes:** Menu icon → `OrganizationSidebar`. Bell → `/admin/notifications`. User icon → `/admin/profile`. News card empty-state "Add News" → `/admin/news`. Empty-org "Create Organization" → `/auth/signup/organization`. Tournament card → `/admin/tournaments/{id}`. Empty-tournaments "Create Tournament" → `/admin/tournaments` (list page, **not** the create modal directly).

### Organization Sidebar (drawer, from every admin page's Menu icon)
"Personal Account"/"Organization Account" switch buttons → `handleRoleSwitch`. Switching to personal, if no personal profile exists, opens `AccountUpgradeModal` instead of switching directly; otherwise sets role, toasts, fire-and-forgets `updateProfile({lastRole})`, navigates to `/app/dashboard`. Switching to organization with no org at all → `/onboarding/organization` (no modal, deliberately, to avoid a z-index conflict per comment). "Delete Organisation" → `ConfirmDialog` → `deleteOrg(id)`; success toasts, `logout()`, → `/auth/login`.

## V.3 Tournaments List — `/admin/tournaments`

**Data:** `listOrgs()`, `listCompetitions(orgId)` sorted by status priority (live→draft→published→completed→archived), client-filtered by search.

**Interactive elements & outcomes:** Row → `/admin/tournaments/{id}`. Empty-state CTA / floating "+" FAB → opens `CreateTournamentModal`, or → `/auth/signup/organization` if no org yet.

### Create Tournament Modal (3-step wizard)
**Step 0 (Details):** banner picker, name, sport/gender selects, start/end date (End < Start disables Next with inline warning).
**Step 1 (Format):** 7 format cards (Round Robin/Groups/Knockout/Group+Knockout/League+Knockout/League+Playoff/Custom); Standard vs Custom scoring toggle.
**Step 2 (Setup):** added-format cards, each opens a config sub-screen: Knockout → starting round; Groups → teams-per-group; **League's number-of-teams input and rounds buttons are rendered but not wired to any handler — cosmetic only**; Custom → structure toggle + bonus-point inputs, and its own "Create Tournament" button skips the confirmation modal entirely.
**Outcome:** Confirm → `handleFinalConfirm()` builds a `stages[]` payload → `createMutation` (uploads banner via `uploadOrgAsset` first if picked, then `createCompetition(orgId, payload)`). Success → invalidates `['competitions', orgId]`, toasts "Tournament created successfully!", closes modal.

## V.4 Tournament Detail — `/admin/tournaments/[id]` (5 tabs)

**Header:** back, delete (trash → `ConfirmDialog` → `deleteCompetition` → invalidates `['competitions']`, toasts, → `/admin/tournaments`). Tab bar: Overview/Schedule/Standings/**Bracket** (shown only if any round is `stageType:'knockout'` or `competition.format` mentions knockout)/Fantasy.

Shared mutations: `publishMutation` (→ invalidates `['competition',id]`, toasts, → `/admin/tournaments/{id}/success`), `enrollMutation` (`registerTeams`).

### V.4.1 Overview Tab
- **"Publish Tournament"** (draft only) — uses the browser's **native `confirm()`**, not `ConfirmDialog`.
- **"Edit Tourney"** → `EditTournamentModal` (name/sport(Football/Basketball only)/gender/dates/format-enum/flat scoring rules — **no UI here for reconfiguring group counts or knockout starting rounds post-creation**).
- **"Recalculate"** — native `confirm()`, then a raw `api.post('/tournaments/{id}/rebuild', {})` (not a `useMutation`); success invalidates `['standings', id]`.
- Copy buttons (join link / invite code) → clipboard + toast; missing/ungenerated code → info toast instead.
- "Enroll Existing Team" → inline modal, `<select>` of available org teams not yet enrolled → `enrollMutation`.
- Per-team roster row copy → builds `{origin}/{compSlug}/{groupSlug?}/{teamHandle}` recruitment link, copies + toasts.

### V.4.2 Schedule Tab
Uses shared `GroupedFixturesView` **without** the admin row override (plain `CompactFixtureRow` — no Go Live/delete here, unlike the global Schedule page). Row click → `setActiveFixtureForEvent(f)`, opening **`RecordEventModal`** (not a navigation to `/admin/schedule/[id]`):
- Team selector (Home/Away), 7 event types (goal/yellow/red/substitution/penalty_scored/start/fulltime), minute, player select (hidden for start/halftime/fulltime), commentary textarea.
- `eventMutation` → `createMatchEvent(fixtureId, payload)`; success invalidates **broad, non-parameterized** `['fixtures']`, `['competition']`, `['standings']` (app-wide, not scoped to this competition), toasts, closes.

### V.4.3 Standings Tab
Entirely read-only. Grouping is derived client-side from `CompetitionTeam.groupName` (`Standing` has no group field — explicit in-code comment). No recalculate button here (that lives on Overview).

### V.4.4 Bracket Tab (recently reworked — current behavior)
File: `components/admin/TournamentBracket.tsx` (also reused verbatim on the player-facing Knockout tab, Part IV.5).
- **Two-sided, converging bracket tree**: each pre-final knockout round's fixtures are split in half — first half narrows down toward the Final ("top" stack), second half mirrors it narrowing up from below ("bottom" stack). Assumes fixture array order reflects bracket seeding (adjacent pairs feed the same next-round slot) — an explicit code comment flags this as an assumption, not a guaranteed backend contract.
- A round matching `/3rd|third[\s-]?place|bronze/i` is floated beside the Final rather than in the main progression.
- Connector shapes are derived generically from adjacent-row match counts: straight line (equal counts), join (2×→1), split (1×→2, mirror of join). **Mismatched counts render no connector at all** rather than guessing.
- "~N teams remaining" badge is explicitly labeled (tooltip + code comment) as a client-derived estimate from completed-fixture scores, not authoritative — see Backend Contract §1.
- Cards show crest/initials, score if completed else kickoff date, a lock icon once kickoff time has passed.
- **Entirely read-only** — zero click handlers anywhere in the file. No team-advance action, no score entry from here; that happens via `RecordEventModal` or the live match console.

### V.4.5 Fantasy Tab
File: `components/admin/FantasyAdminPanel.tsx`.
- **"Initialize Fantasy"** (empty state) → `enableFantasy(id, 100)` — **hardcoded 100M budget, no input for a custom value**.
- **"Sync"** → `syncTournamentPlayers(id)`; success invalidates `['team-pricing',id]`, toasts enrollment count.
- **"Finalize All Pricing"** (enabled only once every team is `pricingFinalized`) → `finalizeAllPricing(id)`; **invalidates `['fantasy-season',id]` but NOT `['team-pricing',id]`** — per-team "FINAL" badges may not refresh without a manual reload.
- Team row → `/admin/fantasy/{id}/pricing/{teamId}`.

## V.5 Fantasy Team Pricing — `/admin/fantasy/[competitionId]/pricing/[teamId]`

**Data:** `getPlayerPricing(competitionId, teamId)`.
**Interactive elements & outcomes:** "Quick Set All Players" (4 tier buttons) → loops every player, calling `setPlayerPrice` **sequentially** (not `Promise.all`); partial failures toast per-player but the loop continues. Per-player: 4 tier buttons → `updatePriceMutation`; price text → fine-tune modal (numeric, clamped 3.5–14.0, tier re-derived). Footer "Set Prices"/"Confirm Pricing" → `finalizeTeamPricing`; success invalidates pricing + `['team-pricing',competitionId]`, toasts, `router.back()`.

## V.6 Tournament Publish Success — `/admin/tournaments/[id]/success`

Reached only after `publishMutation` succeeds. Copy buttons for join link/code; "Back to Dashboard" → `/admin/tournaments/{id}`; "View All Tournaments" → `/admin/tournaments`. Hides bottom navbar while shown.

## V.7 Organise — Teams & Groups — `/admin/organise`

Single-route state machine (`view: list|create|details|share|select_team`), not separate URLs.

**Data:** `listOrgs`, `listTeams(orgId)`, `getTeam`/`getTeamPhotos`/`listPlayers` (selected team), `listGroups(orgId)`, `listCompetitions(orgId)`.

### V.7.1 List — Teams tab
Team row → details view. If a tournament is selected (state persists across the Teams/Groups tabs), each row shows "Add to Tournament"/"Remove" pills → `registerTeams`/`removeCompetitionTeam`, invalidating `['competition-teams',id]`/`['teams',orgId]` respectively. "+" FAB → create view.

### V.7.2 List — Groups tab ("Sync Groups to Tournament")
- **"Applies to tournament" select** — needed because group membership lives in the org-level `Group` model while Standings/Matches only ever read `CompetitionTeam.groupName` (explicit in-code comment).
- **"Sync Groups to Tournament"** (shown once a tournament is picked and groups exist) → flattens every group's current teams into `{teamId, groupName}` pairs, calls `assignTeamGroups(competitionId, assignments)`; success invalidates `['competition-teams',id]`, toasts. No-ops silently if there's nothing to sync.
- Group card → details view. "Add Teams" → select-team view.

### V.7.3 Create Sheet (Team or Group)
**Team mode:** photo (client-validated type/2MB), name, optional tournament select (auto-registers on create), `JerseyEditor`, max-players select, live "{enrolled}/{limit}" pill (disables picker at cap). **Group mode:** color swatch, name, optional tournament select (auto-assigns selected teams' `groupName` on create), unassigned-teams checklist.
**Outcomes:** Team → `createTeam(orgId,data)` (+ `registerTeams` if a tournament was picked). Group → `createGroup(orgId,data)` (+ `assignTeamGroups` if a tournament was picked). **`selectedCompetitionId` is deliberately not reset after create** — it doubles as the Groups-tab sync context.

### V.7.4 Details View (Team)
"Copy Link" → recruitment link + preview modal. "Edit" → name-only modal → `updateTeam`. "Register" → **registers to `competitions[0]` unconditionally, no picker** (code comment notes the team-service register endpoint 404s on the backend, hence routing through `registerTeams` instead). "Delete" → `ConfirmDialog` → `deleteTeam`. Team Photos: hover-delete (`ConfirmDialog`) → `deleteTeamPhoto`; upload tile → `uploadTeamPhoto`. "Recruit" → copies `{origin}/recruit/{handle}`. "Invite" → `InvitePlayerModal` (not traced in this pass). "Manual Add" → Add Player modal.
Player row click → Edit Player modal; checkmark toggle → `updatePlayer({squadStatus})` directly, bypassing the modal.

**Add New Player Modal:** First/Last Name, Role (player/captain/coach), Position select (**two options both bound to `value="DEF"`** — "Center-Back" and "Full-Back" are visually distinct but functionally identical to the backend), Jersey#, photo. "Register Player" → squad-cap check (toast "Team is full!" if exceeded) → `addPlayer(...)` (+ best-effort photo upload, silently swallowed on failure).

**Edit Player Modal:** photo (uploads immediately on pick); Name/Position/Jersey/Nationality (saved only via "Save Changes"); **Role and Status selects fire their own mutations immediately on change, independent of "Save Changes"** — closing the modal without saving loses name/position edits but keeps any role/status change already made.

### V.7.5 Details View (Group)
Delete (trash) → `ConfirmDialog` → `deleteGroup`. Team list here is read-only — removing a team from a group only happens via re-running "Add Teams".

### V.7.6 Select Team View (Add Teams to Group)
Checklist + "Add N Team(s)" → `updateGroup({teams:[...existing,...new]})`; **additionally**, if a tournament is selected, separately calls `assignTeamGroups(...)` for the newly-added teams (own independent error handling/toast) to keep `CompetitionTeam.groupName` in sync going forward.

### V.7.7 Share View
Wired via `onShare={() => setView('list')}` in the current orchestrator — **no observed trigger actually opens `view==='share'`; likely dead/unreachable UI.** See Part VII.

## V.8 Global Schedule — `/admin/schedule`

**Data:** `listOrgs`, `listCompetitions` (sorted live>published>draft>completed, picks a default "current" tournament), `listRounds`, `listFixtures`, `listCompetitionTeams`.

**Interactive elements & outcomes:** Tournament select drives everything. Fixture list uses `GroupedFixturesView` **with** `renderRow={AdminFixtureRow}` (unlike the Tournament Detail's own Schedule tab). Row click (not the toggle/delete) → `/admin/schedule/{fixtureId}`. "+" FAB → Schedule Game form:
- Date/time, tournament select (resets round/teams on change), Round/Stage select (label adapts to format; if a chosen "round" is a suggestion string rather than a real ObjectId — checked via a 24-hex regex — `createRound(...)` materializes it first), Home/Away team selects (Away excludes Home).
- "Schedule Game" → `createFixture(...)` with `venue: 'Main Stadium'` **hardcoded, not user-editable**. Success → invalidates `['fixtures',id]`, toasts, closes form.

### AdminFixtureRow (used only here)
Go Live toggle (hidden once completed) → `startMatch`/`cancelLive`; invalidates broad `['fixtures']`; on error reverts local toggle state and toasts. Delete → blocks immediately with a toast if the fixture is live (no dialog shown in that case); otherwise an inline confirm → `deleteFixture`; invalidates `['fixtures']`, toasts.

## V.9 Fixture Detail / Live Match Console — `/admin/schedule/[id]`

File: `components/admin/AdminLiveMatchDetails.tsx` (1479 lines) — reached by clicking a fixture row on the global Schedule page.

**Data:** `getFixture`, `getTeam`×2, `listPlayers`×2, `listLineups` (hydrates local slot state with a 3-tier fallback for shape variations), `listEvents` (polled every 10s while live).

**Go Live section:** toggle validates client-side that both lineups have ≥1 assigned slot **and** were actually saved server-side before allowing `startMatch`; specific error messages surface via the mutation's toast if not.

**Line-up tab:** formation selector (4-4-2/4-3-3/3-5-2, local only until saved); pitch slot tap — empty → player picker; occupied → context menu (Replace/Unassign). **Picking a player auto-saves immediately via `submitLineup` on every slot assignment** — the big "Squad Saved" button at the bottom is a redundant "save everything" action on top of that per-slot auto-save.

**Commentary tab:** FAB opens a step flow (menu→minute→team→scorer/assist→custom). FULLTIME skips the step flow, opens its own "End Match?" confirm modal. HALFTIME/START record immediately with **no team-picker step — always attributed to the home team**. GOAL scorer step has an "OWN GOAL" button (no player attached); SUBSTITUTION/GOAL proceed to an assist/second-player step (assist has a "Skip" option). CUSTOM → free-text → "Publish to Feed".
Each event → `recordEvent(id,payload)`; success invalidates `['events',id]`, `['fixture',id]`, broad `['fixtures']`, toasts, resets wizard.
Per-event **"Undo"** (organization role only) → `ConfirmDialog` → `deleteMatchEvent`, with **optimistic removal** from cache and rollback on error.

## V.10 Collaborators (Staff) — `/admin/collaborators`

**Data:** `listMembers(orgId)`, `listInvites(orgId)`.
**Interactive elements & outcomes:** Per-member role dropdown → `updateMemberRole`. Per-member remove → **native `confirm()`** (inconsistent with the rest of the app's `ConfirmDialog` usage) → `removeMember`. Per-invite Resend → `resendInvite` (shows a 2s checkmark). Per-invite **Revoke — no confirmation dialog at all** → `revokeInvite`. "+" FAB → Add Collaborator sheet (email, 4-role picker) → `sendInvite`; shows a dismissible "Invite sent!" banner.

## V.11 News — `/admin/news`

**Data:** `listOrgs`, `getOrgFeed(orgId)`.
**Interactive elements & outcomes:** Composer (text + image, local preview) → "Post" → uploads image via `uploadOrgAsset` if present, then `publishNews(...)`; invalidates `['org-feed',orgId]`, toasts. Per-post **Share2 icon has no click handler — decorative**. Per-post delete → `ConfirmDialog` → `deletePost`.

## V.12 Notifications — `/admin/notifications`

**Data:** `getInboxNotifications(1)`.
**Interactive elements & outcomes:** Back → `useGoBack('/admin')`. "Mark all read" → `markAllRead`. Row tap (unread only) → `markNotificationRead`. **"Clear all notifications" — no confirmation dialog before this irreversible action** → `clearAllNotifications`.

## V.13 Players (standalone roster page, not in bottom nav) — `/admin/players`

**Not linked from anywhere else in the admin app found in this pass — reachable only by direct URL.** A second, simpler roster surface distinct from Organise's Team Details (Part V.7.4); worth confirming with the team whether this route is still intended to be live.

**Data:** `listOrgs`, `listTeams`, `listPlayers(activeTeamId)`, `listPlayerInvites(activeTeamId)`.
**Interactive elements & outcomes:** Team chips (if >1 team); search (client filter); Link2 icon → Invite Player sheet (`createPlayerInvite`, shows the generated link inline with its own copy button); "Add" → Add Player sheet (zod-validated) → `addPlayer`; per-invite copy (with an `execCommand('copy')` iOS-Safari-PWA fallback) / revoke (`ConfirmDialog` → `revokePlayerInvite`); per-player edit (Position here is **free text**, not a dropdown — differs from the Organise version) / remove (`ConfirmDialog` → `removePlayer`).

## V.14 Profile (Owner Account) — `/admin/profile`

**Data:** `getProfile()`.
**Interactive elements & outcomes:** Edit toggle → Name/Username/Phone form. "Save" (disabled unless dirty or a new avatar) → uploads avatar first if picked (`uploadAvatar`), then a diff-only `updateProfile` payload; updates the `['profile']` cache and auth store directly. "Log Out" → `logout()` → `/auth/login`.

## V.15 Settings (Org Profile) — `/admin/settings`

**Data:** `listOrgs()`.
**Interactive elements & outcomes:** Logo picker + "Upload Logo" → `updateOrgLogo`. "Edit" → Name/Description/Email/Website/Sports(CSV) form (**handle shown but explicitly not editable**). "Save Changes" → `updateOrg`; invalidates `['orgs']`, toasts.

---

# Part VI — Consolidated Cross-Cutting QA Flags

These are behaviors confirmed directly in source that are easy to miss in manual testing, grouped by theme.

**Inconsistent confirmation patterns** (some destructive actions use `ConfirmDialog`, others don't):
- Native `confirm()` instead of `ConfirmDialog`: Tournament Overview's "Publish"/"Recalculate"; Collaborators' "Remove Member".
- **No confirmation at all** before an irreversible action: Collaborators' "Revoke Invite"; Notifications' "Clear all notifications".
- `ConfirmDialog` used consistently for: delete team/group/photo (Organise), delete tournament, delete fixture, undo commentary event, delete post (News), remove player/revoke invite (standalone Players page).

**Non-functional / decorative controls (render but do nothing):**
- Fantasy Stats tab and League Stats tab: `TopPlayersList`'s "See All" button — no `onSeeAll` prop passed, click is a no-op in both places.
- `CreateTeamScreen`'s `CreateTeamPlayerDrawer` "Transfer" button — `onTransfer` not passed during initial team creation, no-op.
- `PickTeamOnboarding`'s `BoostSelector` cards' "Play" buttons — no `onClick` at all (component itself is marked `@deprecated` in code).
- League Matches/Fixtures tab's fixture-row bell/mute icon — no `onClick`, purely cosmetic.
- Live Match Console header's info icon; News post cards' Share2 icon — no handlers, decorative.
- `CreateTournamentModal`'s League-format config screen (number-of-teams input, rounds buttons) — not wired to any state.
- `OrganiseShare` view — appears to have no live trigger that opens it (`onShare` just resets to list view).

**Silent/masked failures:**
- Google OAuth failure on both Login and Signup pages: `onError: () => {}` — no user-facing feedback for a cancelled/failed popup.
- `TeamNamingScreen`'s `createTeamOnApi` failure is only `console.error`'d — user stays on the screen with no visible error (unless the specific `TEAM_EXISTS` code, which proceeds anyway).
- Personal signup: if `registerUser` succeeds but the subsequent `updateProfile` throws, the whole flow's catch swallows it silently and no redirect occurs.
- `/auth/forgot-password` and `/auth/reset-password` both replace the server's actual error with a **hardcoded generic string**, unlike nearly every other flow which surfaces `getErrorMessage()`.

**Data/query-invalidation gaps:**
- `FantasyAdminPanel`'s "Finalize All Pricing" invalidates `['fantasy-season', id]` but not `['team-pricing', id]` — per-team "FINAL" badges may not refresh without a manual reload.
- `RecordEventModal` / `AdminFixtureRow`'s Go Live toggle invalidate **broad, unparameterized** query keys (`['fixtures']`, `['competition']`, `['standings']`) rather than scoping to the current competition — intentional per the code (keeps every open view in sync) but causes wider refetching than a naive read might expect.

**Inconsistent save timing (easy to misjudge live behavior):**
- Organise's Edit Player modal: Role/Status dropdowns save **immediately on change**; Name/Position/Jersey/Nationality only save when "Save Changes" is clicked. Closing without saving loses the latter but keeps the former.
- Live Match Console's Line-up tab: every pitch-slot assignment **auto-saves immediately** via `submitLineup`; the big "Squad Saved" button at the bottom is a redundant full re-save on top of that.

**Data-model quirks:**
- Organise's "Add New Player" modal Position select has two options (`Center-Back`, `Full-Back`) both bound to the identical value `DEF` — visually distinct, backend-identical.
- Standings pages (both League tab and Tournament Detail tab) derive group membership entirely from `CompetitionTeam.groupName`, never from the `Standing` record itself (which carries no group/stage field at all) — this is why the Organise → Groups "Sync Groups to Tournament" feature exists as a bridge between the org-level `Group` model and the competition-scoped field Standings actually reads.
- `TournamentBracket`'s two-sided split assumes fixture array order reflects bracket seeding order; mismatched round/pair counts (partial data) render with no connector rather than a guessed one.
- `getStandings()` (`lib/services/standings.service.ts`) retains a hardcoded mock short-circuit for `competitionId === 'pl-mock-123'`, marked `TODO: REMOVE MOCK DATA BEFORE PROD` — not reachable through normal navigation with real IDs.
- Organise's "Register" button (Team Details) always registers to `competitions[0]` unconditionally, with no picker — a deliberate workaround since the team-service's own register endpoint 404s on the backend per an in-code comment.

**Navigation quirks:**
- No visible Login/Sign Up link anywhere on the public landing page (`/`) — every CTA funnels through the PWA-install handler, relying on the middleware to redirect unauthenticated `/app/dashboard` hits to `/auth/login`.
- `LeagueTabHeader`'s back button always goes to `/app/league` (not browser-back), regardless of where the user drilled in from.
- `/onboarding/organization` lives under the nominally-public `/onboarding` prefix but self-guards to require auth via a client-side redirect — the only page under that prefix that behaves this way; a brief flash of protected content is possible on a direct unauthenticated hit since middleware won't block it.
- Both login/signup pages' "Sign Up"/"Next" links route through `/onboarding/role-select` rather than directly to `/auth/signup` or `/auth/signup/organization`, even though those URLs work if hit directly.
- "Remember Me" checkbox on `/auth/login` is decorative — not registered with the form, not sent in the login payload.

---

# Part VII — Dead / Unreachable Code Inventory

Confirmed via grep (zero importers anywhere in the app) or explicit `// DEAD CODE` markers:

- `components/league/LeagueHeader.tsx`
- `components/league/LiveMatchCard.tsx`
- `components/league/MatchInfo.tsx`
- `components/league/TeamOfTheWeekSection.tsx`
- `components/league/TopAssiterButton.tsx`
- `components/admin/PlayerCard.tsx` — file body is only the comment `// DEAD CODE - TO BE DELETED`.
- `components/admin/TournamentCard.tsx` — same.
- `app/admin/organise` "Share" view (`OrganiseShare.tsx`) — wired but with no observed live trigger; low-confidence dead (worth a manual confirm rather than deleting outright).
- `app/admin/players` route — not linked from the bottom nav or any other admin page found in this pass; reachable only by direct URL. Not code-dead (fully functional), but navigationally orphaned — flagged for a product decision on whether it should be removed, linked, or is intentionally a hidden/legacy tool.
- `app/test-ui` — an empty directory with no `page.tsx`; not a live route despite existing in the tree.

Fantasy files confirmed **already removed** from disk (mentioned only for completeness, since this document's scope was "as it exists now," and earlier work in this project's history restructured the Fantasy section): `app/app/fantasy/{chips,points,substitution,team,transfers}/page.tsx`, `components/fantasy/{FantasyDashboard,FantasyHeroWave,FantasyTeamScreen,PointsScreen,SubstitutionScreen}.tsx` — their functionality now lives in the `[competitionId]` tab shell and the drawers/panels documented in Part III.5.
