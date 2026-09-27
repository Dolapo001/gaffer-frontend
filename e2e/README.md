# UI end-to-end tests (Playwright)

Mobile-viewport browser tests against a fully local stack. Nothing touches Atlas, Upstash, the production API, or any real email or payment service.

## Run

1. Start the local MongoDB (see `../../.devdb/README.md`). Redis for the tests starts by itself on port 6380.
2. `npm run test:e2e` in `gaffer-frontend`.

Playwright starts both servers itself:

| Server | Port | What |
|---|---|---|
| Backend | 4100 | `The-Gaffer--backend/__tests__/admin-e2e/playwright-server.js`. Forces the database `gaffer_admin_e2e` (dropped on start), stubs email, Cloudinary, Paystack, web-push and Google, and blocks outbound network |
| Frontend | 3100 | `next dev` with `NEXT_PUBLIC_API_URL=http://127.0.0.1:4100` (your `.env.local` is not used for the API) |

Close any dev server already on 3100 or 4100 first.

`e2e/global-setup.ts` seeds an org owner, a viewer collaborator, a fan and a published two-team league through the real API. It writes the ids to `e2e/.state.json`.

## Specs

| File | Covers |
|---|---|
| `admin-screens.spec.ts` | Login, then every admin screen loads with no crash, console error or backend 5xx (players and tournaments must show seeded data) |
| `mirror.spec.ts` | Admin posts news, the fan sees it, and deleting uses the ConfirmDialog. A goal logged by the admin reaches the fan's match page with no reload, and deleting it reverts the score. A viewer sees no manager-only buttons |
| `user-journeys.spec.ts` | Sign-up (valid and mismatched passwords), a wrong password, joining a league by code and viewing the league, table and a match, and a wrong join code |

Projects: `iphone-13` and `pixel-7` viewports, both on Chromium.

The fixture in `fixtures.ts` aborts every request to a non-local host. Google Fonts, Google sign-in and dicebear avatars are simply not loaded. A test fails if any request targets a non-local API host or if the backend returns a 5xx.

Failure screenshots and traces go to `e2e/results/`, which is gitignored. Open a trace with `npx playwright show-trace <trace.zip>`.
