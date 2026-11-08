// Homebase: a living web of an AI's memory, on your own computer.
// Plain Node, no installs. Run `node server.js`, then open http://127.0.0.1:7940
//
// It reads a folder of markdown (the AI's "brain"), draws it as a web, lets the person flag any
// block for the AI to fix, and makes anything the AI changed glow until the person has looked.
// Everything stays on this machine: the server only answers to 127.0.0.1 / localhost.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, ROOT } from './lib/config.js';
import { readBrain, readBlock } from './lib/brain.js';
import { history, recent } from './lib/changes.js';
import { store } from './lib/store.js';

const cfg = loadConfig();
const data = store(path.join(ROOT, 'data'));
const PUBLIC = path.join(ROOT, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon' };

const okHost = h => {
  const host = String(h || '').toLowerCase().replace(/:\d+$/, '');
  return host === '127.0.0.1' || host === 'localhost' || host === '[::1]' || (cfg.allowHosts || []).includes(host);
};
const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};
const body = req => new Promise(resolve => {
  let s = ''; req.on('data', c => { s += c; if (s.length > 1e6) req.destroy(); });
  req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
});

// A picture can live anywhere the config says (in the repo, or in the brain folder).
function pictureFile(p) {
  if (!p) return null;
  const f = path.isAbsolute(p) ? p : path.join(ROOT, p);
  return fs.existsSync(f) ? f : null;
}

async function api(req, res, url) {
  const q = Object.fromEntries(url.searchParams);
  const p = url.pathname;

  if (req.method === 'GET' && p === '/api/web') {
    const brain = readBrain(cfg);
    const seen = data.seen(brain.files);
    return send(res, 200, {
      ai: { name: cfg.ai.name, color: cfg.ai.color, placeholder: cfg.ai.placeholder },
      person: cfg.person, edges: (cfg.edges || []).map((e, i) => ({ name: e.name, color: e.color, picture: !!pictureFile(e.picture), i })),
      brainPath: cfg.brain, example: cfg.example, ...brain, files: undefined,
      changed: seen.changed, flags: data.flags().open,
    });
  }
  if (req.method === 'GET' && p === '/api/block') {
    const b = readBlock(cfg, q.path);
    if (!b) return send(res, 404, { error: 'not in the brain' });
    const since = data.seenAt(b.path);
    return send(res, 200, { ...b, changed: data.isChanged(b.path, b.mtime), history: await history(cfg.brain, b.path, since) });
  }
  if (req.method === 'GET' && p === '/api/recent') return send(res, 200, await recent(cfg.brain, readBrain(cfg).files));
  if (req.method === 'GET' && p === '/api/flags') return send(res, 200, data.flags());
  if (req.method === 'GET' && p === '/api/nav') return send(res, 200, data.nav());
  if (req.method === 'GET' && p.startsWith('/api/picture/')) {
    const which = p.slice('/api/picture/'.length);
    const f = which === 'ai' ? pictureFile(cfg.ai.picture) : pictureFile((cfg.edges || [])[+which]?.picture);
    if (!f) return send(res, 404, { error: 'no picture' });
    res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
    return fs.createReadStream(f).pipe(res);
  }

  if (req.method === 'POST') {
    // A browser request must come from this page, not from some other site.
    const origin = req.headers.origin;
    if (origin && !okHost(new URL(origin).host)) return send(res, 403, { error: 'wrong origin' });
    const b = await body(req);
    if (p === '/api/seen') return send(res, 200, data.markSeen(b.path ? [b.path] : readBrain(cfg).files.map(f => f.path)));
    if (p === '/api/flag') {
      if (!readBlock(cfg, b.path)) return send(res, 404, { error: 'not in the brain' });
      return send(res, 201, data.addFlag(b));
    }
    if (p === '/api/flag/note') return send(res, 200, data.noteFlag(b.id, b.note) || { error: 'no such flag' });
    if (p === '/api/flag/remove') return send(res, 200, data.removeFlag(b.id) || { error: 'no such flag' });
    if (p === '/api/flag/done') return send(res, 200, data.doneFlag(b.id, b.what) || { error: 'no such flag' });
    if (p === '/api/nav/use-suggested') return send(res, 200, data.useSuggested());
    if (p === '/api/nav/dismiss-welcome') return send(res, 200, data.dismissWelcome());
  }
  send(res, 404, { error: 'no such route' });
}

const server = http.createServer(async (req, res) => {
  try {
    if (!okHost(req.headers.host)) return send(res, 403, 'This Homebase only answers on this computer.', 'text/plain');
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    let f = path.normalize(path.join(PUBLIC, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
    if (!f.startsWith(PUBLIC) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(PUBLIC, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  } catch (e) {
    send(res, 500, { error: String(e.message || e) });
  }
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.log(`Port ${cfg.port} is busy. Homebase may already be running: open http://127.0.0.1:${cfg.port}`);
  else console.error(e);
  process.exit(1);
});
server.listen(cfg.port, '127.0.0.1', () => {
  console.log(`Homebase is up: http://127.0.0.1:${cfg.port}`);
  console.log(`Reading: ${cfg.brain}${cfg.example ? '  (the example brain; point homebase.config.json at yours)' : ''}`);
});

