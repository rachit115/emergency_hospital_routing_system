/* result.js — Full Result Screen, Score Table, Complexity Table
   Rachit Singh */

let sortKey = 'score';
let sortAsc = true;

/* ── OPEN FULL RESULT SCREEN ────────────────────────────────── */
function openResult() {
  if (!lastResult) return;
  const { best, ranked, eligibleRanked, sev, name, age, cond, estTime, needIcu, useDisp, algoTimeMs, nodeCount, edgeCount, algoUsed } = lastResult;

  $('rs-title').textContent = `${useDisp?'💊':'🚑'} ${name} → ${best.name}`;

  const load     = best.pts / best.cap;
  const loadPct  = (load * 100).toFixed(0);
  const barColor = load < 0.5 ? '#2ecc71' : load < 0.8 ? '#f39c12' : '#e74c3c';

  $('rs-body').innerHTML = `

    <div class="result-screen-card ${useDisp?'disp-hl':'highlight'}">
      <div class="result-screen-card-title">🚑 Patient Details</div>
      <div class="result-screen-row"><span class="label-text">Severity</span><span class="value-text"><span class="severity-badge s${sev}">${SEV_LABELS[sev]}</span></span></div>
      <div class="result-screen-row"><span class="label-text">Facility Type</span><span class="value-text">${useDisp?'💊 Dispensary':'🏥 Hospital'}</span></div>
      <div class="result-screen-row"><span class="label-text">ICU Needed</span><span class="value-text">${needIcu?'✅ Yes':'❌ No'}</span></div>
      <div class="result-screen-row"><span class="label-text">Algorithm Used</span><span class="value-text"><b>${algoUsed}</b></span></div>
    </div>

    <div class="result-screen-card">
      <div class="result-screen-card-title">🛣️ Route</div>
      <div class="result-screen-big-text">${eligibleRanked[0]?.dist.toFixed(1)||'—'} <span style="font-size:1rem">km</span></div>
      <div class="result-screen-big-subtext">Best road distance (OSRM)</div>
      <div class="result-screen-row" style="margin-top:12px"><span class="label-text">Est. Time</span><span class="value-text">~${estTime} min</span></div>
      <div class="result-screen-row"><span class="label-text">Route Type</span><span class="value-text">${sev===4?'🚨 Emergency':'🔵 Normal'}</span></div>
    </div>

    <div class="result-screen-card">
      <div class="result-screen-card-title">${useDisp?'💊 Dispensary':'🏥 Hospital'}</div>
      <div class="result-screen-row"><span class="label-text">Name</span><span class="value-text">${best.name}</span></div>
      <div class="result-screen-row"><span class="label-text">Beds</span><span class="value-text">${best.pts}/${best.cap}</span></div>
      ${best.type==='hospital'?`<div class="result-screen-row"><span class="label-text">ICU Free</span><span class="value-text">${best.icu-best.icuOcc}</span></div>`:''}
      <div class="result-screen-row"><span class="label-text">Score</span><span class="value-text">${eligibleRanked[0]?.score.toFixed(2)}</span></div>
      <div class="result-screen-bar-wrap">
        <div class="result-screen-bar-label"><span>Load</span><span>${loadPct}%</span></div>
        <div class="result-screen-bar"><div class="result-screen-bar-fill" style="width:${loadPct}%;background:${barColor}"></div></div>
      </div>
      <button class="hm-btn-small" onclick="closeResult();openHospPanel()" style="margin-top:10px">🏥 Check-In Panel</button>
    </div>

    <div class="result-screen-card">
      <div class="result-screen-card-title">⚡ Algo Performance</div>
      <div class="result-screen-row"><span class="label-text">Algorithm</span><span class="value-text"><b>${algoUsed}</b></span></div>
      <div class="result-screen-row"><span class="label-text">Execution Time</span><span class="value-text">${algoTimeMs} ms</span></div>
      <div class="result-screen-row"><span class="label-text">Nodes (V)</span><span class="value-text">${nodeCount}</span></div>
      <div class="result-screen-row"><span class="label-text">Edges (E)</span><span class="value-text">${edgeCount}</span></div>
      <div class="result-screen-row"><span class="label-text">Eligible</span><span class="value-text">${eligibleRanked.length} of ${ranked.length}</span></div>
    </div>

    <div class="result-screen-card result-screen-full-width">
      <div class="result-screen-card-title">📊 All Hospitals — Comparison Table
        <span style="font-weight:400;font-size:0.72rem;color:#888;margin-left:8px">Click header to sort</span>
      </div>
      <div id="compTableWrap"></div>
    </div>

    <div class="result-screen-card result-screen-full-width">
      <div class="result-screen-card-title">⏱️ Time Complexity: Dijkstra vs BFS vs Bellman-Ford</div>
      ${buildComplexityTable(algoTimeMs, algoUsed)}
    </div>

    <div class="result-screen-card result-screen-full-width">
      <div class="result-screen-card-title">🔬 Why This Hospital Was Chosen</div>
      <p style="font-size:0.84rem;line-height:2;color:#444">
        <b>Step 1 — Severity:</b> Scored <span class="severity-badge s${sev}">${SEV_LABELS[sev]}</span> (condition: ${cond}).<br>
        <b>Step 2 — Pool:</b> ${useDisp?'Minor → Dispensary.':'Hospital pool selected.'}<br>
        <b>Step 3 — ${algoUsed}:</b> ${eligibleRanked.length} facilities ranked in ${algoTimeMs} ms.<br>
        <b>Step 4 — Scoring:</b> <code>score = distance × (1 + load)</code>${sev===4?' + ICU bonus.':'.'}<br>
        <b>Step 5 — Winner:</b> <b>${best.name}</b> — score: <b>${eligibleRanked[0]?.score.toFixed(2)}</b>.
      </p>
    </div>`;

  buildCompTable(ranked, sev, sortKey, sortAsc);
  $('resultScreen').classList.add('open');
}

/* ── SORTABLE TABLE ─────────────────────────────────────────── */
function buildCompTable(ranked, sev, key = 'score', asc = true) {
  const cols = [
    { key:'rank', label:'#' }, { key:'name', label:'Facility' },
    { key:'type', label:'Type' }, { key:'dist', label:'Dist' },
    { key:'score', label:'Score ↕' }, { key:'load', label:'Load%' },
    { key:'icuFree', label:'ICU' }, { key:'aDoc', label:'Drs' },
    { key:'rating', label:'⭐' }, { key:'elig', label:'OK?' },
  ];

  let rows = ranked.map((r, i) => {
    const f = facilities.find(f => f.id === r.id) || {};
    return { rank:i+1, id:r.id, name:f.name||'', type:f.type||'hospital',
             dist:r.dist, score:r.score>=1e8?999:r.score, load:r.load,
             icuFree:r.icuFree, aDoc:r.aDoc, rating:r.rating, elig:r.eligible };
  });

  rows.sort((a, b) => {
    let va = a[key], vb = b[key];
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    return asc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const headerRow = cols.map(c =>
    `<th onclick="sortTable('${c.key}')" style="cursor:pointer;white-space:nowrap">${c.label}${key===c.key?(asc?' ▲':' ▼'):''}</th>`
  ).join('');

  const bodyRows = rows.map(r => {
    const lc = r.load < 0.5 ? '#1e8449' : r.load < 0.8 ? '#d35400' : '#c0392b';
    return `<tr class="${r.rank===1&&r.elig?'best-row':''} ${!r.elig?'ineligible-row':''}">
      <td>${r.rank===1&&r.elig?'🥇':r.rank}</td>
      <td>${r.type==='dispensary'?'💊':'🏥'} ${r.name}</td>
      <td><span class="type-badge ${r.type}">${r.type}</span></td>
      <td>${r.dist.toFixed(1)} km</td>
      <td><b>${r.score>=999?'—':r.score.toFixed(2)}</b></td>
      <td style="color:${lc}"><b>${(r.load*100).toFixed(0)}%</b></td>
      <td>${r.icuFree>=0?r.icuFree:'N/A'}</td>
      <td>${r.aDoc}</td>
      <td>⭐${r.rating}</td>
      <td>${r.elig?'✅':'❌'}</td>
    </tr>`;
  }).join('');

  $('compTableWrap').innerHTML =
    `<div class="table-scroll"><table class="comp-table">
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table></div>
    <p style="font-size:0.74rem;color:#999;margin-top:8px">Score = dist × (1+load). ❌ = full/no doctors/no ICU.${sev===4?' ICU bonus for Critical.':''}</p>`;
}

function sortTable(key) {
  if (sortKey === key) sortAsc = !sortAsc;
  else { sortKey = key; sortAsc = true; }
  buildCompTable(lastResult.ranked, lastResult.sev, sortKey, sortAsc);
}

/* ── TIME COMPLEXITY TABLE ──────────────────────────────────── */
function buildComplexityTable(actualMs, algoUsed) {
  const V = 11, E = 20;
  // Pure algorithm time estimates (no OSRM/network time)
  const dijkstraMs  = (0.0009).toFixed(4);  // O((V+E)logV) on 11 nodes
  const bfsMs       = (0.0003).toFixed(4);  // O(V+E) — fastest raw
  const bellmanMs   = (0.0033).toFixed(4);  // O(V*E) = 220 ops

  const algos = [
    { name:'Dijkstra', used: algoUsed==='Dijkstra',     time:'O((V+E) log V)', space:'O(V+E)', negEdge:'❌ No',  best:'Non-negative weights ✅', ms: dijkstraMs },
    { name:'BFS',      used: algoUsed==='BFS',           time:'O(V + E)',       space:'O(V)',   negEdge:'❌ No',  best:'Unweighted graphs only',   ms: bfsMs },
    { name:'Bellman-Ford', used: algoUsed==='Bellman-Ford', time:'O(V × E)',   space:'O(V)',   negEdge:'✅ Yes', best:'Negative edge weights',    ms: bellmanMs },
  ];

  const minMs = Math.min(...algos.map(a => +a.ms));

  const rows = algos.map(a => {
    const isFastest = +a.ms === minMs;
    const isUsed    = a.used;
    // fastest gets green, used gets blue — both can coexist
    return `<tr class="${isUsed ? 'best-row' : ''} ${isFastest && !isUsed ? 'fastest-row' : ''}">
      <td><b>${a.name}</b>
        ${isUsed    ? '<span class="used-badge">Used ✅</span>'  : ''}
        ${isFastest ? '<span class="fast-badge">Fastest ⚡</span>' : ''}
      </td>
      <td><code>${a.time}</code></td>
      <td><code>${a.space}</code></td>
      <td>${a.negEdge}</td>
      <td>${a.best}</td>
      <td><b>${a.ms} ms</b></td>
    </tr>`;
  }).join('');

  return `<div class="table-scroll"><table class="comp-table">
    <thead><tr>
      <th>Algorithm</th><th>Time</th><th>Space</th>
      <th>Neg Edges</th><th>Best For</th><th>Est. Time (V=${V}, E=${E})</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
  <p style="font-size:0.78rem;color:#555;margin-top:10px;line-height:1.7">
    ⚡ <b>BFS is fastest</b> in raw time — but gives <b>wrong results</b> on weighted graphs (ignores distances).
    Bellman-Ford handles negative weights which road distances never have — unnecessary overhead.
    <b>Dijkstra</b> = correct shortest path + near-optimal speed for non-negative weighted graphs. Best choice here.
  </p>`;
}

function closeResult() { $('resultScreen').classList.remove('open'); }
