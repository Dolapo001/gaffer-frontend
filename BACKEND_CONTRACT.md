# Gaffer — Backend API Contract

**Status:** Living document — updated as frontend phases ship  
**Audience:** Backend team (Node/Express + MongoDB service at api.the-gaffer.com.ng)  
**Frontend repo:** gaffer-frontend (Next.js 14 PWA)  
**Last updated:** Phase C (C1 + C2) — July 2026

---

## Context

The frontend intentionally does **not** enforce money-adjacent or competition-integrity rules client-side (they would be easy to bypass). This document specifies exactly what new backend fields and endpoints are needed so the frontend can progressively-enhance as the backend ships them. All items below are feature-detected: the frontend reads the field defensively, falls back to today's behaviour when absent, and unlocks the enhanced UX when the field is present.

---

## §1 — Authoritative Team-Elimination & `teamsRemaining`

### Problem

`TournamentBracket.tsx` currently derives `teamsRemaining` client-side from completed fixture scores (home > away → away eliminated). This is informational only. It breaks for:
- Draws decided by extra-time or penalties (no score delta in completed fixture)
- Group→knockout stage transitions (teams eliminated from groups don't appear in knockout fixture data)
- Walkovers and forfeits

### Requirement

Add an `eliminated` boolean field to the competition-teams collection:

```
PATCH /competitions/:competitionId/teams/:teamId
Body: { "eliminated": true }
```

Return `eliminated` in `GET /competitions/:competitionId/teams`:
```json
{
  "teams": [
    {
      "_id": "...",
      "teamId": "...",
      "name": "...",
      "eliminated": false,   ← NEW
      ...
    }
  ]
}
```

**Frontend consumption:**
```ts
// TournamentBracket.tsx — switch from derived count to authoritative count
const teamsRemaining = (compTeams ?? []).filter(t => !t.eliminated).length
```

The `~` prefix and `title` disclaimer will be removed once this field is present.

**Also needed for:** The rising per-team transfer cap formula (§3).

---

## §2 — Transfer Economy: `freeTransfersRemaining` + `transferCostMode`

### Current state

`FantasyTeam` already has optional fields `freeTransfersRemaining` and `transferCostMode` defined in the frontend type (`lib/services/fantasy.service.ts`). The transfers UI reads them defensively — when absent it falls back to the current points-hit model unchanged.

### Requirement

Populate these fields on `GET /fantasy/:id/team/me` and `GET /fantasy/:id/teams`:

```json
{
  "team": {
    "_id": "...",
    "freeTransfersRemaining": 1,        ← NEW — integer ≥ 0
    "transferCostMode": "coins",         ← NEW — "points" | "coins"
    ...
  }
}
```

**Free-reset windows** (two per season, per spec):
1. **Initial squad build** — all transfers free until the first gameweek deadline.
2. **Group→knockout seam** — reset `freeTransfersRemaining` to 1 when the competition transitions from `groups` stage to `knockout` stage.

Business rule: each additional transfer beyond the free allowance costs **4 coins** (deducted server-side via the wallet — never enforced on the frontend).

### Transfer-preview endpoint (recommended)

```
GET /fantasy/:competitionId/team/transfer-preview
Query: playerInId=<fantasyPlayerId>&playerOutId=<fantasyPlayerId>
Response:
{
  "isFree": true,
  "coinCost": 0,
  "freeTransfersRemaining": 1,
  "freeTransfersAfter": 0
}
```

This lets the frontend show exact cost before confirming, without the user needing to commit. The existing `makeTransfer` endpoint enforces the actual deduction.

---

## §3 — Rising Per-Team Roster Cap

### Requirement

As teams are eliminated from the knockout bracket, the maximum number of players from any single remaining team that a fantasy manager can hold increases, using the formula:

```
maxPlayersPerTeam = max(3, ceil(11 / teamsRemaining) + 1)
```

This **must be enforced server-side** on `PUT /fantasy/:id/team` (setSquad) and `POST /fantasy/:id/transfers` (makeTransfer). The frontend cannot compute `teamsRemaining` authoritatively (§1).

**Frontend consumption (once §1 is shipped):**
```ts
// FantasyTeamScreen / TransferMarket — squad validation warning
const maxPerTeam = Math.max(3, Math.ceil(11 / teamsRemaining) + 1)
const teamCounts = countPlayersByTeam(squad)
const violations = teamCounts.filter(([_, n]) => n > maxPerTeam)
if (violations.length > 0) showWarning(`Max ${maxPerTeam} players from any team`)
```

Return a `squadCapViolation` error code (HTTP 422) when the server rejects a save, so the frontend can show a specific message rather than a generic API error.

---

## §4 — Server-Side Enforcement of Kickoff-Based Lineup Locking

### Current state (C2)

`FantasyTeamScreen` and `SubstitutionScreen` now compute `lockedPlayerIds` from `Fixture.kickoffAt` / `Fixture.status` and show a 🔒 overlay on locked players' cards. This is a **UX-only guard** — it is trivially bypassed by a direct API call.

### Requirement

`PUT /fantasy/:competitionId/team` (setSquad) must reject saves that move a locked player:

- A player is **locked** if their team's fixture satisfies:  
  `fixture.status !== 'scheduled'` OR `now >= fixture.kickoffAt`
- If any player in the submitted `startingXI` or `bench` arrays differs from the current lineup AND that player is locked, return HTTP 422:

```json
{
  "error": "LINEUP_LOCKED",
  "message": "Cannot change lineup for players whose fixture has started",
  "lockedPlayerIds": ["<fantasyPlayerId>", ...]
}
```

The frontend already handles `getErrorMessage(err)` → toast on mutation failure, so the error will surface automatically. The specific `LINEUP_LOCKED` code lets the frontend optionally show a richer message in future.

---

## §5 — `Round.stageType` on Fixture (Confirm Existing)

`Fixture.stageType` already exists and is populated server-side. **No new fields needed.** The `TournamentBracket` component filters on `stageType === 'knockout'` from the standard `GET /competitions/:id/fixtures` response.

**Confirm:** when a fixture is created via `POST /competitions/:competitionId/fixtures/generate` with `type: 'knockout'`, the resulting fixture documents must have `stageType: 'knockout'`. Please verify this is the case — the bracket will be empty otherwise.

---

## §6 — `Fixture.resolvedKits` (Existing — No Change)

Already populated by backend clash-detection. Frontend reads it where available. No changes needed.

---

## §7 — No `fantasyEnabled` Flag on Competition List Endpoints

### Problem

The new Fantasy tab's entry point (`app/app/fantasy/page.tsx`) is a picker showing only competitions that actually have a fantasy game running. Whether a competition has fantasy enabled lives entirely in a separate `FantasySeason` document (`GET /fantasy/:competitionId/season`, 404s via `FANTASY_SEASON_NOT_FOUND` when not enabled) — `Competition` itself carries no such flag.

### Current frontend workaround

`GET /competitions/joined` is called once, then `GET /fantasy/:id/season` is called **once per competition** in parallel (`useQueries`) to filter the list down to fantasy-enabled ones. Fine for a handful of joined competitions (today's seed data), but doesn't scale — a user joined to dozens of competitions means dozens of extra round trips just to render the picker.

### Requested change

Add a `fantasyEnabled: boolean` (or `hasFantasySeason`) field directly to the response of `GET /competitions/joined` and `GET /competitions/all`, computed server-side from the existence of a `FantasySeason` document for that competition. This removes the N+1 entirely.

---

## §9 — No Bulk Per-Round-Per-Player Points (blocks "Top players by round" / "Team of the Round")

### Problem

The Fantasy Home tab's IA calls for two round-scoped modules: a "Top players by round" list (round label · player · opponent · pts) and a "Team of the Round" (best fantasy XI for a specific round, shown on the pitch). Both need **every enrolled player's points for a specific gameweek, in one response.**

What exists today:
- `FantasyPlayer.totalPoints` — a **season** total per player (`GET /fantasy/:id/players`). Fine for a season-long leaderboard, useless for "this round's top performers."
- `GET /fantasy/:id/leaderboard/gameweek/:gameweekId` — per-**manager** totals for a round (ranks fantasy team owners, not football players).
- `GET /fantasy/:id/players/:fantasyPlayerId/history` — per-round points, but **one player at a time**. Building a round leaderboard from this would mean one request per enrolled player (30-700+ requests for the competitions already seeded in this environment) — not viable.

### Requested change

A bulk endpoint, e.g. `GET /fantasy/:competitionId/players/round-points?gameweekId=X` → `{ data: Array<{ fantasyPlayerId, totalPoints, goalsScored, assists, ... }> }`, mirroring the shape already returned by the single-player history endpoint but for every enrolled player in one call.

### Current frontend behavior

Both modules are **not built**. `FantasyHomeTab.tsx` only ships the season-long Top Players leaderboard (using the existing `totalPoints` field). No placeholder UI was added for the two skipped modules — add them once this endpoint exists.

---

## Summary Checklist

| # | Item | Priority | Needed by |
|---|------|----------|-----------|
| §1 | `eliminated` field on competition teams | **P0** | D1 / Transfer cap |
| §2 | `freeTransfersRemaining` + `transferCostMode` on FantasyTeam | **P1** | Transfer economy UI |
| §2 | `GET /fantasy/:id/team/transfer-preview` endpoint | **P2** | Transfer market polish |
| §3 | Server-side cap enforcement on setSquad + makeTransfer | **P1** | Fairness |
| §4 | `LINEUP_LOCKED` rejection on setSquad | **P1** | C2 integrity |
| §5 | Confirm `stageType` populated on generate-fixtures | **P0** | Bracket display |
| §7 | `fantasyEnabled` flag on competition list endpoints | **P2** | Fantasy picker perf |
| §9 | Bulk per-round-per-player points endpoint | **P2** | Home "Top players by round" / "Team of the Round" |
