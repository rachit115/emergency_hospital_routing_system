/* ui.js  content — Sidebar, Emergency Mode, Algo Sync, Hospital Panel, Nominatim */

let panelState = { facility:null, selectedRoom:null, selectedDoc:null, budget:'', stars:0 };
let sugTimer = {};
let emergencyLocs = { center: {lat:null, lng:null}, side: {lat:null, lng:null} };

const $ = id => document.getElementById(id);
const v = id => document.getElementById(id)?.value.trim() || '';

/* ── SEVERITY BADGES ────────────────────────────────────────── */
function updSev(id) {
  const age = +v(`pAge-${id}`);
  const cond = v(`pCond-${id}`);
  const uncon = $(`pUncon-${id}`)?.checked || false;
  const bleed = $(`pBleed-${id}`)?.checked || false;
  
  const sev = calcSeverity(age, cond, uncon, bleed);
  setSevBadge(`sevBadge-${id}`, sev);
  setFacBadge(`facilityBadge-${id}`, sev, cond);
}

function setSevBadge(id, sev) {
  const el = $(id); if (!el) return;
  el.className = 'severity-badge severity-' + sev;
  el.textContent = 'Severity: ' + SEV_LABELS[sev];
}

function setFacBadge(id, sev, cond) {
  const el = $(id); if (!el) return;
  const disp = needsDispensary(sev, cond);
  el.className   = 'facility-badge ' + (disp ? 'dispensary' : 'hospital');
  el.textContent = disp ? '→ Dispensary' : '→ Hospital';
}

/* ── ALGO SELECTOR SYNC (center ↔ sidebar) ──────────────────── */
function syncAlgoSelect(id) {
  const val = $(`algoSelect-${id}`).value;
  const other = id === 'center' ? 'side' : 'center';
  if ($(`algoSelect-${other}`)) {
    $(`algoSelect-${other}`).value = val;
  }
}

/* ── EMERGENCY MODE ─────────────────────────────────────────── */
function toggleEmergencyMode(id) {
  const on = $(`emergencyMode-${id}`).checked;
  $(`normalFields-${id}`).style.display    = on ? 'none' : 'block';
  $(`emergencyFields-${id}`).style.display = on ? 'block' : 'none';
  if (on) getGPS(`emergencyGpsBox-${id}`, (lat, lng) => { 
    emergencyLocs[id].lat = lat; 
    emergencyLocs[id].lng = lng; 
  });
}

function getGPS(boxId, cb) {
  const box = $(boxId);
  if (!box) return;
  box.innerHTML = '<span>📡 Fetching GPS location...</span>';
  if (!navigator.geolocation) {
    box.innerHTML = '<span style="color:#e74c3c">❌ GPS not supported</span>';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(5);
      const lng = pos.coords.longitude.toFixed(5);
      box.innerHTML = `<span>✅ GPS: ${lat}, ${lng}</span>`;
      cb(+lat, +lng);
    },
    () => { box.innerHTML = '<span style="color:#e74c3c">❌ GPS access denied</span>'; }
  );
}

/* ── NOMINATIM ──────────────────────────────────────────────── */
function onLocInput(id) { 
  clearTimeout(sugTimer[id]);  
  const q = v(`locSearch-${id}`);  
  if (q.length < 3) { $(`suggestions-${id}`).innerHTML = ''; return; } 
  sugTimer[id] = setTimeout(() => fetchSug(q, `suggestions-${id}`, id), 400); 
}

function onLocKey(e, id) { 
  if (e.key === 'Enter') fetchSug(v(`locSearch-${id}`), `suggestions-${id}`, id); 
}

async function fetchSug(query, boxId, panelId) {
  if (!query || query.length < 2) return;
  const box = $(boxId);
  if (!box) return;
  box.innerHTML = '<div class="sug-item loading">🔍 Searching...</div>';
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query+' Uttarakhand')}&format=json&limit=5&countrycodes=in`;
    let res = await fetch(url, { headers:{'Accept-Language':'en'} });
    let data = await res.json();
    if (!data.length) {
      res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`, { headers:{'Accept-Language':'en'} });
      data = await res.json();
    }
    if (!data.length) { box.innerHTML='<div class="sug-item loading">No results</div>'; return; }
    box.innerHTML = '';
    data.forEach(p => {
      const item = document.createElement('div');
      item.className = 'sug-item';
      item.textContent = p.display_name;
      item.onclick = () => pickPlace(p, boxId, panelId);
      box.appendChild(item);
    });
  } catch(e) { box.innerHTML='<div class="sug-item loading">Search failed.</div>'; }
}

function pickPlace(place, boxId, panelId) {
  $(`pLat-${panelId}`).value = parseFloat(place.lat).toFixed(5);
  $(`pLng-${panelId}`).value = parseFloat(place.lon).toFixed(5);
  $(`locSearch-${panelId}`).value = place.display_name;
  $(boxId).innerHTML = '';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.form-group')) {
    const suggs = document.querySelectorAll('.suggestions');
    suggs.forEach(s => s.innerHTML = '');
  }
});

/* ── TABS ───────────────────────────────────────────────────── */
function doTab(name, el) {
  ['patient','hospitals','algo'].forEach(t => {
    const target = $('tab-'+t);
    if (target) target.style.display = t===name?'block':'none';
  });
  document.querySelectorAll('.center-form-box .tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  if (name === 'hospitals') renderFacilityList('hList-center');
}

function doTabSide(name, el) {
  ['patient','hospitals','algo'].forEach(t => {
    const target = $('stab-'+t);
    if (target) target.style.display = t===name?'block':'none';
  });
  document.querySelectorAll('.sidebar .tab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  if (name === 'hospitals') renderFacilityList('hList-side', lastResult?.best?.id ?? -1);
}

/* ── FACILITY LIST ──────────────────────────────────────────── */
function renderFacilityList(elId, bestId = -1) {
  const el = $(elId); if (!el) return;
  el.innerHTML = '';
  facilities.forEach(f => {
    const load = f.pts / f.cap, pct = (load*100).toFixed(0);
    const barC = f.type==='dispensary'?'#9b59b6':load<0.5?'#2ecc71':load<0.8?'#f39c12':'#e74c3c';
    const div  = document.createElement('div');
    div.className = `hospital-item ${f.type==='dispensary'?'dispensary-item':''} ${f.id===bestId?'best':''}`;
    div.innerHTML = `
      <div class="hospital-name">${f.id===bestId?'✅ ':''}${f.type==='dispensary'?'💊':'🏥'} ${f.name}</div>
      <div class="hospital-stats">
        <span>🛏 ${f.cap-f.pts} free</span>
        ${f.type==='hospital'?`<span>🚨 ICU: ${f.icu-f.icuOcc}</span>`:''}
        <span>👨‍⚕️ ${f.aDocs} Dr</span>
        <span>⭐ ${f.rating}</span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${barC}"></div></div>`;
    div.onclick = () => { if(mapReady){ map.setView([f.lat,f.lng],14); hMarkers[f.id]?.openPopup(); }};
    el.appendChild(div);
  });
}

/* ── QUICK RESULT (sidebar) ─────────────────────────────────── */
function showQuickResult(ok, best, sev, name, useDisp, panelId) {
  const el = $(`rbox-${panelId}`);
  if (!el) return;
  el.style.display = 'block';
  if (!ok) {
    el.className = 'result-box err';
    el.innerHTML = '<h4>❌ No Facility Available</h4><p>All facilities full or unavailable.</p>';
    return;
  }
  const d    = lastResult?.eligibleRanked[0]?.dist ?? 0;
  const time = (d / 60 * 60).toFixed(1);
  el.className = useDisp ? 'result-box dispensary-ok' : 'result-box ok';
  el.innerHTML = `
    <h4>${useDisp?'💊 Routed to Dispensary!':'🚑 Patient Allocated!'}</h4>
    <div class="result-row"><span>Facility</span><b>${best.name}</b></div>
    <div class="result-row"><span>Severity</span><span class="severity-badge severity-${sev}">${SEV_LABELS[sev]}</span></div>
    <div class="result-row"><span>Distance</span><b>${d.toFixed(1)} km · ~${time} min</b></div>
    <button class="btn btn-secondary-blue" onclick="openHospPanel()" style="margin-top:12px; font-size:0.85rem">
      🏥 Hospital Check-In Panel
    </button>`;
}

/* ── HOSPITAL CHECK-IN PANEL ────────────────────────────────── */
function openHospPanel() {
  if (!lastResult) return;
  const { best, name, age, cond, sev, useDisp, eligibleRanked } = lastResult;
  panelState = { facility:best, selectedRoom:null, selectedDoc:null, budget:'', stars:0 };

  $('hospModalTitle').textContent    = best.name;
  $('hospModalSubtitle').textContent = `${useDisp?'💊 Dispensary':'🏥 Hospital'} · Severity: ${SEV_LABELS[sev]}`;

  const isDisp  = best.type === 'dispensary';
  const doctors = isDisp ? DOCTORS.dispensary : DOCTORS.hospital;
  const rooms   = isDisp ? DISP_ROOMS : ROOMS;
  const d       = eligibleRanked[0]?.dist ?? 0;

  $('hospModalBody').innerHTML = `

    <div class="hm-section">
      <div class="hm-section-title">🚑 Patient & Route Summary</div>
      <div class="hm-summary">
        <div class="hm-sum-row"><span class="label-text">Condition</span><span class="value-text">${cond}</span></div>
        <div class="hm-sum-row"><span class="label-text">Severity</span><span class="value-text"><span class="severity-badge severity-${sev}">${SEV_LABELS[sev]}</span></span></div>
        <div class="hm-sum-row"><span class="label-text">Distance</span><span class="value-text">${d.toFixed(1)} km · ~${(d/60*60).toFixed(1)} min</span></div>
        <div class="hm-sum-row"><span class="label-text">Beds Free</span><span class="value-text">${best.cap - best.pts}</span></div>
        ${best.type==='hospital'?`<div class="hm-sum-row"><span class="label-text">ICU Free</span><span class="value-text">${best.icu - best.icuOcc}</span></div>`:''}
        <div class="hm-sum-row"><span class="label-text">Doctors Available</span><span class="value-text">${best.aDocs}</span></div>
        <div class="hm-sum-row"><span class="label-text">Rating</span><span class="value-text">⭐ ${best.rating}/5</span></div>
      </div>
    </div>

    <div class="hm-section">
      <div class="hm-section-title">🛏 Room Type</div>
      <div class="room-grid">
        ${rooms.map((r,i)=>`
          <div class="room-card" id="room-${i}" onclick="pickRoom(${i},${r.pricePerDay},'${r.name}')">
            <div class="room-icon">${r.icon}</div>
            <div class="room-name">${r.name}</div>
            <div class="room-price">₹${r.pricePerDay}/day</div>
            <div class="room-avail">${r.avail} available</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="hm-section">
      <div class="hm-section-title">👨‍⚕️ Doctor</div>
      <div class="doctor-list">
        ${doctors.map((d,i)=>`
          <div class="doc-card" id="doc-${i}" onclick="pickDoc(${i},${d.fee},'${d.name}','${d.spec}')">
            <div class="doc-avatar">👨‍⚕️</div>
            <div><div class="doc-name">${d.name}</div><div class="doc-spec">${d.spec}</div></div>
            <div class="doc-fee">₹${d.fee}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="hm-section">
      <div class="hm-section-title">💳 Budget</div>
      <div class="budget-wrap">
        <div class="budget-icon">₹</div>
        <input class="budget-input" id="budgetInput" type="number" placeholder="Enter budget (₹)" oninput="updateBudget(this.value)">
      </div>
    </div>

    <div class="hm-section">
      <div class="hm-section-title">📋 Cost Summary</div>
      <div class="hm-summary">
        <div class="hm-sum-row"><span class="label-text">Room (1 day)</span><span class="value-text" id="sumRoom">—</span></div>
        <div class="hm-sum-row"><span class="label-text">Doctor</span><span class="value-text" id="sumDoc">—</span></div>
        <div class="hm-sum-row"><span class="label-text">Misc.</span><span class="value-text">₹200</span></div>
        <div class="hm-sum-row hm-sum-total"><span class="label-text">Total</span><span class="value-text" id="sumTotal">—</span></div>
        <div class="hm-sum-row"><span class="label-text">Affordability</span><span class="value-text" id="sumAfford">—</span></div>
      </div>
    </div>

    <div class="hm-section">
      <div class="hm-section-title">⭐ Rate</div>
      <div class="star-row">${[1,2,3,4,5].map(n=>`<span class="star" id="star-${n}" onclick="setStars(${n})">⭐</span>`).join('')}</div>
    </div>

    <button class="hm-confirm-btn" onclick="confirmCheckin()">✅ Confirm Check-In</button>`;

  $('hospModal').classList.add('open');
}

function closeHospModal() { $('hospModal').classList.remove('open'); }

function pickRoom(i, price, name) {
  document.querySelectorAll('.room-card').forEach(c=>c.classList.remove('selected'));
  $(`room-${i}`)?.classList.add('selected');
  panelState.selectedRoom = { name, price };
  refreshCost();
}
function pickDoc(i, fee, name, spec) {
  document.querySelectorAll('.doc-card').forEach(c=>c.classList.remove('selected'));
  $(`doc-${i}`)?.classList.add('selected');
  panelState.selectedDoc = { name, fee, spec };
  refreshCost();
}
function updateBudget(val) { panelState.budget = val; refreshCost(); }
function refreshCost() {
  const rp = panelState.selectedRoom?.price ?? null;
  const df = panelState.selectedDoc?.fee   ?? null;
  $('sumRoom').textContent = rp!==null ? `₹${rp}` : '—';
  $('sumDoc').textContent  = df!==null ? `₹${df}` : '—';
  if (rp!==null && df!==null) {
    const total = rp + df + 200;
    $('sumTotal').textContent = `₹${total}`;
    const budget = +panelState.budget;
    if (budget > 0) {
      const diff = budget - total;
      $('sumAfford').textContent = diff>=0 ? `✅ Within budget (+₹${diff})` : `⚠️ Over by ₹${Math.abs(diff)}`;
      $('sumAfford').style.color = diff>=0 ? '#1e8449' : '#c0392b';
    }
  }
}
function setStars(n) {
  panelState.stars = n;
  for(let i=1;i<=5;i++) $(`star-${i}`)?.classList.toggle('lit', i<=n);
}
function confirmCheckin() {
  const { facility, selectedRoom, selectedDoc, stars } = panelState;
  $('hospModalBody').innerHTML = `
    <div class="hm-confirmed">
      <div class="confirm-icon">🎉</div>
      <h3>Check-In Confirmed!</h3>
      <p>Patient admitted to <b>${facility.name}</b></p>
      <div class="hm-summary" style="margin-top:16px">
        <div class="hm-sum-row"><span class="label-text">Room</span><span class="value-text">${selectedRoom?.name||'—'}</span></div>
        <div class="hm-sum-row"><span class="label-text">Doctor</span><span class="value-text">${selectedDoc?.name||'—'}</span></div>
        <div class="hm-sum-row"><span class="label-text">Rating</span><span class="value-text">${stars>0?'⭐'.repeat(stars):'—'}</span></div>
      </div>
      <button class="hm-confirm-btn" onclick="closeHospModal()" style="background:#1e8449;margin-top:16px">Close</button>
    </div>`;
}

/* ── RESET ──────────────────────────────────────────────────── */
function resetAll() {
  clearPaths();
  if (patMarker) { map?.removeLayer(patMarker); patMarker = null; }
  facilities = JSON.parse(JSON.stringify(H_DATA));
  $('centerPanel').style.display='flex';
  $('sidebar').style.display='none';
  $('mapPanel').style.display='none';
  if (mapReady) { map.remove(); map=null; mapReady=false; hMarkers=[]; }
  
  // Reset all panels
  ['center', 'side'].forEach(id => {
    const rbox = $(`rbox-${id}`);
    if (rbox) rbox.style.display = 'none';
    
    const pAge = $(`pAge-${id}`); if (pAge) pAge.value = 65;
    const pLat = $(`pLat-${id}`); if (pLat) pLat.value = '';
    const pLng = $(`pLng-${id}`); if (pLng) pLng.value = '';
    const locS = $(`locSearch-${id}`); if (locS) locS.value = '';
    const uncon = $(`pUncon-${id}`); if (uncon) uncon.checked = false;
    const bleed = $(`pBleed-${id}`); if (bleed) bleed.checked = false;
    const emer = $(`emergencyMode-${id}`); if (emer) emer.checked = false;
    
    if ($(`normalFields-${id}`)) $(`normalFields-${id}`).style.display = 'block';
    if ($(`emergencyFields-${id}`)) $(`emergencyFields-${id}`).style.display = 'none';
    
    updSev(id);
  });

  $('fullResultBtn').style.display='none';
  lastResult = null;
}

/* ── FIND ROUTE ENTRY POINTS ────────────────────────────────── */
async function findRoute(id) {
  const age  = +v(`pAge-${id}`)||30, cond = v(`pCond-${id}`);
  const un = $(`pUncon-${id}`).checked, bl = $(`pBleed-${id}`).checked;
  const isEmerg = $(`emergencyMode-${id}`).checked;
  
  const pLat = isEmerg ? emergencyLocs[id].lat : +$(`pLat-${id}`).value;
  const pLng = isEmerg ? emergencyLocs[id].lng : +$(`pLng-${id}`).value;
  const name = isEmerg ? 'Emergency Patient' : 'Patient';
  
  if (!pLat || !pLng) { 
    alert(isEmerg ? '📡 GPS not fetched yet. Wait a moment.' : '📍 Pehle location search karo!'); 
    return; 
  }
  
  // If in center, switch to map view
  if (id === 'center') {
    $('centerPanel').style.display = 'none';
    $('sidebar').style.display     = 'flex';
    $('mapPanel').style.display    = 'block';
    
    activateMap(pLat, pLng);
    
    // Ensure sidebar form is synced
    const syncFields = ['pAge', 'pCond', 'pLat', 'pLng', 'algoSelect'];
    syncFields.forEach(field => {
      const el = $(`${field}-side`);
      if (el) el.value = $(`${field}-center`).value;
    });
    $(`pUncon-side`).checked = un;
    $(`pBleed-side`).checked = bl;
    $(`emergencyMode-side`).checked = isEmerg;
    
    updSev('side');
    
    // Force map size refresh after switching view
    if (typeof map !== 'undefined' && map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  } else {
    // If already in sidebar, just refresh map size
    if (typeof map !== 'undefined' && map) {
      map.invalidateSize();
    }
  }
  
  await doRouting(pLat, pLng, name, age, cond, un, bl, id === 'center' ? 'side' : id);
}

async function doRouting(pLat, pLng, name, age, cond, un, bl, targetPanelId) {
  $('loader').classList.add('on');
  const result = await runRouting(pLat, pLng, name, age, cond, un, bl);
  $('loader').classList.remove('on');
  
  if (!result) { showQuickResult(false, null, 0, '', false, targetPanelId); return; }
  
  const { best, ranked, eligibleRanked, sev, useDisp } = result;
  const d    = eligibleRanked[0]?.dist ?? 0;
  const travelTime = (eligibleRanked[0]?.travelTimeMin ?? 0).toFixed(1);
  lastResult = { ...result, best, estTime: travelTime };
  
  setPatientMarker(pLat, pLng, `<b>🚑 ${name}</b><br>Severity: ${SEV_LABELS[sev]}`);
  await drawPaths(pLat, pLng, eligibleRanked, sev);
  
  renderMarkers(best.id);
  hMarkers[best.id]?.openPopup();
  renderFacilityList('hList-side', best.id);
  
  showQuickResult(true, best, sev, name, useDisp, targetPanelId);
  if (typeof buildRouteChooser === 'function') buildRouteChooser(result.algoResults);
  $('fullResultBtn').style.display = 'block';
}

/* ── INIT ───────────────────────────────────────────────────── */
function initUI() {
  if (document.getElementById('pAge-center')) {
    updSev('center');
    renderFacilityList('hList-center');
  }
  if (document.getElementById('pAge-side')) {
    updSev('side');
    renderFacilityList('hList-side');
  }
  if (typeof checkBackend === 'function') {
    checkBackend();
    setInterval(checkBackend, 30000);
  }
}

// Removed window.onload — initialization handled by index.html after components load.
