/**
 * qa-update-rosters.js
 *
 * Replaces the 8 mock rosters in the existing "PHASE1 TEST CUP" tournament
 * with real player data, then re-syncs and re-prices fantasy.
 *
 * This script does NOT perform login itself. Supply an already-obtained
 * bearer token via GAFFER_TOKEN so no password ever passes through this
 * file or its output. To get a token: log in via the app UI, then read the
 * `gaffer-auth-token` cookie from devtools (Application tab) and export it:
 *
 *   GAFFER_TOKEN=<token> COMPETITION_ID=<id> node qa-update-rosters.js
 *
 * Requires Node 18+ (built-in fetch).
 */

const BASE = process.env.GAFFER_API_BASE || 'http://localhost:4000';
const TOKEN = process.env.GAFFER_TOKEN;
const COMPETITION_ID = process.env.COMPETITION_ID || '6a5a406a7956b31de15f26e7';

if (!TOKEN) {
  console.error('Missing GAFFER_TOKEN env var. See header comment for how to obtain one.');
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + TOKEN,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, data };
}

function unwrap(d) { return d && d.data !== undefined ? d.data : d; }

const REAL_DATA = {
  'Manchester City': [
    { name: 'Ederson', pos: 'GK', price: 5.5 }, { name: 'Ortega', pos: 'GK', price: 4.0 }, { name: 'Carson', pos: 'GK', price: 4.0 },
    { name: 'Walker', pos: 'DEF', price: 5.5 }, { name: 'Dias', pos: 'DEF', price: 5.5 }, { name: 'Ake', pos: 'DEF', price: 5.0 }, { name: 'Akanji', pos: 'DEF', price: 5.0 }, { name: 'Gvardiol', pos: 'DEF', price: 5.0 }, { name: 'Stones', pos: 'DEF', price: 5.5 }, { name: 'Lewis', pos: 'DEF', price: 4.5 }, { name: 'Gomez', pos: 'DEF', price: 4.0 },
    { name: 'De Bruyne', pos: 'MID', price: 10.5 }, { name: 'Rodri', pos: 'MID', price: 5.5 }, { name: 'Silva', pos: 'MID', price: 6.5 }, { name: 'Foden', pos: 'MID', price: 8.0 }, { name: 'Grealish', pos: 'MID', price: 7.5 }, { name: 'Doku', pos: 'MID', price: 6.5 }, { name: 'Kovacic', pos: 'MID', price: 5.0 }, { name: 'Nunes', pos: 'MID', price: 5.0 }, { name: 'Bobb', pos: 'MID', price: 4.5 },
    { name: 'Haaland', pos: 'FWD', price: 14.0 }, { name: 'Alvarez', pos: 'FWD', price: 7.0 }, { name: 'Mubama', pos: 'FWD', price: 4.5 }, { name: 'Wright', pos: 'FWD', price: 4.5 }, { name: 'Dickson', pos: 'FWD', price: 4.5 },
  ],
  Arsenal: [
    { name: 'Raya', pos: 'GK', price: 5.0 }, { name: 'Ramsdale', pos: 'GK', price: 4.5 }, { name: 'Hein', pos: 'GK', price: 4.0 },
    { name: 'White', pos: 'DEF', price: 5.5 }, { name: 'Saliba', pos: 'DEF', price: 5.5 }, { name: 'Gabriel', pos: 'DEF', price: 5.0 }, { name: 'Zinchenko', pos: 'DEF', price: 5.0 }, { name: 'Kiwior', pos: 'DEF', price: 4.5 }, { name: 'Tomiyasu', pos: 'DEF', price: 4.5 }, { name: 'Timber', pos: 'DEF', price: 5.0 }, { name: 'Walters', pos: 'DEF', price: 4.0 },
    { name: 'Saka', pos: 'MID', price: 9.0 }, { name: 'Odegaard', pos: 'MID', price: 8.5 }, { name: 'Rice', pos: 'MID', price: 5.5 }, { name: 'Martinelli', pos: 'MID', price: 8.0 }, { name: 'Trossard', pos: 'MID', price: 6.5 }, { name: 'Partey', pos: 'MID', price: 5.0 }, { name: 'Jorginho', pos: 'MID', price: 5.0 }, { name: 'Smith Rowe', pos: 'MID', price: 5.5 }, { name: 'Vieira', pos: 'MID', price: 5.5 }, { name: 'Elneny', pos: 'MID', price: 4.5 },
    { name: 'Jesus', pos: 'FWD', price: 8.0 }, { name: 'Nketiah', pos: 'FWD', price: 5.5 }, { name: 'Nelson', pos: 'FWD', price: 5.0 }, { name: 'Biereth', pos: 'FWD', price: 4.5 },
  ],
  Liverpool: [
    { name: 'Alisson', pos: 'GK', price: 5.5 }, { name: 'Kelleher', pos: 'GK', price: 4.0 }, { name: 'Adrian', pos: 'GK', price: 4.0 },
    { name: 'Alexander-Arnold', pos: 'DEF', price: 7.0 }, { name: 'Van Dijk', pos: 'DEF', price: 6.0 }, { name: 'Robertson', pos: 'DEF', price: 6.5 }, { name: 'Konate', pos: 'DEF', price: 5.0 }, { name: 'Gomez', pos: 'DEF', price: 4.5 }, { name: 'Bradley', pos: 'DEF', price: 4.5 }, { name: 'Tsimikas', pos: 'DEF', price: 4.5 }, { name: 'Quansah', pos: 'DEF', price: 4.0 },
    { name: 'Salah', pos: 'MID', price: 13.0 }, { name: 'Mac Allister', pos: 'MID', price: 6.0 }, { name: 'Szoboszlai', pos: 'MID', price: 7.0 }, { name: 'Diaz', pos: 'MID', price: 7.5 }, { name: 'Jota', pos: 'MID', price: 8.0 }, { name: 'Elliott', pos: 'MID', price: 5.0 }, { name: 'Jones', pos: 'MID', price: 5.5 }, { name: 'Endo', pos: 'MID', price: 5.0 }, { name: 'Gravenberch', pos: 'MID', price: 5.0 }, { name: 'Bajcetic', pos: 'MID', price: 4.5 },
    { name: 'Nunez', pos: 'FWD', price: 7.5 }, { name: 'Gakpo', pos: 'FWD', price: 7.5 }, { name: 'Danns', pos: 'FWD', price: 4.5 }, { name: 'Gordon', pos: 'FWD', price: 4.5 },
  ],
  'Manchester United': [
    { name: 'Onana', pos: 'GK', price: 5.0 }, { name: 'Bayindir', pos: 'GK', price: 4.0 }, { name: 'Heaton', pos: 'GK', price: 4.0 },
    { name: 'Dalot', pos: 'DEF', price: 5.0 }, { name: 'Varane', pos: 'DEF', price: 5.0 }, { name: 'Martinez', pos: 'DEF', price: 5.0 }, { name: 'Shaw', pos: 'DEF', price: 5.0 }, { name: 'Maguire', pos: 'DEF', price: 4.5 }, { name: 'Lindelof', pos: 'DEF', price: 4.5 }, { name: 'Wan-Bissaka', pos: 'DEF', price: 4.5 }, { name: 'Evans', pos: 'DEF', price: 4.0 }, { name: 'Malacia', pos: 'DEF', price: 4.5 },
    { name: 'Fernandes', pos: 'MID', price: 8.5 }, { name: 'Rashford', pos: 'MID', price: 9.0 }, { name: 'Garnacho', pos: 'MID', price: 5.0 }, { name: 'Casemiro', pos: 'MID', price: 5.5 }, { name: 'Mainoo', pos: 'MID', price: 4.5 }, { name: 'Mount', pos: 'MID', price: 7.0 }, { name: 'Eriksen', pos: 'MID', price: 6.0 }, { name: 'McTominay', pos: 'MID', price: 4.5 }, { name: 'Antony', pos: 'MID', price: 7.0 }, { name: 'Amad', pos: 'MID', price: 4.5 },
    { name: 'Hojlund', pos: 'FWD', price: 7.0 }, { name: 'Martial', pos: 'FWD', price: 6.5 }, { name: 'Forson', pos: 'FWD', price: 4.5 },
  ],
  Chelsea: [
    { name: 'Sanchez', pos: 'GK', price: 4.5 }, { name: 'Petrovic', pos: 'GK', price: 4.5 }, { name: 'Bettinelli', pos: 'GK', price: 4.0 },
    { name: 'James', pos: 'DEF', price: 5.5 }, { name: 'Silva', pos: 'DEF', price: 5.0 }, { name: 'Chilwell', pos: 'DEF', price: 5.5 }, { name: 'Colwill', pos: 'DEF', price: 4.5 }, { name: 'Disasi', pos: 'DEF', price: 5.0 }, { name: 'Cucurella', pos: 'DEF', price: 5.0 }, { name: 'Gusto', pos: 'DEF', price: 4.5 }, { name: 'Badiashile', pos: 'DEF', price: 4.5 }, { name: 'Chalobah', pos: 'DEF', price: 4.5 },
    { name: 'Palmer', pos: 'MID', price: 6.0 }, { name: 'Fernandez', pos: 'MID', price: 5.0 }, { name: 'Caicedo', pos: 'MID', price: 5.0 }, { name: 'Sterling', pos: 'MID', price: 7.0 }, { name: 'Gallagher', pos: 'MID', price: 5.5 }, { name: 'Mudryk', pos: 'MID', price: 6.5 }, { name: 'Madueke', pos: 'MID', price: 5.5 }, { name: 'Lavia', pos: 'MID', price: 5.0 }, { name: 'Nkunku', pos: 'MID', price: 7.5 }, { name: 'Chukwuemeka', pos: 'MID', price: 4.5 },
    { name: 'Jackson', pos: 'FWD', price: 7.0 }, { name: 'Broja', pos: 'FWD', price: 5.0 }, { name: 'Washington', pos: 'FWD', price: 4.5 },
  ],
  'Tottenham Hotspur': [
    { name: 'Vicario', pos: 'GK', price: 5.0 }, { name: 'Forster', pos: 'GK', price: 4.0 }, { name: 'Austin', pos: 'GK', price: 4.0 },
    { name: 'Porro', pos: 'DEF', price: 5.0 }, { name: 'Romero', pos: 'DEF', price: 5.0 }, { name: 'Van de Ven', pos: 'DEF', price: 4.5 }, { name: 'Udogie', pos: 'DEF', price: 4.5 }, { name: 'Dragusin', pos: 'DEF', price: 4.5 }, { name: 'Emerson', pos: 'DEF', price: 4.5 }, { name: 'Davies', pos: 'DEF', price: 4.5 }, { name: 'Sessegnon', pos: 'DEF', price: 4.0 },
    { name: 'Son', pos: 'MID', price: 9.0 }, { name: 'Maddison', pos: 'MID', price: 8.0 }, { name: 'Kulusevski', pos: 'MID', price: 7.0 }, { name: 'Johnson', pos: 'MID', price: 6.0 }, { name: 'Sarr', pos: 'MID', price: 4.5 }, { name: 'Bissouma', pos: 'MID', price: 5.0 }, { name: 'Bentancur', pos: 'MID', price: 5.5 }, { name: 'Hojbjerg', pos: 'MID', price: 5.5 }, { name: 'Lo Celso', pos: 'MID', price: 5.5 }, { name: 'Skipp', pos: 'MID', price: 4.5 },
    { name: 'Richarlison', pos: 'FWD', price: 7.0 }, { name: 'Werner', pos: 'FWD', price: 6.5 }, { name: 'Scarlett', pos: 'FWD', price: 4.5 }, { name: 'Veliz', pos: 'FWD', price: 4.5 },
  ],
  'Aston Villa': [
    { name: 'Martinez', pos: 'GK', price: 5.0 }, { name: 'Olsen', pos: 'GK', price: 4.0 }, { name: 'Gauci', pos: 'GK', price: 4.0 },
    { name: 'Cash', pos: 'DEF', price: 4.5 }, { name: 'Torres', pos: 'DEF', price: 4.5 }, { name: 'Konsa', pos: 'DEF', price: 4.5 }, { name: 'Moreno', pos: 'DEF', price: 5.0 }, { name: 'Digne', pos: 'DEF', price: 4.5 }, { name: 'Carlos', pos: 'DEF', price: 4.5 }, { name: 'Lenglet', pos: 'DEF', price: 4.5 }, { name: 'Chambers', pos: 'DEF', price: 4.0 },
    { name: 'Luiz', pos: 'MID', price: 5.5 }, { name: 'McGinn', pos: 'MID', price: 5.5 }, { name: 'Bailey', pos: 'MID', price: 5.5 }, { name: 'Diaby', pos: 'MID', price: 6.5 }, { name: 'Tielemans', pos: 'MID', price: 5.5 }, { name: 'Ramsey', pos: 'MID', price: 6.0 }, { name: 'Kamara', pos: 'MID', price: 5.0 }, { name: 'Zaniolo', pos: 'MID', price: 5.5 }, { name: 'Rogers', pos: 'MID', price: 5.0 }, { name: 'Iroegbunam', pos: 'MID', price: 4.5 },
    { name: 'Watkins', pos: 'FWD', price: 8.0 }, { name: 'Duran', pos: 'FWD', price: 5.0 }, { name: 'Kellyman', pos: 'FWD', price: 4.5 }, { name: 'Young', pos: 'FWD', price: 4.5 },
  ],
  Everton: [
    { name: 'Pickford', pos: 'GK', price: 4.5 }, { name: 'Virginia', pos: 'GK', price: 4.0 }, { name: 'Lonergan', pos: 'GK', price: 4.0 },
    { name: 'Tarkowski', pos: 'DEF', price: 4.5 }, { name: 'Branthwaite', pos: 'DEF', price: 4.0 }, { name: 'Mykolenko', pos: 'DEF', price: 4.5 }, { name: 'Patterson', pos: 'DEF', price: 4.5 }, { name: 'Coleman', pos: 'DEF', price: 4.5 }, { name: 'Young', pos: 'DEF', price: 4.5 }, { name: 'Godfrey', pos: 'DEF', price: 4.5 }, { name: 'Keane', pos: 'DEF', price: 4.5 },
    { name: 'Doucoure', pos: 'MID', price: 5.5 }, { name: 'McNeil', pos: 'MID', price: 5.5 }, { name: 'Harrison', pos: 'MID', price: 5.5 }, { name: 'Garner', pos: 'MID', price: 5.0 }, { name: 'Onana', pos: 'MID', price: 5.0 }, { name: 'Gueye', pos: 'MID', price: 5.0 }, { name: 'Danjuma', pos: 'MID', price: 5.5 }, { name: 'Gomes', pos: 'MID', price: 5.0 }, { name: 'Dobbin', pos: 'MID', price: 4.5 }, { name: 'Warrington', pos: 'MID', price: 4.5 },
    { name: 'Calvert-Lewin', pos: 'FWD', price: 6.0 }, { name: 'Beto', pos: 'FWD', price: 6.0 }, { name: 'Chermiti', pos: 'FWD', price: 5.0 }, { name: 'Hunt', pos: 'FWD', price: 4.5 },
  ],
};

function matchTeamKey(teamName) {
  const keys = Object.keys(REAL_DATA);
  for (const k of keys) {
    const kl = k.toLowerCase(), t = teamName.toLowerCase();
    if (kl === t || kl.startsWith(t) || t.startsWith(kl)) return k;
  }
  return null;
}
function splitName(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
function posWord(pos) {
  return { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' }[pos] || pos;
}
function tierForPrice(price) {
  if (price >= 9.5) return 'marquee';
  if (price >= 6.5) return 'elite';
  if (price >= 4.5) return 'standard';
  return 'budget';
}

async function main() {
  const report = { teamResults: [], pricingResults: [] };

  const teamsRes = await api('GET', `/competitions/${COMPETITION_ID}/teams`);
  if (!teamsRes.ok) throw new Error('list teams failed: ' + JSON.stringify(teamsRes));
  const teams = teamsRes.data.teams || teamsRes.data;

  for (const team of teams) {
    const teamId = team.teamId || team._id;
    const teamName = team.name;
    const dataKey = matchTeamKey(teamName);
    const teamReport = { teamName, teamId, matchedKey: dataKey, removed: 0, added: 0 };
    if (!dataKey) { teamReport.error = 'no matching key'; report.teamResults.push(teamReport); continue; }

    const playersRes = await api('GET', `/teams/${teamId}/players`);
    const currentPlayers = (playersRes.data && (playersRes.data.players || playersRes.data)) || [];
    for (const p of currentPlayers) {
      const pid = (p.playerId && p.playerId._id) ? p.playerId._id : (p.playerId || p._id);
      const r = await api('DELETE', `/teams/${teamId}/players/${pid}`);
      if (r.ok) teamReport.removed++;
    }

    await api('PATCH', `/teams/${teamId}`, { logoUrl: `https://placehold.co/200x200?text=${encodeURIComponent(teamName)}` });

    const players = REAL_DATA[dataKey];
    for (let i = 0; i < players.length; i++) {
      const nm = splitName(players[i].name);
      const r = await api('POST', `/teams/${teamId}/players`, {
        firstName: nm.firstName, lastName: nm.lastName,
        position: posWord(players[i].pos), jerseyNumber: i + 1, nationality: 'Unknown',
      });
      if (r.ok) teamReport.added++;
    }
    report.teamResults.push(teamReport);
  }

  await api('POST', `/fantasy/${COMPETITION_ID}/players/sync`, {});

  for (const tr of report.teamResults) {
    if (!tr.matchedKey) continue;
    const listRes = await api('GET', `/fantasy/${COMPETITION_ID}/pricing/teams/${tr.teamId}/players`);
    const payload = unwrap(listRes.data);
    const fps = payload.players || payload;

    const rosterRes = await api('GET', `/teams/${tr.teamId}/players`);
    const roster = (rosterRes.data && (rosterRes.data.players || rosterRes.data)) || [];
    const jerseyToPlayerId = {};
    for (const rp of roster) {
      const pid = (rp.playerId && rp.playerId._id) ? rp.playerId._id : (rp.playerId || rp._id);
      jerseyToPlayerId[rp.jerseyNumber] = pid;
    }
    const playerIdToFp = {};
    for (const fp of fps) {
      const pid = (fp.playerId && fp.playerId._id) ? fp.playerId._id : fp.playerId;
      playerIdToFp[pid] = fp;
    }

    const jsonPlayers = REAL_DATA[tr.matchedKey];
    let priced = 0, failed = 0;
    for (let i = 0; i < jsonPlayers.length; i++) {
      const pid = jerseyToPlayerId[i + 1];
      const fp = pid && playerIdToFp[pid];
      if (!fp) { failed++; continue; }
      const r = await api('PUT', `/fantasy/${COMPETITION_ID}/pricing/teams/${tr.teamId}/players/${fp._id}`, {
        tier: tierForPrice(jsonPlayers[i].price), price: jsonPlayers[i].price,
      });
      if (r.ok) priced++; else failed++;
    }
    report.pricingResults.push({ team: tr.teamName, priced, failed });
  }

  const finalizeRes = await api('POST', `/fantasy/${COMPETITION_ID}/pricing/finalize`);
  report.finalizeAttempt = { ok: finalizeRes.ok, status: finalizeRes.status, body: finalizeRes.data };

  for (const tr of report.teamResults) {
    if (!tr.matchedKey) continue;
    await api('POST', `/fantasy/${COMPETITION_ID}/pricing/teams/${tr.teamId}/finalize`);
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
