/* routing.js — C++ backend only. Supports Dijkstra / BFS / Bellman-Ford selection */

const BACKEND = 'http://localhost:3000';

let facilities = JSON.parse(JSON.stringify(H_DATA));
let lastResult = null;

/* ── BACKEND STATUS ─────────────────────────────────────────── */
async function checkBackend() {
  const el = $('backendBadge');
  try {
    const r = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(1500) });
    await r.json();
    el.textContent = '🟢 C++ Backend Online';
    el.className   = 'backend-badge online';
  } catch(e) {
    el.textContent = '🔴 Backend Offline — run: node server.js';
    el.className   = 'backend-badge offline';
  }
}

/* ── MAIN ROUTING ───────────────────────────────────────────── */
async function runRouting(pLat, pLng, name, age, cond, uncon, bleeding) {
  const sev     = calcSeverity(age, cond, uncon, bleeding);
  const useDisp = needsDispensary(sev, cond);
  const needIcu = sev >= 3;

  // Get selected algorithm from UI
  const algoUsed = ($('algoSelect-center') || $('algoSelect-side'))?.value || 'Dijkstra';

  const payload = JSON.stringify({
    patient:   { name, age, condition: cond, lat: pLat, lng: pLng, unconscious: uncon, bleeding },
    hospitals: facilities,
    algo:      algoUsed,
  });

  let data;
  try {
    const r = await fetch(`${BACKEND}/route`, {
      method: 'POST', body: payload,
      headers: { 'Content-Type': 'application/json' },
    });
    data = await r.json();
  } catch(e) {
    alert('❌ C++ Backend offline!\n\ncd backend → node server.js');
    return null;
  }

  const { ranked, algoTimeMs, nodeCount, edgeCount, algoResults } = data;

  const eligibleRanked = ranked.filter(r => {
    const f = facilities.find(f => f.id === r.id);
    return r.eligible && (useDisp ? f?.type === 'dispensary' : f?.type === 'hospital');
  });

  if (!eligibleRanked.length) return null;

  const best = facilities.find(f => f.id === eligibleRanked[0].id);
  best.pts++;
  best.aDocs--;
  if (needIcu && best.type === 'hospital') best.icuOcc++;

  return { best, ranked, eligibleRanked, sev, name, age, cond, needIcu, useDisp, algoTimeMs, nodeCount, edgeCount, algoUsed, algoResults };
}
