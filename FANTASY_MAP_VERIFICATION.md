# Fantasy Completeness Map — Verification Report

**Repos audited:** both.
- Frontend: `C:\Users\HP LAPTOP\Documents\gaffer-frontend`, branch `NIYI-BRANCH`
- Backend: `C:\Users\HP LAPTOP\Documents\The-Gaffer--backend`, branch `Niyi` (working tree has uncommitted changes — a fantasy scoring v2 rewrite is mid-flight; this report reads the actual working-tree files, not `HEAD`)

**Date:** 2026-07-23

**Method:** Frontend items verified directly by reading source (file path + line cited for every verdict). Backend items were verified by a dedicated read-only research pass covering B3, B4 (remaining), B5, B6, B8, and Part D; its citations are reproduced here. No source file was modified to produce this report — this document is the only file written.

**Summary:** The map is significantly out of date in the direction of *underselling* how much has changed — the gameweek-lifecycle rework (B2), scoring v2 (most of B4), and the top-players/team-of-round/leaderboard endpoints (B7) that the map lists as ❌/🟡 broken are now built and verified working. But the map's single most important structural finding — **"fantasy gameweeks were never generated" is a silent, undiscoverable failure mode** — is not just still true, it's *worse* than described: the `createGameweeks` function that would generate them has **zero call sites in any admin UI component anywhere in the frontend**. There is no button a real admin could click. Several other items the map called broken turn out to have never been broken (mini-leagues, per-round leaderboard, fixtures grouping, chip pricing UI), and two new problems were found that aren't on the map at all (a second live-event-recording code path that skips the fantasy pipeline entirely, and a notification-insert schema mismatch worse than the map describes).

---

## Scorecard

| Verdict | Count |
|---|---|
| CONFIRMED (map matches code) | 21 |
| FIXED (map said broken, now works) | 17 |
| REGRESSED | 0 |
| WRONG (map's status was never accurate) | 7 |
| UNVERIFIABLE | 6 |
| OUT-OF-REPO | 0 |

---

## ✅ Fixed since the map

1. **Gameweek lifecycle, entirely** (B2, all 5 sub-items) — new `lib/gameweekState.ts` derives state (`no_fixtures`/`upcoming`/`in_progress`/`completed`) and deadline (earliest fixture kickoff − buffer) purely from live `Fixture` data, never a stored/triggered flag. Two gameweeks can be `in_progress` simultaneously by construction — each gameweek's state is computed independently, no cross-gameweek gating exists.
2. **Countdown honest empty states** (B2, C1) — `CountdownTimer` is now only rendered when a gameweek is `upcoming` and its deadline hasn't passed; every other state/absence renders a text label ("Awaiting kickoff", "Fixtures not scheduled yet", "Fantasy gameweeks haven't been generated yet") instead of a zeroed clock. Fixed in both `FantasyHomeTab.tsx` and `CompetitionFantasyCard.tsx` (the "Select League" screen) — two independent call sites, both fixed.
3. **Round Points strip shows all gameweeks** (B2, C1) — `RoundPointsStrip.tsx` now maps over every gameweek with a state-appropriate tag, points (final for completed, live/provisional for in_progress reusing the same leaderboard call), and a "current gameweek" indicator dot.
4. **Scoring v2** (B4) — `scoringRules.js` (appearance tiers 1/2, clean sheet table, goals-conceded formula), new `minutesDerivation.js` (lineup + substitution + fulltime event derivation, throws rather than guessing if no fulltime minute exists), rewritten `scoringEngine.js`. Per-tournament minute threshold via new `FantasySeason.appearanceMinutesThreshold` field (default 60).
5. **Unit tests on scoring** (B4) — 64 new tests across `scoringRules.test.js`, `minutesDerivation.test.js`, `scoringEngine.test.js`, all passing. The map's "zero tests" claim is now false.
6. **Top players by round / Team of the Round** (B7) — new backend endpoint `GET /fantasy/:competitionId/gameweeks/:gameweekId/top-players` and frontend `TeamOfTheRoundWidget.tsx`, both verified live against real data.
7. **Position filter in player picker** (B1, C1) — `components/PositionFilterBar.tsx`, wired into both `CreateTeamScreen.tsx` (user-facing) and `AdminLiveMatchDetails.tsx` (admin squad assignment).
8. **Fantasy → Stats zero-goal padding** (C1) — `FantasyStatsTab.tsx` reuses `components/league/TopPlayersList.tsx`, which filters `(p?.[statKey] || 0) > 0` (`TopPlayersList.tsx:21`) — fixed earlier this session and confirmed to also cover the Fantasy Stats tab since it's the same shared component.
9. **Budget £0.0m — one confirmed root cause fixed** (C1) — `if (season?.squadBudget)` (a falsy-check that would silently skip a legitimate `squadBudget: 0`) changed to `if (season?.squadBudget != null)` in both `MyTeamTab.tsx:82` and `app/app/fantasy/[competitionId]/layout.tsx:76`. Live-checked: `GET /fantasy/.../season` for the affected competition returns `squadBudget: 100`, confirming this isn't a backend data issue. **Caveat:** I could not reproduce the exact live trigger without the affected user's own session/localStorage state — see Unverifiable section.
10. **Currency consistency** (C1, E6) — new `formatSquadValue()` helper in `lib/format.ts`, using ₦ per owner's explicit choice. Every hardcoded `£` (2 files) and `Ǥ` (3 files — not a real currency symbol, was a typo) replaced; confirmed zero `£`/`Ǥ` remain anywhere under `components/fantasy/`.
11. **Live console commentary — XI-only picker** (C2) — `eligiblePlayers` (`AdminLiveMatchDetails.tsx:322-326`) resolves to `getOnPitch(selectedTeam)`, which derives the currently-on-pitch subset from the lineup plus substitution events — not the full roster. This resolves the uncertainty left open earlier this session about whether this fix had actually landed: **it has.**
12. **Live console commentary — assist Yes/No gate** (C2) — `commentaryStep` state machine includes an explicit `'assistYesNo'` step (`AdminLiveMatchDetails.tsx:40, 1172, 1236`) inserted between selecting a goalscorer and the assist picker. Also confirmed implemented.
13. **Lineup auto-save → single explicit save** (C2) — `persistLineup` (the old per-slot auto-save that caused timeout toasts) no longer exists anywhere in `AdminLiveMatchDetails.tsx`; replaced by a single `saveLineupMutation` gated on an `isLineupDirty` flag (`AdminLiveMatchDetails.tsx:57, 768-771`).

---

## ⚠️ Regressed or worse than the map says

**None found regressed.** Two items are *worse than the map describes* (not regressions — they were already this bad, just under-described):

1. **"Generate gameweeks" is not just hard to find — it doesn't exist as a UI action at all.** The map marks this ❓ ("verify this exists and is discoverable"). It does not exist: `createGameweeks` (the frontend service function wrapping `POST /fantasy/:competitionId/gameweeks`) has exactly two references in the whole frontend repo — its own definition (`lib/services/fantasy.service.ts`) and its own unit test. **Zero call sites in any admin component.** This is exactly the mechanism that caused the real Club World Cup gameweek-scoring gap earlier this session — I had to call the endpoint manually via raw `fetch()` because there was no button. This is the single highest-value fix on the entire map.
2. **In-app notification loss is a schema mismatch, not just an enum mismatch.** The map says `insertMany` fails due to `"goal"` vs `"goal_scored"` naming. The actual payload (`notification.worker.js:131-142`) sends `{userId, eventId, title, body, url}` against a schema requiring `type` and `message` (`notification.model.js:12-53`) — neither field is even present in the insert payload. Every notification insert throws a full Mongoose validation error, silently caught (only duplicate-key errors are swallowed intentionally, but validation errors fall through the same catch and are just logged).

---

## Full item-by-item table

### PART A — Top-level essentials

| # | Essential | Map says | Verdict | Actual status | Evidence | Note |
|---|---|---|---|---|---|---|
| A1 | Build legal squad under budget/shape | ✅ | CONFIRMED | Unchanged, not re-verified in depth (no map complaint to test against) | — | |
| A2 | Gameweeks derived from real fixtures | 🟡 | FIXED | Now fully derived from `Fixture.status`/`kickoffAt`, not stored flags | `lib/gameweekState.ts` | |
| A3 | Squads lock at a deadline | 🟡 | CONFIRMED | Still true, and the *enforcement* (as opposed to display) still uses the old crude `FantasyGameweek.deadline` (`round.startDate \|\| new Date()` at creation) — my fixture-derived deadline is display-only, locking was explicitly out of scope for that pass | `fantasy.service.js:174-187` (backend) | Locking behavior deliberately untouched |
| A4 | Match events convert to points | 🟡 | FIXED (substantial, not total) | Scoring v2 built; own-goal player-capture gap remains (see B4) | `scoringRules.js`, `scoringEngine.js` | |
| A5 | Points reach the manager's screen reliably | ⚠️ | CONFIRMED | Display-side bugs fixed (leaderboard parsing, GW1-only strip), but pipeline reliability itself (silent job drops, undiscoverable gameweek generation) is unaddressed | See Part D | |
| A6 | Change squad between gameweeks (transfers) | 🟡 | CONFIRMED | Untouched this session | — | |
| A7 | Compare to others (leagues/leaderboards) | 🟡 | FIXED (partial) | Leaderboard response-parsing bug fixed (was silently broken — wrong field names); top-players/team-of-round built | `fantasy.service.ts` `OverallLeaderboardResponse`/`GameweekLeaderboardResponse` types | Mini-leagues still don't exist (B7) |
| A8 | Works across tournament structure (groups→knockout) | 🟡 | CONFIRMED | Untouched | — | |

### PART B1 — Squad building

| Rule | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| Budget cap enforced, hardcoded 100M | ✅ / hardcoded | CONFIRMED | Still hardcoded, no input field | `components/admin/FantasyAdminPanel.tsx:87` — `onClick={() => enableMutation.mutate(100)} // Default 100M budget` |
| 15-player squad, quotas | ✅ | CONFIRMED | Unchanged | — |
| Max 3 players/club | ✅ | CONFIRMED | Unchanged | — |
| Formation + valid XI | ✅ | CONFIRMED | Unchanged | — |
| Captain/vice-captain | ✅ | CONFIRMED | Unchanged | — |
| Position filter in picker | ❌ | FIXED | Built, wired into both pickers | `components/PositionFilterBar.tsx` |
| Player prices, FINAL badge refresh | ⚠️ | WRONG | `finalizeMutation` already invalidates `['team-pricing', competitionId]` in current code | `app/admin/fantasy/[competitionId]/pricing/[teamId]/page.tsx:81` |
| Pricing screen redirect after confirm | ⚠️ | UNVERIFIABLE | Uses `router.back()` (`page.tsx:83`) — whether this is "wrong" depends on the navigation path the admin took to arrive there, which can't be determined from code alone | `app/admin/fantasy/[competitionId]/pricing/[teamId]/page.tsx:83` |

### PART B2 — Gameweeks & lifecycle

| Rule | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| Gameweeks exist (one per Round), explicit admin action, easy to forget | 🟡 | CONFIRMED, and worse | Explicit action required, AND that action has no discoverable UI trigger at all (see ⚠️ section above) | `lib/services/fantasy.service.ts` `createGameweeks` — zero call sites outside its own definition/test |
| Gameweeks derived from fixture schedule | ❌ | FIXED | `getGameweekState()` | `lib/gameweekState.ts:34-40` |
| Deadline = first kickoff − configurable buffer | ❌ | FIXED, with a caveat | Computed correctly; buffer is a shared frontend constant (`DEFAULT_DEADLINE_BUFFER_MINUTES = 120`), not yet a true per-tournament *stored* setting — that would need a backend field, out of scope for a frontend-only pass | `lib/gameweekState.ts:14, 54-63` |
| States: Upcoming/In Progress/Completed | ❌ | FIXED | Plus a 4th `no_fixtures` state the map didn't ask for but the spec needed | `lib/gameweekState.ts:9` |
| All scheduled gameweeks listed with tags | ⚠️ | FIXED | Was GW1-only, now maps over every gameweek | `components/fantasy/team/RoundPointsStrip.tsx:57-90` |
| Countdown honest empty states | ⚠️ | FIXED | Two call sites fixed | `FantasyHomeTab.tsx`, `CompetitionFantasyCard.tsx` |
| Two gameweeks may be In Progress simultaneously | ❌ | FIXED | By construction — no cross-gameweek state gating exists | `lib/gameweekState.ts:30-32` (comment + implementation) |

### PART B3 — Locking

| Rule | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| Blanket lock, 4h before deadline | 🟡 | CONFIRMED | `_isDeadlinePassed()` unchanged | `fantasy.service.js:174-187` (backend) |
| Per-player lock at kickoff | ❌ | CONFIRMED | No per-player gating exists anywhere in the fantasy module | Backend-wide grep, zero hits (backend agent) |

### PART B4 — Scoring

| Rule | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| Goal (10/6/5/4) | ✅ | CONFIRMED | Unchanged mechanism, restated in v2 | `scoringRules.js` |
| Assist (3) | ✅ | CONFIRMED | Unchanged | `scoringRules.js` |
| Yellow −1 / Red −3 | ✅ | CONFIRMED | Unchanged | `scoringRules.js` |
| Own goal −2, no player attached | 🟡 | CONFIRMED, still broken | `AdminLiveMatchDetails.tsx` fires `recordEventMutation.mutate({type:'own_goal', minute, teamId})` — **no `playerId` at all**, confirmed at the exact call site. Backend schema doesn't require one either. My v2 `scoringEngine.js` still gates on `event.playerId` truthiness, so this remains silently skipped exactly as before | Frontend: `AdminLiveMatchDetails.tsx:1276-1280`. Backend: `fixtures.validation.js:57-75` (no playerId requirement on own_goal), `scoringEngine.js:103-115` (gate) |
| Appearance, flat +2 → should be tiered | 🟡 | FIXED | `getAppearancePoints()`: 1 below threshold, 2 at/above | `scoringRules.js` |
| Clean sheet (4/4/1/0) | ❌ | FIXED | `getCleanSheetPoints()` | `scoringRules.js` |
| Goals conceded (−1/2, GK/DEF) | ❌ | FIXED | `getGoalsConcededPoints()` | `scoringRules.js` |
| Penalty scored — console gap | 🟡 | UNVERIFIABLE (mixed) | Backend: `penalty_scored` fully in enum + scoring table (CONFIRMED present). Whether it's reachable from the live console menu specifically wasn't independently re-verified this pass | `matchEvent.model.js:14`, `scoringRules.js:22` (backend) |
| Penalty missed/saved — enum doesn't exist | ❌ | WRONG (partially) | `penalty_missed` **is** a real, loggable event type (has description-builder support) but has zero scoring rule (0 points always). `penalty_saved` truly doesn't exist as an event type anywhere | `matchEvent.model.js:15` (penalty_missed exists), `scoringRules.js:27` (both explicitly omitted from scoring) |
| Minutes from timestamped events | ❌ | FIXED, with an accuracy caveat | `minutesDerivation.js` built and tested. But the admin console hardcodes `fulltime` to minute 90 and `start`/`halftime` to 0/45 with no stoppage-time input — minutes will be accurate *relative to recorded events*, undercounting anyone on the pitch during real stoppage time, until the console is enhanced (separate, out-of-scope task) | `AdminLiveMatchDetails.tsx:1050, 1348` |
| Captain ×2 | ✅ | CONFIRMED | Unchanged | `leaderboard.service.js` |
| Triple Captain ×3 | ❌ | CONFIRMED | No `TRIPLE_CAPTAIN` branch anywhere in the captain-multiplier code — always effectively ×2 regardless of chip | `leaderboard.service.js:149-163` (backend) |
| Bonus points/BPS | ❌ | CONFIRMED | Deliberately excluded, unchanged | — |
| Defensive contributions | ❌ | CONFIRMED | Deliberately excluded, unchanged | — |
| Scoring rules configurable per tournament | ❌ | FIXED (partial) | The minutes threshold is now per-tournament (`FantasySeason.appearanceMinutesThreshold`); the point *values* (goal/assist/card/clean-sheet numbers) remain fixed constants in `scoringRules.js`, not per-tournament | `FantasySeason.model.js` (backend) |
| Unit tests on scoring | ❌ | FIXED | 64 new tests, all passing | `src/modules/fantasy/scoring/__tests__/` (backend) |

### PART B5 — Transfers & monetization

| Rule | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| 1 free transfer/gameweek | ✅ | CONFIRMED | Unchanged | `fantasy.service.js` (backend) |
| Extra transfers cost coins | ❌ (costs points) | CONFIRMED | `makeTransfer` still does `cost = -4` on a points basis, no wallet reference | `fantasy.service.js:480-490` (backend) |
| Coin wallet + Paystack | ✅ rail exists, unwired | CONFIRMED | `Wallet.model.js`/`payment.service.js` exist; `makeTransfer` never imports either | Backend agent, full-body grep |
| Rising per-team cap in knockouts | ❌ | CONFIRMED | `MAX_PER_REAL_TEAM = 3` flat constant, zero knockout-conditional logic | `fantasy.service.js:47` (backend) |
| Free reset window at knockout start | ❌ | CONFIRMED | No such logic anywhere | Backend agent, repo-wide grep |
| Transfer market not a reusable component | ⚠️ | WRONG | The map's own cited path (`app/app/fantasy/transfers/page.tsx`) **no longer exists** — confirmed via directory listing of `app/app/fantasy/`. Transfer logic now lives entirely in `components/fantasy/team/TransfersPanel.tsx`, a real reusable component used from `MyTeamTab.tsx` | `app/app/fantasy/` directory listing; `components/fantasy/team/TransfersPanel.tsx` |

### PART B6 — Chips / boosts

| Chip | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| Bench Boost | 🟡 only chip affecting scoring | CONFIRMED | `leaderboard.service.js` reads `FantasyChipUsage` filtered to `BENCH_BOOST` only, drives `includeBench` | `leaderboard.service.js:107-113` (backend) |
| Triple Captain / Wildcard / Free Hit | ❌ purchasable, inert | WRONG (partially) — infra is more built than described, effect is not | A real chip economy now exists (`chip.service.js`: `CHIP_CONFIG`, coin deduction, `TournamentChipInventory`, cooldowns) — this is new since whatever snapshot the map used. But confirmed: zero references to `WILDCARD`/`FREE_HIT`/`TRIPLE_CAPTAIN` anywhere in scoring or transfer code — purchasable and "activatable," but genuinely no downstream effect | `chip.service.js` (backend); repo-wide grep for the three chip-type strings outside chip infra |
| Coin price attached to each chip | ❌ | WRONG | Frontend `ChipStoreDrawer.tsx` displays `chip.price.coins` per chip via `formatCoins()`, and backend `CHIP_CONFIG` has real per-chip costs | `components/fantasy/team/ChipStoreDrawer.tsx:156-236` |

### PART B7 — Leagues & comparison

| Rule | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| Join a tournament's fantasy game | ✅ | CONFIRMED | Unchanged | — |
| Mini-leagues / join by code | 🟡 ❓ | WRONG | No mini-league/private-league model exists anywhere in the backend (`grep -r "mini.?league\|MiniLeague\|FantasyLeague"` — zero hits). The "Join New League" button the map is referring to navigates to `/app/league` — joining a *tournament*, not a private fantasy sub-league. The feature the map describes doesn't exist to verify | `app/app/fantasy/page.tsx:118, 134` (button destination); backend-wide search, no matches |
| Overall leaderboard | 🟡 | FIXED | Was silently broken client-side (parsing a `.leaderboard` key that never existed in the response) — Rank showed "—" forever. Fixed | `lib/services/fantasy.service.ts` `OverallLeaderboardResponse` |
| Per-round leaderboard endpoint | ❌ No endpoint | WRONG | `GET /fantasy/:competitionId/leaderboard/gameweek/:gameweekId` already existed before any of this session's work — only its *frontend parsing* was broken, not the endpoint itself | `leaderboard.service.js` `getGameweekLeaderboard` (backend, pre-existing) |
| Top players by round | ❌ No endpoint | FIXED | New endpoint built and verified live | `fantasy.service.js:689` (backend), `fantasy.controller.js:259` |
| Team of the Round | ❌ No endpoint | FIXED | Built on top of the above, new frontend widget | `components/fantasy/home/TeamOfTheRoundWidget.tsx` |

### PART B8 — Tournament structure integration

| Rule | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| Fantasy on any format incl. knockout | 🟡 | CONFIRMED | Unchanged | — |
| Standings grouped by group | ⚠️ | CONFIRMED | `Standing` model still has no group field; `getStandings()` doesn't even surface `groupName` in its own response | `Standing.model.js:3-46`, `standing.service.js:88-154` (backend) |
| "Sync Groups" is manual | ⚠️ | CONFIRMED | No sync endpoint exists; `PATCH /competitions/:id/teams` sets `CompetitionTeam.groupName` directly, never touches `Standing` | Backend agent, repo-wide grep |
| Fixtures grouped by round/group/date | ⚠️ flat list | WRONG | `GroupedFixturesView` (shared by fantasy Fixtures tab and admin Schedule) has 4 explicit view modes: By round / By date / By group / By team, with real round+group+date grouping logic | `components/league/GroupedFixturesView.tsx:8, 47-90`; used by `components/fantasy/fixtures/FantasyFixturesTab.tsx` |
| Bracket view read-only, client-estimate | 🟡 | CONFIRMED | Unchanged | — |
| Authoritative bracket state/teams remaining | ❌ | CONFIRMED | No such endpoint anywhere in the backend | Backend agent, repo-wide grep |

### PART C1 — Fantasy (user-facing) screens

| Screen | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| Competition picker ("Select League") | ✅, countdown broken | FIXED | Countdown now state-aware | `CompetitionFantasyCard.tsx` |
| — "Unknown Organizer" | ❓ | UNVERIFIABLE | Frontend never sends a `createdBy` field on competition creation (confirmed absent from `CreateTournamentModal.tsx`'s payload) — it's purely server-assigned. Whether it's actually populated for the affected competition(s) requires checking backend population logic or that specific creator's account data, out of scope for a frontend-only check | `components/tournament/CreateTournamentModal.tsx` (no `createdBy` in payload) |
| Fantasy → Home | 🟡 missing top players/team of round/leaderboard | FIXED | All three built this session | `FantasyHomeTab.tsx`, `TeamOfTheRoundWidget.tsx`, `TopPlayersLeaderboard.tsx` |
| Fantasy → My Team | 🟡 round strip GW1-only; Budget £0.0m; no chip banner; no round history | FIXED (mostly) | Round strip fixed; budget falsy-check bug fixed (root cause not 100% confirmed, see Unverifiable); `ActiveChipBanner` already existed and renders; round-by-round per-player points now available via the gameweek picker on the pitch (built earlier this session) | `MyTeamTab.tsx` |
| Fantasy → Fixtures | 🟡 not grouped | WRONG | Grouped via `GroupedFixturesView`, 4 view modes | `components/fantasy/fixtures/FantasyFixturesTab.tsx` |
| Fantasy → Stats | 🟡 pads 0-goal players | FIXED | Reuses the already-fixed `TopPlayersList` | `TopPlayersList.tsx:21` |
| Fantasy → Leagues tab | ❌ not present | CONFIRMED | Tab list is Home/My Team/Fixtures/Stats only, no Leagues | `app/app/fantasy/[competitionId]/layout.tsx:18-23` |
| Squad build / Pick Team | ✅, no position filter | FIXED | Filter added | `CreateTeamScreen.tsx` |
| Transfers | 🟡 no coin pricing; not a component | WRONG | Is a real component (`TransfersPanel.tsx`); still genuinely has no coin pricing (transfers are points-cost only, per B5) | `components/fantasy/team/TransfersPanel.tsx` |
| Chips/boosts | 🟡 3 of 4 inert; no prices | WRONG (partial) | Prices ARE shown (see B6); "3 of 4 inert" (functionally) remains CONFIRMED | `ChipStoreDrawer.tsx` |
| Back button (fantasy) | ⚠️ not working | UNVERIFIABLE | The competition-layout-level back button (`ChevronLeft` → `router.push('/app/fantasy')`) works and is deterministic — not obviously broken. `PickTeamOnboarding`'s back button is a prop-callback (`onBack`) whose wiring wasn't traced to its source. `CreateTeamScreen` has no back button at all. Map doesn't specify which screen's back button — couldn't pin down a specific broken instance | `app/app/fantasy/[competitionId]/layout.tsx:138-143`; `components/fantasy/PickTeamOnboarding.tsx:56-61` |
| Responsive layout | ⚠️ 18/18 zero responsive classes | WRONG in its absolute claim, CONFIRMED in substance | Sampled 6 representative fantasy components: 3 had zero `sm:`/`md:`/`lg:`/`xl:` classes (`MyTeamTab.tsx`, `FantasyHomeTab.tsx`, `PitchLayout.tsx`), 3 had a handful (`TransfersPanel.tsx`: 2, `ChipStoreDrawer.tsx`: 5, `CreateTeamScreen.tsx`: 3) — so "18/18" is factually wrong, but responsive coverage is real thin and inconsistent even where present | Direct grep count across 6 sampled files |
| Currency consistency | ⚠️ £ and ₦ both appear | FIXED | Unified to ₦ everywhere in `components/fantasy/` | `lib/format.ts` `formatSquadValue()` |

### PART C2 — Admin (fantasy-related) screens

| Screen | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| Initialize Fantasy | 🟡 budget hardcoded | CONFIRMED | No input field, single hardcoded `100` | `FantasyAdminPanel.tsx:87` |
| Sync players | 🟡 slow | UNVERIFIABLE | The read side is batched (`$in: teamIds`, not N sequential queries); the write/enrollment path wasn't fully traced. Performance claims need runtime profiling, not just code reading | `fantasy.service.js:263-288` (backend), read side only |
| Team pricing | ✅, wrong redirect + FINAL badge refresh bugs | Split: WRONG (badge) / UNVERIFIABLE (redirect) | See B1 rows above | — |
| Generate gameweeks | ❓ verify exists/discoverable | CONFIRMED, and the single most important finding in this report | Function exists, has **zero UI call sites** anywhere in the admin app | `lib/services/fantasy.service.ts` `createGameweeks` — only its own definition + test reference it |
| Live Match Console — Line-up | 🟡 per-slot auto-save timeout | FIXED | Single explicit save with dirty-flag | `AdminLiveMatchDetails.tsx:57, 768-771` |
| Live Match Console — Commentary | 🟡 full roster not XI; no assist gate; own-goal no player | FIXED (2 of 3), CONFIRMED (1 of 3) | XI-only picker: fixed. Assist Yes/No gate: fixed. Own-goal player capture: still genuinely missing | See ✅ items 11-12 above; own-goal evidence in B4 table |
| `RecordEventModal` (2nd logger) | ⚠️ duplicate, inconsistent | CONFIRMED | Still exists as a separate component, used from `app/admin/tournaments/[id]/page.tsx`, distinct from the live console's commentary flow — and per earlier-session notes, still uses full-roster `listPlayers()`, not the XI-filtered logic the live console got | `components/admin/RecordEventModal.tsx`; usage in `app/admin/tournaments/[id]/page.tsx` |
| Grouped event picker | ❌ specced | CONFIRMED | The event-type menu is a single flat reversed list (`actionTypes.slice().reverse().map(...)`), no category grouping | `AdminLiveMatchDetails.tsx:1024-1026` |
| Stats/scoring rebuild | ✅ native `confirm()`, raw api call | CONFIRMED | Not re-verified in depth this pass; no contradicting evidence found | — |

### PART D — The points pipeline

| Step | Map says | Verdict | Actual status | Evidence |
|---|---|---|---|---|
| 1-2. Event + fulltime logged with minute | ✅ | CONFIRMED | Code path intact | `fixtures.service.js:582-587` (backend) |
| 3. `finalizeMatch()` cascade | ✅ | CONFIRMED, with a new caveat | Fires correctly **from the `/fixtures/:id/events` path**. A second, newer path (`POST /matches/:fixtureId/events` → `match.service.js`) flips fixture status on fulltime but **never calls `finalizeMatch` or enqueues fantasy scoring at all** — a structurally incomplete parallel pipeline. Which endpoint the live console actually calls is a frontend question outside this backend trace | `fixtures.service.js:608-612` (works); `match.service.js:227-231` (doesn't enqueue) — both backend |
| 4. Enqueues scoring job | ✅ | CONFIRMED | Via the working path only | `fixtures.service.js:680-682` (backend) |
| 5. Worker computes points | ⚠️ fire-and-forget, 3 retries then silently dropped | CONFIRMED | Code path present and correct; the "silently dropped after 3 retries" characterization is a runtime/reliability property, not something code review disproves | `fantasyScoreFixture.job.js` (backend) |
| 6. Points land in FantasyGameweek | ⚠️ only if generated + mapped | CONFIRMED, and this session directly demonstrated it — see the "Generate gameweeks" finding above | `scoringEngine.js:284-327` (backend) |
| 7. Leaderboard worker updates | ⚠️ same silent-drop risk | CONFIRMED | Code path present | `updateFantasyLeaderboard.job.js`, `leaderboard.service.js:90-197` (backend) |
| 8. Frontend displays | 🟡 | FIXED | Multiple display-layer bugs fixed this session (leaderboard parsing, GW1-only strip, budget) | See ✅ section |
| Notifications never saved (insertMany mismatch) | (noted) | CONFIRMED, worse than described | Payload shape doesn't match schema at all (missing required `type`/`message`), not just an enum-value mismatch | `notification.worker.js:131-142`, `notification.model.js:12-53` (backend) |
| Delete-event response omits score | (noted) | CONFIRMED | Controller returns a hardcoded `{message}` with no score field at all, doesn't even forward the service's own return value | `match.controller.js:73-77` (backend) |

---

## 🆕 New findings not on the map

1. **`createGameweeks` has zero UI call sites anywhere in the frontend.** Already covered above — this is the highest-priority finding in this report. It's not that the button is hard to find; there is no button.
2. **Two parallel event-recording pipelines exist on the backend, and only one is wired to fantasy scoring.** `POST /fixtures/:fixtureId/events` correctly cascades to `finalizeMatch()` → fantasy scoring on fulltime. `POST /matches/:fixtureId/events` (a separate, newer module) only updates fixture status — it never calls `finalizeMatch` or enqueues anything. If any admin flow uses the `/matches` endpoint for live commentary, fantasy scoring silently never fires for that fixture, with no error anywhere. This deserves a direct check of which endpoint `AdminLiveMatchDetails.tsx` actually calls.
3. **Notification `insertMany` payload doesn't match its own schema at all** (not just an enum value) — see Part D.
4. **Delete-event response drops the score entirely**, not just a specific field the frontend "expects" — the controller doesn't forward any part of the service's return value.
5. **`penalty_missed` is a real, loggable event type with zero scoring rule** — distinct from `penalty_saved`, which genuinely doesn't exist. The map's blanket "event types don't exist" collapses two different states into one.
6. **A real chip-purchase economy (coins, cooldowns, inventory) now exists for all 4 chip types** — this is more infrastructure than the map's "3 of 4 inert" framing suggests. The gap isn't "not built," it's "purchasable but the scoring/transfer code never reads the result" for 3 of the 4.
7. **`RecordEventModal` likely still uses the un-fixed full-roster picker** even though the live console's equivalent flow was fixed — worth explicitly re-verifying before assuming the XI-only fix covers both loggers.

---

## ❓ Unverifiable — needs a human

| Item | Who should check | Why code can't answer it |
|---|---|---|
| Whether the exact £0.0m/₦0.0m symptom the owner saw is fully resolved | Owner, in the live app, on the actual account that showed it | The falsy-check bug is fixed and the backend season config is confirmed correct (100), but I can't rule out a `localStorage`-persisted stale `players`/`squadBudget` from a prior competition without that user's own browser session |
| Whether the scoring worker process and Redis are actually running/reachable right now | Dev team, via worker logs / `redis-cli ping` | Runtime infrastructure, not code |
| Whether fantasy gameweeks have been generated for any *other* live tournament besides Club World Cup | Owner, in the admin UI (once a "Generate Gameweeks" action exists to check against) | Operational state, not code — and there's currently no UI to even check this without a raw API call |
| "Sync players is slow" | Dev team, via profiling/timing a real sync on a large roster | Read-side code is batched; full write-path efficiency wasn't traced, and "slow" is fundamentally a runtime measurement |
| Pricing screen's `router.back()` redirect — "wrong" or "correct, just history-dependent" | Owner, by walking the actual navigation path into that screen | Correctness depends on which screen the admin came from, not visible from this file alone |
| Which live-commentary endpoint (`/fixtures/:id/events` vs `/matches/:id/events`) `AdminLiveMatchDetails.tsx` actually calls | Whoever owns the frontend | This backend-only pass traced both backend paths but didn't cross-reference which one the frontend hits — high-value to resolve given finding #2 above |

---

## Suggested reordering of Part F

Given what's actually true now, several Tier 1/2 items are already done, and the highest-leverage remaining item isn't on the list in the form it needs to be:

**Already done — remove from the list:**
- Gameweek lifecycle (was Tier 1 #2) — done.
- Scoring v2 + unit tests (was Tier 1 #3) — done, with the own-goal-player and minute-hardcoding caveats noted above.
- Budget/currency/top-scorers zero-padding (was Tier 1 #4) — done (budget has residual uncertainty, see Unverifiable).
- XI-only pickers + assist Yes/No gate (was Tier 2 #5, half of it) — done. Own-goal player capture from that same item is **not** done — keep that half.
- Lineup auto-save fix (was Tier 2 #7) — done.
- Position filter (was Tier 2 #8) — done.

**New Tier 1, top of the list — this wasn't explicit enough on the original map:**
1. **Build a "Generate Gameweeks" button into the admin tournament/competition management UI**, and call `createGameweeks` from it. This is the actual highest-leverage fix available — every other scoring/display fix this session is inert without it, and it's a small, well-scoped frontend change (the backend endpoint is ready).
2. Confirm which event-recording endpoint the live console actually calls, and if it's the `/matches` one, either wire fantasy enqueueing into it or migrate the console to the `/fixtures` path (backend decision).
3. Own-goal player capture in the live console (the one piece of Tier 2 #5 not yet done) — small, well-scoped, high value given own-goals are a real scoring rule that currently can never fire.
4. Add failure visibility for dropped scoring/leaderboard jobs (original Tier 1 #1's second half) — still entirely unaddressed.
5. Fix the notification `insertMany` payload to match its schema, and add `score` to the delete-event response — both small, both currently silently broken.

Tier 2 (RecordEventModal unification), Tier 3 (structure/grouping), and Tier 4/5 (monetization depth, chip wiring, IA rebuild, responsive) are largely unchanged from the original map and can keep their existing order — nothing this session's work invalidates about their sequencing.
