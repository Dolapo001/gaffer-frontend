# Gaffer — Full-Stack System Map

**Method:** Direct, read-only audit of both repositories — no assumptions, no git history consulted, nothing invented. Backend: `The-Gaffer--backend` (`src/modules/<name>/{routes,controller,service,validation,model}.js`, one module per domain). Frontend: `gaffer-frontend` (`app/`, `components/`, `lib/services/*.ts`). Every claim below is traceable to an actual file; ambiguities are flagged, not guessed at.

**Companion document:** [`APPLICATION_FLOW_DOCUMENT.md`](./APPLICATION_FLOW_DOCUMENT.md) has the complete page-by-page frontend breakdown (every route, every click, every UI state) for all three roles. This document adds the backend side and — critically — connects the two, surfacing every place they disagree.

---

## Table of Contents

- [Part 1 — Backend Architecture](#part-1--backend-architecture)
  1. Auth Middleware & Session Model
  2. Identity & Organization (`auth`, `users`, `orgs`, `members`, `invite`)
  3. Competition Structure (`competitions`, `teams`, `groups`, `standings`, `recruitment`)
  4. Match Operations (`fixtures`, `matches`, `stats`, `feed`, `notification`)
  5. Fantasy & Money (`fantasy`, `chips`, `payments`)
- [Part 2 — Frontend Flow Index](#part-2--frontend-flow-index)
- [Part 3 — Connected Cross-Reference (Click → Endpoint → Behavior)](#part-3--connected-cross-reference)
- [Part 4 — Frontend/Backend Contract Mismatches (Full List)](#part-4--frontendbackend-contract-mismatches-full-list)
- [Part 5 — Business Rules That Actually Exist (vs. Assumed)](#part-5--business-rules-that-actually-exist-vs-assumed)

---

# Part 1 — Backend Architecture

## 1.1 Auth Middleware & Session Model

`requireAuth` (`src/common/middleware/auth.js`): reads `Authorization: Bearer <token>` → 401 `UNAUTHORIZED` if missing. `jwt.verify` against `config.jwt.accessSecret` → 401 `TOKEN_EXPIRED` on expiry, 401 `UNAUTHORIZED` on any other failure. Re-fetches the user and requires `status === "active"` → 403 `ACCOUNT_INACTIVE` (so a still-valid JWT for a suspended/deleted user is rejected here). Sets `req.user = { userId, email? }`.

`optionalAuth` — same decode, never blocks; `req.user = null` on any failure, always calls `next()`. Used only on `/invite/*`.

**RBAC** (`src/common/middleware/rbac.js`):
- `requireOwner(orgIdParam)` — exact match to `Org.ownerId` only.
- `requireMemberOrOwner(orgIdParam, minRole?)` — owner always passes; else requires an **active** `OrgMember` row and, if `minRole` given, `ROLE_RANK[role] ≥ ROLE_RANK[minRole]` where rank is `viewer(0) < staff(1) < manager(2) < admin(3)`.

**Session** (JWT refresh): raw refresh token never stored — only its SHA-256 hash, in a `Session` doc with a TTL index (Mongo auto-deletes on expiry). Refresh is single-use: matched session is revoked immediately, before the new pair is issued (rotation). Password reset revokes **all** sessions for the user (logs out every device).

---

## 1.2 Identity & Organization

### `auth` module — mounted `/auth`, rate-limited (1000 req/15min/IP, dev value)

| Method + Path | Auth | Core behavior |
|---|---|---|
| `POST /auth/register` | public | 409 `EMAIL_TAKEN` if exists; bcrypt(12); retroactively links pre-existing `Player` docs by email; issues tokens |
| `POST /auth/login` | public | Generic `401 INVALID_CREDENTIALS` for both wrong-email and wrong-password (no user enumeration); **always forces `lastRole: "personal"` in the response regardless of stored value** — "always land on personal context after a fresh login" |
| `POST /auth/refresh` | cookie (`rt`) | Rotates refresh token; clears `rt` cookie on any 401 |
| `POST /auth/logout` | **no auth required by design** | Works even with an expired access token — only needs the `rt` cookie |
| `POST /auth/forgot-password` | public | Always returns the same generic success message whether or not the account exists (anti-enumeration); token hash + 60min expiry |
| `POST /auth/reset-password` | public (token) | Single generic `400 INVALID_OR_EXPIRED_TOKEN`; success revokes **all** sessions |
| `POST /auth/google` | public | Same "always `lastRole: personal`" behavior as login; auto-links Google to an existing email-matched account |

**`User` model**: `status` enum `pending|active|suspended|deleted` (default `pending`) — note `emailVerified`/`phoneVerified` exist but are **not gated anywhere** (no email-verification requirement to log in). `lastRole` enum `personal|organization`. `currentOrgId`.

### `users` module — mounted `/users`

| Method + Path | Notes |
|---|---|
| `GET /users` | 404 `USER_NOT_FOUND` |
| `PUT /users` | **No Zod validation actually wired** — `updateMeSchema` exists but is unused; enforcement is a plain field **allowlist** (`fullName, username, avatarUrl, phone, isPersonalActive, isOrgActive, lastRole`) in the service. Switching to `personal`/`isOrgActive:false` throws 403 `PERSONAL_ACCOUNT_NOT_AVAILABLE` if the user has no personal profile yet. Response is the raw user doc, **not** wrapped in `{user}` |
| `DELETE /users` | Soft delete (`status:"deleted"`) + revokes all sessions |
| `PATCH /users/avatar` | multipart; 400 `MISSING_FILE` if absent; deletes old Cloudinary asset first |

### `orgs` module — mounted `/orgs` (also owns membership & invite sub-resources)

| Method + Path | Auth | Core behavior |
|---|---|---|
| `POST /orgs` | auth | 409 `ORG_NAME_TAKEN` / `ORG_HANDLE_TAKEN`; also flips the creating user to `isOrgActive:true, lastRole:"organization", currentOrgId` |
| `GET /orgs` | auth | Owned orgs ∪ orgs with an active membership — explicit no-cross-tenant-leakage |
| `PUT /orgs/:orgId` | owner | `.strict()` schema + a `PROTECTED_ORG_FIELDS` strip (`ownerId, lifecycleStatus, verificationStatus`) before validation; `handle` is **immutable** post-creation |
| `DELETE /orgs/:orgId` | owner | Soft delete only — **no cascading delete** of members/teams/competitions |
| `POST /orgs/:orgId/members` | owner | Upsert-with-reactivation: adding a previously-removed member reactivates them rather than erroring |
| `DELETE /orgs/:orgId/members/:memberId` | owner | `400 CANNOT_REMOVE_OWNER`; soft-remove only |
| `PATCH /orgs/:orgId/members/:memberId` | admin+ | Note: `:memberId` in the URL is actually the **user's** `_id`, not the `OrgMember` doc's `_id` |
| `POST /orgs/:orgId/invites` | admin+ | 400 `ALREADY_MEMBER`; recycles a stale/expired invite row (rotates token) rather than creating a duplicate; raw token **never returned in the HTTP response** (email-only) |
| `POST /orgs/:orgId/invites/:inviteId/accept` | auth (any user) | 403 `INVITE_EMAIL_MISMATCH` if the invite's email doesn't match the logged-in user's; 400 `OWNER_CANNOT_BE_MEMBER`; 400 `ALREADY_USED` |

**`OrgMember` model**: unique `{orgId,userId}` and `{orgId,invitedEmail}`; TTL index purges expired **pending invites only** (`partialFilterExpression: {status:"invited"}`) — active memberships are unaffected.

### `invite` module — mounted `/invite` (generic token-based, separate from the org-scoped `/orgs/:orgId/invites/*` above)

| Method + Path | Auth | Notes |
|---|---|---|
| `POST /invite/validate` | public | `type: player\|organization`. Player: 404/400/410 for not-found/used/expired. **Response is flat** (`{valid, type, email, ...}`), not nested under an `invite` key |
| `POST /invite/accept` | `optionalAuth` | Player branch: capacity check (`TEAM_FULL`), jersey-conflict check (`JERSEY_TAKEN`), finds-or-creates `Player` by invite email. Org branch: requires `req.user` set (401 if not — `optionalAuth` alone won't force this); same email-match/owner/already-used guards as the org module. Response: `{success:true, player}` or `{success:true, invite}` |

---

## 1.3 Competition Structure

### `competitions` module

Three routers: `orgCompetitionRouter` (`/orgs/:orgId/competitions`), `competitionRouter` (`/competitions`), `publicCompetitionRouter` (`/public/competitions`).

| Method + Path | Auth | Core behavior |
|---|---|---|
| `POST /orgs/:orgId/competitions` | manager+ | `format` enum: `round_robin\|groups\|knockout\|group_knockout\|league_knockout\|league_playoff\|custom`. **Canonical spelling is `group_knockout`** (confirmed identical in model + validation) — `groups_knockout` does not exist anywhere in the backend |
| `GET /orgs/:orgId/competitions/.../fixtures\|rounds` | viewer+ | **Appears unused** — frontend calls the separate `/competitions/:id/fixtures` path instead (different router, no org-membership gate) |
| `POST /competitions/join` | auth | Code-based join; `JoinedCompetition` unique index → 409 `ALREADY_JOINED` |
| `GET /competitions/participating`, `/mine` | auth | **No frontend caller found anywhere in `lib/services/*.ts`** |
| `GET /competitions/:id` | **public** | 404 `INVALID_COMPETITION_ID` on bad ObjectId shape |
| `DELETE /competitions/:id` | admin | Cascading: deletes `CompetitionTeam` rows → `Round` rows → `Fixture` rows → the competition itself |
| `POST /competitions/:id/publish` | manager+ | **The richest validation chain in the backend** — see §1.3.1 below |
| `GET /competitions/:id/teams` | **public** | Flattens `CompetitionTeam` + populated `Team`, sorted `{groupName,seed}`, computes live `playerCount` |
| `POST /competitions/:id/teams` | manager+ | Add/register; `400 REGISTRATION_CLOSED` unless `status ∈ [draft,published]`; duplicate registration (unique index) is **silently swallowed**, not surfaced as an error |
| `PATCH /competitions/:id/teams` | manager+ | **This is `assignTeamGroups`** — the bulk group-assignment endpoint. Auto-creates missing group names inside `competition.stages[].groups`; detects duplicate `(groupName,seed)` pairs → `400 DUPLICATE_GROUP_SEED` |
| `DELETE /competitions/:id/groups/:groupName` | manager+ | Removes the name from `stages[].groups`, unassigns it from all `CompetitionTeam` rows, clears it from `Fixture` docs — **operates only on the competition's own stage data, has zero relationship to the standalone `groups` module** |
| `GET /public/competitions/:slug` | public | Matches `handle` or name-with-dashes-as-spaces; requires `status ∈ [published,live]` |

#### 1.3.1 `publishCompetition` — full validation chain (in enforced order)
1. `400 FORMAT_REQUIRED` if no format set.
2. Format → required stage types: `groups→[groups]`, `knockout→[knockout]`, `group_knockout→[groups,knockout]`, `league_knockout→[league,knockout]`, `league_playoff→[league,knockout]`, `round_robin→[league]`, `custom→[]`. Missing → `400 STAGES_REQUIRED`.
3. `400 TEAMS_REQUIRED` if zero registered teams.
4. Every registered team needs ≥1 active `TeamPlayer` → `400 TEAM_PLAYERS_REQUIRED`.
5. If format is `groups`/`group_knockout`: every non-withdrawn team must have a `groupName` set → `400 GROUP_ASSIGNMENT_REQUIRED`.
6. **Only now**: `400 INVALID_STATUS_TRANSITION` if not currently `draft` — meaning a validation failure on an already-published competition still returns the *specific* upstream error, not this one.
7. Generates `joinCode` (`GAF-######`) if absent — **no uniqueness retry loop**; a rare collision throws a raw Mongo duplicate-key error, not a clean `ApiError`.

### `teams` module

| Method + Path | Auth | Core behavior |
|---|---|---|
| `POST /orgs/:orgId/teams` | manager+ | `409 TEAM_HANDLE_TAKEN` — handle uniqueness is **global across the whole platform**, not per-org |
| `GET /teams/:id` | any authenticated user | **No org-membership check at all** on this specific read |
| `DELETE /teams/:id` | admin | Cascading hard delete (TeamPlayer, PlayerInvite, CompetitionTeam rows, then the team). Response message says "archived" — **misleading; this is a hard delete** |
| `POST /teams/:id/players` | manager+ | Squad cap via `maxPlayers` (default 25) → `400 TEAM_FULL`; jersey uniqueness → `400 JERSEY_TAKEN`; finds-or-creates `Player` by email, auto-links `userId` if a matching `User` exists; **`TeamPlayer` unique key is `{teamId,playerId,competitionId}`** — a player can hold one global membership *and* separate memberships per tournament simultaneously |
| `PATCH /teams/:id/players/:playerId` | manager+ | `squadStatus` here **cannot** be set to `"removed"` — only `active\|injured\|suspended`; removal is a separate `DELETE` |
| `DELETE /teams/:id/players/:playerId` | manager+ | Soft-remove (`squadStatus:"removed", leftAt`) |
| `POST /public/teams/:handle/register` | **public** | The actual recruitment-form endpoint the frontend uses; delegates into the same `addPlayerToTeam` logic (capacity/jersey rules apply identically) |

**Frontend/backend gap found in this module**: `lib/services/team.service.ts` defines `acceptPlayerInvite`/`declinePlayerInvite` (`/teams/:id/invites/:id/accept|decline`), `getTeamPhotos`/`uploadTeamPhoto`/`deleteTeamPhoto` (`/teams/:id/photos*`), `registerTeamForCompetition` (`/teams/:id/register`), `listPublicTeams` (`/teams/public`) — **none of these routes exist in `team.routes.js`**. See Part 4.

### `groups` module — **the critical bridge concept**

`POST/GET /orgs/:orgId/groups`, `GET/PATCH/DELETE /groups/:id`. No Zod validation file exists for this module at all — routes call the service directly with raw `req.body`; only Mongoose schema-level constraints apply.

**Confirmed: the standalone `Group` model and the competition's group-stage data are two entirely separate, string-matched-only data structures:**
- `Group` (this module): `{_id, orgId, name, color, teams: [Team]}` — an org-level, competition-independent labeled container.
- `Competition.stages[].groups`: `[{name}]` — just names, no `_id`, no color, no `teams[]`, living inside the competition document.
- `CompetitionTeam.groupName`: a plain string (default `null`) — the actual per-registration group assignment, set via `PATCH /competitions/:id/teams`.
- **There is no `groupId` field anywhere linking these.** No service in either module references the other module's model. The connection is purely a matching name string, maintained independently — renaming/deleting an org-level `Group` has zero effect on `CompetitionTeam.groupName` or `stages[].groups`, and vice versa. This is exactly the disconnect the "Sync Groups to Tournament" feature in Organise was built to manually bridge (see `APPLICATION_FLOW_DOCUMENT.md` Part V.7.2).

### `standings` module — mounted `/competitions/:id/standings` (fully public, no auth)

- Source of truth for **which teams appear**: `CompetitionTeam` with `registrationStatus:"approved"` (withdrawn teams never show). Teams with no `Standing` row yet get an all-zero row.
- Sort: `points DESC → goalDifference DESC → goalsFor DESC → name ASC` (alphabetical only if zero matches played anywhere).
- Pagination is **in-memory** (`.slice()`), not a DB-level skip/limit — every registered team's row is loaded before paginating.
- Points math: `winPoints`/`drawPoints`/`lossPoints` from `Competition.rules` (default 3/1/0). **`perGoalPoints` and `cleanSheetPoints` are configurable fields on `Competition.rules` but are never applied anywhere in standings calculation** — dead configuration.
- **Confirmed: `Standing.model.js` has no group/stage field whatsoever** — no `groupName`, `group`, `stage`, or `groupId`. Any group-scoped standings view must separately fetch `CompetitionTeam` (which does carry `groupName`) and join client-side by `teamId`. This directly confirms the frontend code comments claiming this.

### `recruitment` module — mounted `/recruitment` — **confirmed unused by the frontend**

A fully separate, token-based recruitment system (`RecruitmentLink`/`RecruitmentRequest` models) distinct from the `teams` module's public registration flow. Exactly one active link per team is enforced (creating a new one revokes the prior one). Rate-limited (10/hr/IP) on submission. **Grepped the entire frontend for every route in this module — zero callers found.** `lib/services/recruitment.service.ts` is a thin shim that explicitly documents (in its own comment) that it does *not* call these routes — it only re-exports `getPublicTeamByHandle`/`registerPublicPlayer` from the `teams` module. The whole `/recruitment/*` surface (link creation, submission, approve/reject queue) is dead from the frontend's perspective today.

---

## 1.4 Match Operations

### Architectural finding: two parallel live-match systems

| | Mounted at | Score logic | Lifecycle guard | Socket.IO broadcast? |
|---|---|---|---|---|
| **Legacy** (`fixtures` module) | `POST /fixtures/:id/events` | Hard-coded `goal`/`penalty`/`own_goal` branch | requires `status ∈ [live,halftime]` | **No** |
| **Commentary** (`matches` module) | `POST /matches/:id/events` | Delegates to `eventPolicy.js` (`affectsScore` flag per type) | Per-type `ALLOWED_STATUSES`/`REQUIRES_LIVE` map | **Yes** — publishes to Redis → Socket.IO |

The frontend's own code comment confirms this split (`lib/services/fixture.service.ts` labels its `recordEvent` "legacy"). **Only the `/matches/...` path produces real-time updates to other connected clients.** Both paths write to the same `MatchEvent` collection and both feed the stats projection, so historical data stays consistent regardless of which path was used — only live broadcast differs. Per `APPLICATION_FLOW_DOCUMENT.md`, the admin's `RecordEventModal` (Tournament Detail's Schedule tab) and the live match console (`/admin/schedule/[id]`) use **different** frontend service files (`fixture.service.ts` vs `match.service.ts`) — worth confirming which one each actually calls, since only one of them broadcasts live.

### Socket.IO — confirmed real, matches frontend expectations

`src/socket.js`: JWT-authenticated on connect (`socket.handshake.auth.token`); every socket auto-joins a room named by its own user id. Client sends `socket.emit('join:match', id)` → server does `socket.join('match:' + id)` — **this exactly matches what the frontend already does** (`LiveMatchSection` in the League Overview tab). Only two events are ever emitted anywhere in the backend: `live:event` (to `match:<fixtureId>` rooms, sourced from the `matches` module's Redis publish) and `notification:new` (to the user's personal room).

**`live:event` payload**: `{eventId, fixtureId, type, minute, extraMinute, period, teamId, playerId, commentaryText, homeScore, awayScore, scoreSnapshot:{home,away}, matchStatus, flags, ts}`.

### Fixture `status` enum (authoritative, from the Mongoose model)
```
scheduled | live | halftime | completed | postponed | cancelled | suspended
```
The frontend's `Fixture.status` union type matches exactly. `MatchState.fixture.status` (a different, narrower frontend type used by `match.service.ts`) is **missing `postponed` and `cancelled`** — a latent typing gap, since `getMatchState` can legitimately return either.

`Round.status`: `scheduled|in_progress|completed`. `Lineup.status`: `pending|approved`.

### Verified absent: knockout bracket state / bulk per-round player points
Grepped `fixtures`, `matches`, `stats`, `fantasy` for "remaining", "bracket", any bulk player-points route. **There is no endpoint that returns bracket state, "teams remaining," or elimination status** — `generateKnockout` only creates a single `Round of N` with paired fixtures; there is no "advance winner to next round" logic anywhere. This confirms `TournamentBracket.tsx`'s own client-derived "~N teams remaining" estimate is correctly labeled as an estimate — there's genuinely nothing authoritative to read from. Also confirmed: no bulk-per-round player-points endpoint exists (only a single-player history endpoint under `fantasy` — see §1.5).

### `fixtures` module — key routes

| Method + Path | Auth | Core behavior |
|---|---|---|
| `POST /competitions/:id/rounds` | manager+ | Unique `{competitionId, order}` |
| `POST /competitions/:id/fixtures` | manager+ | Both teams must be registered in the competition; `_checkSchedulingConflict` — 409 `SCHEDULING_CONFLICT` if either team has a fixture within **±2 hours**; 409 `VENUE_CONFLICT` similarly for the venue |
| `GET /competitions/:id/fixtures` | **public** | — |
| `POST /competitions/:id/fixtures/generate` | manager+ | `round_robin`: classic circle algorithm, byes for odd counts. `knockout`: **requires team count to be a power of 2** → `400 INVALID_TEAM_COUNT` otherwise; random (non-cryptographic) shuffle; creates exactly one `Round of N` — no later rounds are ever auto-generated |
| `PATCH /fixtures/:id` | manager+ | 409 `FIXTURE_NOT_EDITABLE` if `status ∈ [live,completed]` |
| `DELETE /fixtures/:id` | admin | Same editability guard |
| `POST /fixtures/:id/start` | manager+ | Only from `scheduled` → `live` |
| `POST /fixtures/:id/end` | manager+ | Only from `[live,halftime]`; delegates to idempotent `finalizeMatch()` |
| `POST /fixtures/:id/cancel-live` | manager+ | Resets to `scheduled`, does **not** clear score/events |
| `POST /fixtures/:id/events` (legacy) | manager+ | 409 `FIXTURE_FINALIZED`/`FIXTURE_NOT_LIVE` guards; 3-second time-window dedup independent of `clientEventId`; `type:"fulltime"` triggers `finalizeMatch()` async |
| `POST /fixtures/:id/lineups` | staff+ (lowest bar — coaches can submit) | **Every resubmission resets `status:"pending"` and clears `approvedBy`**, even if it was previously approved |
| `POST /fixtures/:id/lineups/approve` | manager+ | Locks the lineup |

**`finalizeMatch` cascade** (idempotent — no-ops if already finalized): sets `status:completed, isFinalized:true` → fire-and-forget triggers `standingService.updateStandingsForFixture`, `tournamentStatsProjectionService.processMatchResult`, `fantasyScoringQueue.enqueueForFixture`, and a match-ended notification.

### `matches` module — the real-time commentary path

`POST /matches/:id/events` — `assertLifecycle(fixture, type)` enforces a **per-type** status map (e.g. `start` only from `scheduled`; `halftime` only from `live`; `match_resumed` only from `suspended`), not the blanket "live or halftime" check the legacy path uses. Idempotent via `clientEventId` (returns HTTP 200 with `isIdempotentReplay:true` on replay, not a new 201). **Fixture is saved before the event is inserted** — deliberate ordering, documented in the code, so a failed event insert never leaves stale fixture state (no DB transactions in local/standalone dev). Auto-generates commentary text server-side (client-supplied text is only honored for `custom` events).

`DELETE /matches/:id/events/:eventId` — recalculates the fixture's score from scratch, publishes a synthetic `{type:"event_deleted"}` live event so clients can retract it from their UI, and enqueues a full stats rebuild. **The controller's success response is only `{message}`** — the service internally returns `{success:true}` but the controller discards it; the frontend's `deleteMatchEvent()` expects `{message, score}`, which does not match.

### `stats` module — mounted `/tournaments`, reads pre-aggregated collections (not live aggregation)

All the `GET /tournaments/:id/stats/*` routes (`top-scorers`, `top-assists`, `discipline`, `teams`, `teams/attack`, `teams/discipline`) are **public** and just query/sort pre-built `TournamentPlayerStat`/`TournamentTeamStat` docs — these are incrementally updated (`$inc`) every time a qualifying event is written from *either* the fixtures or matches event path, so both stay consistent. `POST /tournaments/:id/rebuild` (admin) and `.../fixtures/:id/rebuild` replay all events from scratch and diff-reconcile the cumulative tournament totals inside a Mongo transaction. Only 4 event types ever affect stats: `goal`, `own_goal`, `yellow_card`, `red_card` (plus match-result deltas at finalization).

### `feed` module — mounted `/feed`

| Method + Path | Auth | Core behavior |
|---|---|---|
| `POST /feed/news` | manager+ (org) | `allowComments` hard-coded **false** |
| `POST /feed/posts` | manager+ (team's org) | `allowComments` hard-coded **true** |
| `POST /feed/:id/repost` | any auth user | Always resolves to the **root** item (flattens repost chains); one repost per user per root enforced via a `findOne` check — **application-level, not a unique index, so technically racy under concurrency** |
| `POST/DELETE /feed/:id/like` | auth | Unlike uses an aggregation-pipeline `$max:[0, count-1]` update so the counter can never go negative under races |
| `POST /feed/:id/comments` | auth | 403 `COMMENTS_DISABLED` whenever `allowComments` is false — i.e. always on news/repost/match_event |
| `GET /feed/org/:orgId`, `/feed/team/:teamId` | **public**, despite the frontend's own comment claiming auth is sent "so members see visibility:'org' items" | **No visibility enforcement actually exists** — `visibility:"org"` items are returned to anyone, authenticated or not. The route file's own header comment admits this is a known v1 gap |

**Frontend calls with no matching route at all**: `updatePost`, `deletePost`, `editComment`, `deleteComment` — none of these exist in `feed.routes.js`. See Part 4.

### `notification` module — mounted `/notifications`

Standard follow/unfollow (match/team/competition), preferences, push subscribe/unsubscribe, inbox CRUD. **Confirmed backend bug**: the BullMQ worker (`notification.worker.js`) that fans out match-event notifications calls `Notification.insertMany([{userId, eventId, title, body, url}, ...])`, but the `Notification` schema requires `type` (enum) and `message` (String) — **neither of which the worker's payload provides**, and there is no `eventId` field on the schema at all. Every such batched insert throws a Mongoose validation error, which the worker's catch block does **not** handle (it only suppresses duplicate-key errors) — so in-app inbox notifications for live match events are **effectively never persisted** in the current codebase. Push notifications (a separate code path using the correct fields) and other in-app notifications created via `notificationService.createNotification()` (lineup changes, news) are unaffected and work correctly.

**Fan-out priority tiers** (`notification.templates.js`): P1 always-on (`goal, own_goal, penalty_*, red_card, match_started/suspended/resumed/ended, team_invite, fantasy_rank_changed`); P2 mutable via `mutedEventTypes` (`yellow_card, substitution, half_time, lineup_change, fantasy_points_updated, team_update, news_published`); P3 silently dropped.

**Frontend call with no matching route**: `clearAllNotifications()` → `DELETE /notifications` — only `DELETE /notifications/:id` (singular) exists; this will 404.

---

## 1.5 Fantasy & Money

### `fantasy` module — mounted `/fantasy/:competitionId/*`, all routes require auth; admin routes additionally require org owner/admin/manager

#### Admin: setup & pricing
- `POST /enable` — 409 `FANTASY_ALREADY_ENABLED` if a season exists; `squadBudget` 50–200 (default 100).
- `POST /players/sync` — maps real `Player.position` free text (Goalkeeper/Defender/etc.) to the fantasy enum, defaulting unmatched values to `MID`.
- `POST /gameweeks` — one `FantasyGameweek` per competition `Round`, idempotent; 422 `NO_ROUNDS` if the competition has none yet.
- `PUT .../pricing/teams/:id/players/:id` — price must fall inside its **tier's own range** (marquee £9.5–14.0, elite £6.5–9.0, standard £4.5–6.0, budget £3.5–4.5) and never below an absolute floor of £3.5.
- `POST .../pricing/teams/:id/validate` — **Top-15 rule**: average price of the 15 most expensive players on the team must fall between **£4.5 and £8.5** (the code's own header comment describes an older "≤115m budget" rule that is not what's actually enforced — the real, live constants are 4.5–8.5 average).
- `POST .../pricing/finalize` — 422 `UNPRICED_PLAYERS` if anything is still unpriced.

#### User: team management (deadline & validation logic — the heart of the fantasy system)

**`PUT /fantasy/:id/team/squad`** (`setSquad`):
1. **Deadline lock**: locks **4 hours before** the gameweek's actual kickoff/deadline timestamp (not at kickoff itself) → 409 `GAMEWEEK_LOCKED`.
2. **Always enforced, even for a partial/incomplete squad**: max 3 players from the same real team (hard-coded `MAX_PER_REAL_TEAM = 3`); and a **hard budget cap** — 422 `BUDGET_EXCEEDED` if the sum of selected prices exceeds `season.squadBudget`. Both apply regardless of squad completeness.
3. **Only when the combined squad reaches exactly 15 players**, the strict full-squad checks run: exact composition (2 GK / 5 DEF / 5 MID / 3 FWD), starting-XI shape (GK exactly 1, DEF 3–5, MID 3–5, FWD 1–3), captain/vice-captain both inside the XI and distinct from each other, and bench slot index 3 (the 4th bench slot) must be a GK.
4. **There is no kickoff-based per-player lock** — only the one blanket gameweek-deadline lock. A frontend feature that assumes individual players lock at their own fixture's kickoff time (rather than the whole gameweek locking 4h before its deadline) would be assuming something the backend doesn't do.

**`POST /fantasy/:id/team/transfers`** (`makeTransfer`) — entirely server-computed cost, no client input into pricing:
- Same-position requirement: 422 `POSITION_MISMATCH`.
- Before the gameweek deadline: **always free**, unlimited (`transferType:"pre_deadline_edit"`).
- After the deadline: first transfer of a new gameweek resets the free-transfer counter (max 1 free/gameweek — confirmed by the model's own comment "MVP max = 1"); subsequent transfers in the same gameweek cost **-4 points** each.
- **There is no coin-cost transfer path anywhere in the backend.** Confirmed by grepping the entire fantasy service for any Wallet reference in the transfer flow — none exists.
- **Budget is not re-validated after a transfer** — only after the initial `setSquad` full-squad save. A transfer swapping in a pricier same-position player can silently push the squad over `squadBudget` with zero rejection.

**`POST /fantasy/:id/team/chips`** (legacy path, separate from the real economy below) — **only `BENCH_BOOST` is actually reachable**; `ENABLED_CHIPS` explicitly excludes the other three, even though the Zod schema accepts all four chip type strings (they'll be rejected with 422 `CHIP_NOT_AVAILABLE` at runtime, not at validation time).

#### Leaderboards — confirmed no per-round player leaderboard exists
Exactly two leaderboard routes: `/leaderboard` (season totals, Redis-cached 120s) and `/leaderboard/gameweek/:id` (single-gameweek `netPoints`) — **both rank fantasy managers, not football players**. The only per-round *player* data source is a single-player history endpoint (`GET .../players/:id/history`), which would require one request per enrolled player to build any "Team of the Round" view. This matches the frontend's own `BACKEND_CONTRACT.md §9` claim exactly.

### `chips` module — mounted `/chips` — **the real, multi-chip economy layer**

Config (`src/config/economy.js`):

| chipType | coins | max/season | cooldown (gameweeks) |
|---|---|---|---|
| `bench_boost` | 0 (free) | 2 | 3 |
| `free_hit` | 400 | 2 | 2 |
| `triple_captain` | 600 | 2 | 3 |
| `wildcard` | 800 | 1 | 5 |

`nextAllowedGameweek = lastUsedGameweekNumber + cooldown + 1`.

**`POST /chips/purchase`** — free chips just increment inventory directly; paid chips do an **atomic conditional debit** (`Wallet.findOneAndUpdate({userId, balance:{$gte:coins}}, {$inc:{balance:-coins}})` — 422 `INSUFFICIENT_COINS` if it fails). If the subsequent inventory-increment/audit-log step throws, the wallet debit is **compensated (refunded)** and a 500 is thrown instead of silently losing the coins.

**`POST /chips/activate`** — the real multi-chip path (unlike the legacy `bench_boost`-only route above). 409 `CHIP_COOLDOWN_ACTIVE` if within cooldown; 409 `CHIP_ALREADY_USED_THIS_GAMEWEEK` (DB-unique-enforced) — **one chip of any type per gameweek, period**.

**Critical scoring-effect gap, verified against `leaderboard.service.js`**: the gameweek points-computation function **only ever checks for `BENCH_BOOST`** to decide whether bench players count toward the score. There is **no code anywhere** that applies a `TRIPLE_CAPTAIN` point multiplier, a `WILDCARD` transfer-cost bypass, or a `FREE_HIT` temporary-squad effect. `FantasyTeamGameweek.model.js` even has a `tripleCaptainActive` field explicitly commented `"reserved for future"` that is never set by any code path. **Bottom line: `wildcard`, `free_hit`, and `triple_captain` can be purchased and "activated" (and will correctly show as owned/used in the UI), but have zero actual effect on transfers or scoring today.** Only `bench_boost` functions end-to-end.

**Captain multiplier mechanism** (for clarity, since it's not a literal ×2): the engine adds the captain's `totalPoints` a **second time** on top of the normal sum, only if the captain actually appeared in the fixture; if not, it falls back to doing the same for the vice-captain (if *they* appeared); if neither appeared, no multiplier applies at all.

### `payments` module — mounted `/payments`

`GET /packs` (public): 3 static packs (200/500/1200 coins). `POST /paystack/webhook` (no auth, raw body, HMAC-verified, responds 200 immediately per Paystack's 20s ack requirement, processes async). `POST /coins/initiate` (auth): server validates `packId` against a fixed map (never trusts a client-supplied amount), creates a `pending` `CoinPurchase` record **before** calling Paystack so failures stay reconcilable, converts naira→kobo itself. `GET /paystack/verify/:reference` (auth, manual fallback): same idempotency gate as the webhook (`findOneAndUpdate` pending→paid) — distinguishes `409 PAYMENT_ALREADY_CREDITED` from `404 PURCHASE_NOT_FOUND` if verification is attempted twice or for someone else's reference.

Both the webhook and manual-verify paths funnel through the same `_creditWalletAndLog` — an atomic `$inc` on `Wallet.balance` (upserts the wallet on first-ever purchase) plus an audit `WalletTransaction` row. `WalletTransaction` is the **only** ledger model — it records both credits (purchases) and debits (chip purchases) via a `type` field.

### Scoring rules (`fantasy/scoring/scoringRules.js`) — `SCORING_RULE_VERSION = "v1"`

| Event | GK | DEF | MID | FWD |
|---|---|---|---|---|
| goal / penalty_scored | 10 | 6 | 5 | 4 |
| assist | 3 (all) |
| yellow_card | -1 (all) |
| red_card | -3 (all) |
| own_goal | -2 (all) |
| appearance (synthetic, 1/fixture) | +2 (all) |

**No bonus-points system, no clean-sheet points** — the file's own header explicitly states clean sheets are "DISABLED for MVP — requires reliable lineup submission data."

### Background jobs (`fantasy/jobs/`) — **not cron-scheduled**, both are blocking Redis-queue consumers run as separate Node processes

- `fantasyScoreFixture.job.js`: consumes a scoring queue per finalized fixture, retries up to 3 times on failure then drops the job (logged only, no dead-letter queue).
- `updateFantasyLeaderboard.job.js`: recomputes gameweek points, fires point/rank-change notifications, then triggers dynamic pricing for that gameweek.

**Dynamic pricing** (triggered post-leaderboard-update, not itself scheduled): adjusts each player's price by a performance delta (≥12pts → +0.2, ≥8 → +0.1, ≥4 → 0, <4 → -0.1) plus an ownership-based demand delta (±0.1), clamped to ±0.3/gameweek, then clamped again to a **hard position band** that differs from the initial pricing tier ranges (GK £3.5–7.5, DEF £3.5–8.5, MID £4.0–13.5, FWD £4.5–14.0).

---

# Part 2 — Frontend Flow Index

The complete page-by-page frontend breakdown lives in [`APPLICATION_FLOW_DOCUMENT.md`](./APPLICATION_FLOW_DOCUMENT.md) (Parts II–V there). Quick index by role, so this document can be read standalone for orientation:

- **Public/Unauthenticated**: Landing page (no visible login link — everything routes through a PWA-install handler), onboarding funnel (`/onboarding/splash → welcome → role-select`), all `/auth/*` screens, public recruitment forms (`/recruit/:handle`, `/:competition/:...slug`), invite acceptance (`/organization/onboarding`, `/player/onboarding`).
- **Authenticated Player**: App shell + bottom nav, Dashboard, Fantasy (competition picker → 3-step onboarding wizard → Home/My Team/Fixtures/Stats tabs, with Transfers panel and Chip Store drawer), Shop (Paystack), League section (Overview/Matches/Standings/Knockout/Stats tabs).
- **Admin/Organization**: Admin shell, Home, Tournaments list + create wizard, Tournament Detail (Overview/Schedule/Standings/Bracket/Fantasy tabs), Fantasy pricing UI, Organise (Teams/Groups + the Sync-to-Tournament bridge), global Schedule + live match console, Collaborators, News, Notifications, Players, Profile, Settings.

---

# Part 3 — Connected Cross-Reference

The highest-value, highest-risk flows, traced end-to-end: frontend click → `lib/services` function → backend endpoint → what actually happens server-side.

| Frontend action | `lib/services` function | Backend endpoint | What actually happens |
|---|---|---|---|
| Login form submit | `login()` (`auth.service.ts`) | `POST /auth/login` | Generic invalid-credentials error either way (no enumeration); **response always says `lastRole:"personal"` even if the account is org-based** — frontend then routes based on that forced value |
| "Save Team" in `PickTeamOnboarding`/My Team | `saveTeamToApi()` → `setSquad()` | `PUT /fantasy/:id/team/squad` | Budget + max-3-per-team **always** enforced; full 15-player composition/formation checks **only** if exactly 15 selected; locks 4h before deadline, not at kickoff |
| `TransfersPanel` confirm | `makeTransfer()` | `POST /fantasy/:id/team/transfers` | Real server cost (0 pre-deadline, 1 free then -4/extra post-deadline) — **frontend's optional `coinCost`/`walletBalance` fields will never be populated, there's no coin-transfer path server-side**; also note **no post-transfer budget re-check** |
| `ChipStoreDrawer` activate (Wildcard/Free Hit/Triple Captain) | `activateChip()` (`chip.service.ts`) | `POST /chips/activate` | Purchase/activation succeeds and is recorded — but has **zero effect on scoring or transfers**; only Bench Boost actually changes anything computed |
| My Team's inline captain change | `captainMutation` → `setSquad()` directly | `PUT /fantasy/:id/team/squad` | Same full validation chain as any squad save (captain/vice must be in XI, etc.) |
| Organise → Groups "Sync Groups to Tournament" | `assignTeamGroups()` | `PATCH /competitions/:id/teams` | This is genuinely the *only* backend bridge between the org-level `Group` model and what Standings actually reads (`CompetitionTeam.groupName`) — confirmed there is no automatic sync; it must be triggered manually every time org-level groups change |
| Tournament Detail Overview "Publish Tournament" | `publishCompetition()` | `POST /competitions/:id/publish` | Full 6-step validation chain (§1.3.1) — a failure surfaces the *specific* blocking reason (missing stages, unassigned groups, teams with no players, etc.), not a generic error |
| Admin `RecordEventModal` (Tournament Detail Schedule tab) | `createMatchEvent()` (`match.service.ts`, confirm which the actual component calls) | `POST /matches/:id/events` **or** `POST /fixtures/:id/events` | **Only the `/matches/...` path broadcasts live via Socket.IO** — worth confirming in the component which one is actually wired, since the two paths look similar but only one updates other viewers in real time |
| League Overview `LiveMatchSection` | Socket join + cache patch | `socket.emit('join:match', id)` → room `match:<id>` | Confirmed real and matching — but only receives events from the `/matches/...` path (see above) |
| Shop coin purchase | `initiatePurchase()` → `verifyPayment()` | `POST /payments/coins/initiate`, `GET /payments/paystack/verify/:ref` | Amount is entirely server-controlled from a fixed pack map; verify is idempotent (safe to call twice) |
| Notifications inbox (any tab) | `getInboxNotifications()` | `GET /notifications` | **Response shape mismatch** (see Part 4) — but separately, any notification generated from a live match event is likely **never actually in the inbox at all**, due to the backend's own `insertMany` schema-validation bug |
| Standings tab / Tournament Detail Standings tab | `getStandings()` + `listCompetitionTeams()` | `GET /competitions/:id/standings` (public) + `GET /competitions/:id/teams` (public) | Confirmed: standings carries no group data at all; grouping is entirely a client-side join against the teams endpoint's `groupName` field — this is correct/required behavior, not a workaround for a bug |
| Bracket tab (both player and admin) | `listRounds()` + `listFixtures()`, filtered client-side | none dedicated | Confirmed: there is no bracket/elimination-state endpoint of any kind; "teams remaining" is unavoidably a client estimate |

---

# Part 4 — Frontend/Backend Contract Mismatches (Full List)

These were found by directly comparing what each frontend `lib/services/*.ts` function sends/expects against what the corresponding backend route actually accepts/returns.

## 4.1 Frontend calls routes that don't exist on the backend (will 404)

| Frontend function | File | Called path | Backend reality |
|---|---|---|---|
| `acceptPlayerInvite` / `declinePlayerInvite` | `team.service.ts` | `POST /teams/:id/invites/:id/accept\|decline` | No such route in `team.routes.js` |
| `getTeamPhotos` / `uploadTeamPhoto` / `deleteTeamPhoto` | `team.service.ts` | `/teams/:id/photos*` | No such route |
| `registerTeamForCompetition` | `team.service.ts` | `POST /teams/:id/register` | No such route (the real path is `POST /competitions/:id/teams`) |
| `listPublicTeams` | `team.service.ts` | `GET /teams/public` | No such route |
| `updatePost` / `deletePost` | `feed.service.ts` | `PUT\|DELETE /feed/posts/:id` | No such route |
| `editComment` / `deleteComment` | `feed.service.ts` | `PUT\|DELETE /feed/:postId/comments/:commentId` | No such route |
| `clearAllNotifications` | `notifications.service.ts` | `DELETE /notifications` | Only `DELETE /notifications/:id` (singular) exists |

**Every backend endpoint in the `recruitment` module** (`/recruitment/link`, `/submit`, `/team/:id`, `/:id/approve|reject`) has **no frontend caller at all** — confirmed dead on the frontend side, inverse of the above (backend exists, nothing calls it).

## 4.2 Response shape mismatches (endpoint works, but the frontend reads the wrong keys)

| Endpoint | Backend actually returns | Frontend expects |
|---|---|---|
| `POST /fantasy/:id/team/transfers` | `{ data: { team, transferCost } }` | `{ message, cost, type, coinCost?, walletBalance? }` |
| `POST /fantasy/:id/gameweeks` | `{ data: [...] }` | `{ message }` |
| `PATCH /users/avatar` | `{ message, user }` | `{ success, data: { imageUrl, publicId } }` |
| `POST /invite/validate` | Flat `{ valid, type, email, ... }` | `{ invite: {...} }` (nested) |
| `POST /invite/accept` | `{ success, player }` or `{ success, invite }` | `{ message: string }` |
| `DELETE /matches/:id/events/:eventId` | `{ message }` only (service computes `{success:true}` but the controller discards it) | `{ message, score }` |
| `GET /notifications` | `{ success, data: [...], unreadCount, pagination:{page,limit,total,pages} }` | `{ notifications, total, page, unreadCount }` |
| `PATCH /notifications/read-all` | `{ success, data: { updatedCount } }` | `{ message }` |
| `PATCH /notifications/:id/read` | `{ success, data: doc }` | `{ message, notification }` |
| `DELETE /orgs/:orgId/members/:memberId` | `{ member }` | Both `org.service.ts` and `member.service.ts` type it as `void`/`{message}` |

## 4.3 Business logic the frontend assumes exists but the backend does not implement

- **Coin-based transfers**: frontend's `makeTransfer()` return type optimistically includes `coinCost?`/`walletBalance?` (per its own code comment, gated behind a backend feature that hasn't shipped) — confirmed the backend has no coin-cost transfer path whatsoever; it's strictly the classic 1-free-then-(-4) points model.
- **Chip scoring effects**: `WILDCARD`, `FREE_HIT`, `TRIPLE_CAPTAIN` can be purchased/activated but have zero effect on scoring or transfers — only `BENCH_BOOST` actually changes anything.
- **Bulk "Team of the Round" / per-round leaderboard**: confirmed absent — frontend's own TODO comments claiming this are accurate.
- **Knockout bracket state / "teams remaining"**: confirmed absent — no backend concept of bracket progression exists at all; the frontend's client-derived estimate (explicitly labeled as such in `TournamentBracket.tsx`) is the only source.
- **Per-player kickoff-based squad lock**: only a single blanket gameweek-deadline lock (4h before deadline) exists — there's no mechanism to lock an individual player's slot at their specific fixture's kickoff time.

## 4.4 Confirmed backend-side bugs (not frontend issues, but will affect what QA observes)

- **In-app notifications for live match events are silently never persisted.** The BullMQ worker's `insertMany` payload doesn't match the `Notification` schema's required fields (`type`, `message`) and lacks the schema at all for `eventId` — every batch throws a validation error that isn't caught by the worker's error handler (which only suppresses duplicate-key errors). Push notifications and other non-match notifications (lineup changes, news) are unaffected.
- **`Notification.model.js`'s `type` enum uses `goal_scored`, but the fan-out worker's priority map (and `MatchEvent.type`, which it's driven from) uses `goal`** — a naming mismatch that would cause a schema-validation failure on direct creation, compounding the bug above.
- **`assignTeamsToGroups`'s "invalid group name" error path is unreachable dead code** — the function auto-creates any unrecognized group name into the competition's stage config before the validation that would have rejected it ever runs.
- **Feed `visibility:"org"` items are not access-controlled** — `GET /feed/org/:orgId` is fully public despite the frontend's comment assuming auth-gated visibility scoping; the route file's own header comment admits this is a known v1 gap.
- **One-repost-per-user-per-item is enforced via an application-level `findOne` check, not a unique DB index** — theoretically possible to double-repost under concurrent requests.

---

# Part 5 — Business Rules That Actually Exist (vs. Assumed)

For anyone testing squad/transfer/pricing flows specifically, the ground truth (all verified directly against service code, not documentation):

- **Squad budget**: hard cap, enforced on every `setSquad` call (partial or full), never on transfers.
- **Max players per real team**: hard-coded 3, enforced on every `setSquad` call regardless of squad completeness.
- **Free transfers**: max 1 per gameweek; resets on the first transfer attempt of a new gameweek; every transfer after the free one costs -4 points; unlimited free edits before the deadline.
- **Squad lock timing**: 4 hours before the gameweek deadline (not at kickoff, not per-player).
- **Pricing tiers**: marquee £9.5–14.0 / elite £6.5–9.0 / standard £4.5–6.0 / budget £3.5–4.5, absolute floor £3.5; Top-15 average must land between £4.5–8.5 to finalize.
- **Chip economy**: bench_boost free (max 2, 3gw cooldown, only functional chip); free_hit 400 coins (max 2, 2gw cooldown); triple_captain 600 coins (max 2, 3gw cooldown); wildcard 800 coins (max 1, 5gw cooldown) — one chip of any type activatable per gameweek, hard DB-enforced.
- **Scoring**: goal 10/6/5/4 (GK/DEF/MID/FWD), assist 3 flat, yellow -1, red -3, own goal -2, appearance +2 (synthetic, once per fixture). No bonus points, no clean-sheet points (explicitly disabled for MVP).
- **Captain multiplier**: captain's points counted twice via addition (not literal ×2); falls back to vice-captain if captain didn't appear; no multiplier if neither appeared.
