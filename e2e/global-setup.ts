/**
 * Seeds the e2e database through the real API (never the DB directly):
 * an org owner, a viewer collaborator, a fan, and a published league with two
 * teams, generated fixtures and fantasy enabled. Ids and credentials go to
 * e2e/.state.json for the specs.
 */
import fs from 'fs'
import path from 'path'

export const API = 'http://127.0.0.1:4100'
export const STATE_FILE = path.join(__dirname, '.state.json')
export const PASSWORD = 'Password123!'

const LOCAL = new Set(['127.0.0.1', 'localhost'])

async function call(method: string, p: string, token?: string | null, body?: unknown) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json: any = null
  try { json = text ? JSON.parse(text) : null } catch { json = text }
  if (res.status >= 300) throw new Error(`${method} ${p} → ${res.status}: ${text.slice(0, 400)}`)
  return json
}

async function user(tag: string, run: string, lastRole: 'personal' | 'organization') {
  const email = `${tag}.${run}@example.com`
  await call('POST', '/auth/register', null, { email, password: PASSWORD, lastRole, isOrgActive: lastRole === 'organization' })
  const login = await call('POST', '/auth/login', null, { email, password: PASSWORD })
  return { email, password: PASSWORD, token: login.accessToken as string, userId: String(login.user.id) }
}

const POSITIONS = ['GK', 'GK', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD']

export default async function globalSetup() {
  if (!LOCAL.has(new URL(API).hostname)) throw new Error(`E2E SAFETY ABORT: API is not local (${API})`)

  const run = Date.now().toString(36)
  const owner = await user('uiowner', run, 'organization')
  const viewer = await user('uiviewer', run, 'organization')
  const fan = await user('uifan', run, 'personal')

  const orgRes = await call('POST', '/orgs', owner.token, { name: `UI Test FC ${run}`, handle: `ui_org_${run}` })
  const org = orgRes.org ?? orgRes
  await call('POST', `/orgs/${org._id}/members`, owner.token, { userId: viewer.userId, role: 'viewer' })

  const compRes = await call('POST', `/orgs/${org._id}/competitions`, owner.token, {
    name: `UI League ${run}`, sport: 'football', gender: 'mixed',
    startDate: new Date(Date.now() - 86400e3).toISOString(),
    endDate: new Date(Date.now() + 60 * 86400e3).toISOString(),
    format: 'round_robin', stages: [{ type: 'league' }],
  })
  const comp = compRes.competition ?? compRes

  const teams: any[] = []
  for (const [i, name] of ['Lagos Lions', 'Abuja Eagles'].entries()) {
    const t = await call('POST', `/orgs/${org._id}/teams`, owner.token, {
      name: `${name} ${run}`, shortName: name.slice(0, 3).toUpperCase(), handle: `ui-${i}-${run}`, sport: 'football',
      jersey: { primaryColor: i ? '#1D4ED8' : '#DC2626', secondaryColor: '#FFFFFF', jerseyPattern: 'solid' },
    })
    const team = t.team ?? t
    team.players = []
    for (const [p, position] of POSITIONS.entries()) {
      const pr = await call('POST', `/teams/${team._id}/players`, owner.token, { firstName: `${name.split(' ')[0]}${p + 1}`, lastName: 'Player', position, jerseyNumber: p + 1 })
      const pl = pr.player ?? pr
      team.players.push({ id: String(pl.playerId?._id ?? pl.playerId ?? pl._id), name: `${name.split(' ')[0]}${p + 1} Player`, position })
    }
    teams.push(team)
  }
  await call('POST', `/competitions/${comp._id}/teams`, owner.token, { teams: teams.map((t) => ({ teamId: t._id })) })
  const published = await call('POST', `/competitions/${comp._id}/publish`, owner.token)
  const pub = published.competition ?? published
  await call('POST', `/competitions/${comp._id}/fixtures/generate`, owner.token, {
    type: 'round_robin', startDate: new Date(Date.now() + 2 * 86400e3).toISOString(), kickoffTime: '15:00',
  })
  // A second, extra fixture for the live-match mirror test (kicks off in the test)
  const extra = await call('POST', `/competitions/${comp._id}/fixtures`, owner.token, {
    homeTeamId: teams[0]._id, awayTeamId: teams[1]._id, kickoffAt: new Date(Date.now() + 3600e3).toISOString(), stageType: 'league',
  })
  const liveFixture = extra.fixture ?? extra

  const code = pub.joinCode ?? pub.code ?? pub.inviteCode
  await call('POST', '/competitions/join', fan.token, { code })

  const state = {
    run, api: API, owner, viewer, fan,
    org: { id: String(org._id), name: org.name, handle: org.handle },
    comp: { id: String(comp._id), name: comp.name, slug: pub.slug ?? comp.slug, code },
    teams: teams.map((t) => ({ id: String(t._id), name: t.name, handle: t.handle, players: t.players })),
    liveFixtureId: String(liveFixture._id),
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}
