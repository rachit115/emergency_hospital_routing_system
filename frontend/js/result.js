
let sortKey = 'score';
let sortAsc = true;

/* ── OPEN FULL RESULT SCREEN  WHEN RESULT IS AVAILABLE────────────────────────────────── */
function openResult() {
  if (!lastResult) return;
  const { best, ranked, eligibleRanked, sev, name, age, cond, estTime, needIcu, useDisp, algoTimeMs, nodeCount, edgeCount, algoUsed } = lastResult;

  $('rs-title').textContent = `${useDisp?'💊':'🚑'} ${name} → ${best.name}`;

  const load     = best.pts / best.cap;
  const loadPct  = (load * 100).toFixed(0);
  const barColor = load < 0.5 ? '#2ecc71' : load < 0.8 ? '#f39c12' : '#e74c3c';

  // Update Patient Details
  $('rs-card-patient').className = `result-screen-card ${useDisp ? 'disp-hl' : 'highlight'}`;
  $('rs-val-severity').innerHTML = `<span class="severity-badge s${sev}">${SEV_LABELS[sev]}</span>`;
  $('rs-val-type').textContent = useDisp ? '💊 Dispensary' : '🏥 Hospital';
  $('rs-val-icu-needed').textContent = needIcu ? '✅ Yes' : '❌ No';
  $('rs-val-algo').textContent = algoUsed;

  // Update Route
  $('rs-val-dist').textContent = eligibleRanked[0]?.dist.toFixed(1) || '—';
  $('rs-val-time').textContent = `~${estTime} min`;
  $('rs-val-route-type').textContent = sev === 4 ? '🚨 Emergency' : '🔵 Normal';

  // Update Hospital Details
  $('rs-val-hosp-title').textContent = useDisp ? '💊 Dispensary' : '🏥 Hospital';
  $('rs-val-hosp-name').textContent = best.name;
  $('rs-val-hosp-beds').textContent = `${best.pts}/${best.cap}`;
  
  const icuRow = $('rs-row-icu');
  if (best.type === 'hospital') {
    icuRow.style.display = 'flex';
    $('rs-val-hosp-icu').textContent = best.icu - best.icuOcc;
  } else {
    icuRow.style.display = 'none';
  }
  
  $('rs-val-hosp-score').textContent = eligibleRanked[0]?.score.toFixed(2);
  $('rs-val-load-pct').textContent = `${loadPct}%`;
  $('rs-val-load-bar').style.width = `${loadPct}%`;
  $('rs-val-load-bar').style.background = barColor;

  // Update Performance
  $('rs-val-perf-algo').textContent = algoUsed;
  $('rs-val-perf-time').textContent = `${algoTimeMs} ms`;
  $('rs-val-perf-nodes').textContent = nodeCount;
  $('rs-val-perf-edges').textContent = edgeCount;
  $('rs-val-perf-eligible').textContent = `${eligibleRanked.length} of ${ranked.length}`;

  // Why Section
  $('rs-why-text').innerHTML = `
    <b>Step 1 — Severity:</b> Scored <span class="severity-badge s${sev}">${SEV_LABELS[sev]}</span> (condition: ${cond}).<br>
    <b>Step 2 — Pool:</b> ${useDisp ? 'Minor → Dispensary.' : 'Hospital pool selected.'}<br>
    <b>Step 3 — ${algoUsed}:</b> ${eligibleRanked.length} facilities ranked in ${algoTimeMs} ms.<br>
    <b>Step 4 — Scoring:</b> <code>score = distance × (1 + load)</code>${sev === 4 ? ' + ICU bonus.' : '.'}<br>
    <b>Step 5 — Winner:</b> <b>${best.name}</b> — score: <b>${eligibleRanked[0]?.score.toFixed(2)}</b>.
  `;

  buildCompTable(ranked, sev, sortKey, sortAsc);
  buildComplexityTable(algoTimeMs, algoUsed);

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
  // Pure algorithm time estimates 
  const dijkstraMs  = (0.0009).toFixed(4);  
  const bfsMs       = (0.0003).toFixed(4);  
  const bellmanMs   = (0.0033).toFixed(4);  

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

  const html = `<div class="table-scroll"><table class="comp-table">
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

  $('complexityTableWrap').innerHTML = html;

}

function closeResult() { $('resultScreen').classList.remove('open'); }
