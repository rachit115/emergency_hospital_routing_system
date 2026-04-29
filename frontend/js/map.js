/* map.js — Leaflet map: init, markers, routes, animation */

let map         = null;
let mapReady    = false;
let routeLayers = [];
let animFrame   = null;
let patMarker   = null;
let hMarkers    = [];

/* ── MAP INIT ───────────────────────────────────────────────── */
function activateMap(centerLat, centerLng) {
  if (mapReady) return;
  $('centerPanel').style.display = 'none';
  $('sidebar').style.display     = 'flex';
  $('mapPanel').style.display    = 'block';

  map = L.map('map').setView([centerLat, centerLng], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19,
  }).addTo(map);

  mapReady = true;
  renderMarkers();
  
  // Force size refresh for correct tiling
  setTimeout(() => map.invalidateSize(), 200);
}

/* ── ICONS ──────────────────────────────────────────────────── */
function facilityIcon(load, best, type) {
  const color = type === 'dispensary' ? '#9b59b6'
              : load < 0.5 ? '#2ecc71' : load < 0.8 ? '#f39c12' : '#e74c3c';
  const size  = best ? 40 : 32;
  const emoji = type === 'dispensary' ? '💊' : '🏥';
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid ${best?'#1a1a2e':'white'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${best?18:14}px;box-shadow:0 3px 12px rgba(0,0,0,.3)">${emoji}</div>`,
    iconSize: [size,size], iconAnchor: [size/2,size/2],
  });
}

function ambulanceIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:40px;height:40px;background:#e94560;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 3px 14px rgba(233,69,96,.5)">🚑</div>`,
    iconSize: [40,40], iconAnchor: [20,20],
  });
}

/* ── POPUP ──────────────────────────────────────────────────── */
function facilityPopup(f) {
  const pct   = (f.pts / f.cap * 100).toFixed(0);
  const color = pct < 50 ? '#2ecc71' : pct < 80 ? '#f39c12' : '#e74c3c';
  return `<div style="font-family:'DM Sans',sans-serif;min-width:180px">
    <b>${f.type==='dispensary'?'💊':'🏥'} ${f.name}</b>
    <hr style="margin:5px 0;border-color:#eee">
    <table style="width:100%;font-size:.81rem">
      <tr><td>Patients</td><td><b>${f.pts}/${f.cap}</b></td></tr>
      ${f.type==='hospital'?`<tr><td>ICU</td><td><b>${f.icuOcc}/${f.icu}</b></td></tr>`:''}
      <tr><td>Doctors</td><td><b>${f.aDocs} free</b></td></tr>
      <tr><td>Load</td><td><b style="color:${color}">${pct}%</b></td></tr>
    </table></div>`;
}

/* ── RENDER MARKERS ─────────────────────────────────────────── */
function renderMarkers(bestId = -1) {
  if (!mapReady) return;
  hMarkers.forEach(m => map.removeLayer(m));
  hMarkers = [];
  facilities.forEach(f => {
    const m = L.marker([f.lat, f.lng], { icon: facilityIcon(f.pts/f.cap, f.id===bestId, f.type) })
      .addTo(map).bindPopup(facilityPopup(f));
    hMarkers.push(m);
  });
}

/* ── DRAW MULTI PATHS ───────────────────────────────────────── */
async function drawPaths(pLat, pLng, ranked, sev) {
  clearPaths();

  const styles = [
    { color: sev===4 ? '#e74c3c' : '#e94560', weight:7, opacity:0.95, dash:null },
    { color: '#f39c12', weight:5, opacity:0.7,  dash:'10,6' },
    { color: '#3498db', weight:4, opacity:0.55, dash:'8,8'  },
  ];

  const top3  = ranked.filter(r => r.eligible).slice(0, 3);
  const geos  = await Promise.all(top3.map(r => {
    const f = facilities.find(f => f.id === r.id);
    return f ? getRouteGeo(pLat, pLng, f) : Promise.resolve(null);
  }));

  let bounds = null;
  for (let i = 0; i < top3.length; i++) {
    const geo = geos[i];
    if (!geo) continue;
    const s = styles[i] || styles[2];

    const line = L.geoJSON(geo.geojson, {
      style: { color:s.color, weight:s.weight, opacity:s.opacity, lineCap:'round', lineJoin:'round', dashArray:s.dash }
    }).addTo(map);
    routeLayers.push(line);

    // Animate dot only on fastest path — stops at destination
    if (i === 0) {
      const coords = geo.geojson.coordinates.map(c => [c[1], c[0]]);
      animateDot(coords, s.color);
    }

    const f = facilities.find(f => f.id === top3[i].id);
    if (f) {
      const ring = L.circleMarker([f.lat, f.lng], {
        radius:i===0?24:18, color:s.color, fillColor:s.color, fillOpacity:0.1, weight:2.5, dashArray:'5,4'
      }).addTo(map);
      routeLayers.push(ring);
    }

    bounds = bounds ? bounds.extend(line.getBounds()) : line.getBounds();
  }

  if (bounds) map.fitBounds(bounds, { padding:[80,80], maxZoom:14 });
  updatePathsLegend(top3);
}

function updatePathsLegend(top3) {
  $('pathsLegend').style.display = 'block';
  ['pl1','pl2','pl3'].forEach((id, i) => {
    const el = $(id); if (!el) return;
    if (i < top3.length) {
      const f = facilities.find(f => f.id === top3[i].id);
      el.querySelector('span').textContent = f ? (i===0?`🥇 ${f.name.split(',')[0]}`:`${i+1}: ${f.name.split(',')[0]}`) : '';
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
    }
  });
}

/* ── OSRM ROUTE GEOMETRY ────────────────────────────────────── */
async function getRouteGeo(pLat, pLng, fac) {
  try {
    const url  = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${fac.lng},${fac.lat}?overview=full&geometries=geojson`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes.length)
      return { geojson: data.routes[0].geometry };
  } catch(e) {}
  return { geojson: { type:'LineString', coordinates:[[pLng,pLat],[fac.lng,fac.lat]] } };
}

/* ── MOVING DOT — stops at destination (no loop) ───────────── */
function animateDot(coords, color) {
  if (animFrame) { clearTimeout(animFrame); animFrame = null; }

  const dot = L.marker(coords[0], {
    icon: L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.4);font-size:10px;display:flex;align-items:center;justify-content:center">🚑</div>`,
      iconSize: [14,14], iconAnchor: [7,7],
    }),
    zIndexOffset: 1000,
  }).addTo(map);
  routeLayers.push(dot);

  let seg = 0, t = 0;
  const speed = 0.015;

  function tick() {
    // Stop at last point — no loop
    if (seg >= coords.length - 1) {
      dot.setLatLng(coords[coords.length - 1]);
      return; // animation ends here
    }
    const [ly, lx] = coords[seg], [ty, tx] = coords[seg+1];
    dot.setLatLng([ly + (ty-ly)*t, lx + (tx-lx)*t]);
    t += speed;
    if (t >= 1) { t = 0; seg++; }
    animFrame = setTimeout(tick, 30);
  }
  tick();
}

/* ── CLEAR ──────────────────────────────────────────────────── */
function clearPaths() {
  if (animFrame) { clearTimeout(animFrame); animFrame = null; }
  routeLayers.forEach(l => map && map.removeLayer(l));
  routeLayers = [];
  if ($('pathsLegend')) $('pathsLegend').style.display = 'none';
}

/* ── PATIENT MARKER ─────────────────────────────────────────── */
function setPatientMarker(lat, lng, label) {
  if (patMarker) map.removeLayer(patMarker);
  patMarker = L.marker([lat, lng], { icon: ambulanceIcon() })
    .addTo(map).bindPopup(label).openPopup();
}
