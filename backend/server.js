/*
  server.js — Hospital Routing Backend Server
  Team: DAA-IV-T080

  - Runs C++ dijkstra binary with patient+hospital JSON
  - Returns ranked results to frontend via HTTP
  - Start: node server.js
  - Port: 3000
*/

const http  = require('http');
const { execFile, exec } = require('child_process');
const path  = require('path');
const fs    = require('fs');

const PORT      = 3000;
const CPP_SRC   = path.join(__dirname, 'dijkstra.cpp');
const CPP_BIN   = path.join(__dirname, 'dijkstra');

/* ── Compile C++ on startup ─────────────────────────────────── */
function compileCpp(cb) {
  // Use *.cpp to compile all newly created C++ files
  exec(`g++ -std=c++17 -O2 -o "${CPP_BIN}" *.cpp`, { cwd: __dirname }, (err, stdout, stderr) => {
    if (err) { console.error('Compile failed:', stderr); cb(false); }
    else     { console.log('✅ C++ compiled OK'); cb(true); }
  });
}

/* ── Run C++ binary with JSON input ─────────────────────────── */
function runDijkstra(inputJson, cb) {
  const proc = execFile(CPP_BIN, [], { timeout: 5000 }, (err, stdout, stderr) => {
    if (err) return cb(null, 'C++ error: ' + stderr);
    try {
      cb(JSON.parse(stdout), null);
    } catch(e) {
      cb(null, 'JSON parse error: ' + stdout);
    }
  });
  proc.stdin.write(inputJson);
  proc.stdin.end();
}

/* ── HTTP Server ─────────────────────────────────────────────── */
const server = http.createServer((req, res) => {

  // CORS — allow frontend to call from file:// or localhost
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // POST /route — main routing endpoint
  if (req.method === 'POST' && req.url === '/route') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      runDijkstra(body, (result, err) => {
        if (err) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: err }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify(result));
        }
      });
    });
    return;
  }

  // GET /health — check if server is running
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', cpp: fs.existsSync(CPP_BIN) }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

/* ── Start ──────────────────────────────────────────────────── */
compileCpp(ok => {
  if (!ok) { process.exit(1); }
  server.listen(PORT, () => {
    console.log(`🏥 Hospital Routing Backend running on http://localhost:${PORT}`);
    console.log(`   POST /route  — run Dijkstra (C++)`);
    console.log(`   GET  /health — server status`);
  });
});
