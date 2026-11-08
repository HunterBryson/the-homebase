// Reading a brain: any folder of markdown files, whatever shape the AI gave it.
//
//   the center   DESK.md, INDEX.md, README.md, CLAUDE.md or index.md at the top (the first one found)
//   boot files   the other .md files at the top, hung right beside the center
//   rooms        each top-level folder; a room's own INDEX.md or README.md is what opens when you tap it
//   blocks       every other .md file in a room (any depth)
//   support      files in a folder named after a block (money/investing/history.md belongs to money/investing.md)
//   threads      a block that names another block's path (`money/plan.md` or [plan](money/plan.md)) draws a line to it
//   words        if the center has a table whose rows name a block in backticks, the row's first cell is that block's word
import fs from 'node:fs';
import path from 'node:path';

const CENTER_NAMES = ['desk.md', 'index.md', 'readme.md', 'claude.md', 'home.md'];
const ROOM_INDEX = ['index.md', 'readme.md'];
const SKIP = new Set(['.git', 'node_modules', '.obsidian', '.claude', '.trash', 'data']);
const MAX_FILES = 3000;

const posix = p => p.split(path.sep).join('/');

function walk(root) {
  const out = [];
  const go = dir => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (out.length >= MAX_FILES) return;
      if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) go(full);
      else if (/\.md$/i.test(e.name)) {
        const st = fs.statSync(full);
        out.push({ path: posix(path.relative(root, full)), mtime: st.mtime.toISOString(), size: st.size });
      }
    }
  };
  go(root);
  return out;
}

function titleOf(text, file) {
  const m = text.match(/^#\s+(.+)$/m);
  if (m) return m[1].replace(/[*`_]/g, '').trim();
  return path.basename(file, path.extname(file)).replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// The first plain sentence under the title, for hover text.
function aboutOf(text) {
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('|') || t.startsWith('---')) continue;
    const plain = t.replace(/^[-*>]\s*/, '').replace(/[*_`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    return plain.length > 140 ? plain.slice(0, 137) + '…' : plain;
  }
  return '';
}

const pretty = id => id.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Paths a block mentions, resolved against the brain root and against the block's own folder.
function mentions(text, from, known) {
  const found = new Set();
  const dir = path.posix.dirname(from);
  const tryPath = raw => {
    const p = raw.trim().replace(/^\.\//, '').replace(/[#?].*$/, '');
    if (!/\.md$/i.test(p)) return;
    for (const cand of [p, path.posix.normalize(path.posix.join(dir, p)), p.replace(/^memory\//, '')]) {
      if (known.has(cand) && cand !== from) { found.add(cand); return; }
    }
  };
  for (const m of text.matchAll(/`([^`\n]+?\.md)`/gi)) tryPath(m[1]);
  for (const m of text.matchAll(/\]\(([^)\s]+?\.md)(?:#[^)]*)?\)/gi)) tryPath(m[1]);
  return [...found];
}

// Trigger words: table rows in the center file that name a block in backticks.
function wordsOf(text, known) {
  const words = {};
  for (const line of text.split(/\r?\n/)) {
    if (!/^\s*\|/.test(line) || /^\s*\|\s*-/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 2) continue;
    const word = cells[0].replace(/[*`]/g, '').trim();
    if (!word || /^word$/i.test(word)) continue;
    for (const c of cells.slice(1)) {
      const m = c.match(/`([^`]+?\.md)`/i);
      if (m && known.has(m[1].replace(/^memory\//, ''))) { words[m[1].replace(/^memory\//, '')] ??= word; break; }
    }
  }
  return words;
}

export function readBrain(cfg) {
  const root = cfg.brain;
  const files = walk(root);
  const known = new Set(files.map(f => f.path));
  const texts = {};
  const read = p => (texts[p] ??= (() => { try { return fs.readFileSync(path.join(root, p), 'utf8'); } catch { return ''; } })());
  const meta = f => ({ path: f.path, title: titleOf(read(f.path), f.path), about: aboutOf(read(f.path)), mtime: f.mtime });

  const top = files.filter(f => !f.path.includes('/'));
  const centerFile = CENTER_NAMES.map(n => top.find(f => f.path.toLowerCase() === n)).find(Boolean) || null;
  const center = centerFile ? meta(centerFile) : null;
  const boot = top.filter(f => f !== centerFile).map(meta);

  const byRoom = new Map();
  for (const f of files) {
    if (!f.path.includes('/')) continue;
    const id = f.path.split('/')[0];
    if (!byRoom.has(id)) byRoom.set(id, []);
    byRoom.get(id).push(f);
  }

  const rooms = [];
  for (const [id, list] of [...byRoom].sort((a, b) => a[0].localeCompare(b[0]))) {
    const indexFile = list.find(f => f.path.split('/').length === 2 && ROOM_INDEX.includes(f.path.split('/')[1].toLowerCase()));
    const blocksAll = list.filter(f => f !== indexFile);
    // support: a file inside a folder that shares its name with a block next to it
    const blockPaths = new Set(blocksAll.map(f => f.path));
    const supportOf = f => {
      const parts = f.path.split('/');
      for (let i = parts.length - 1; i >= 2; i--) {
        const owner = parts.slice(0, i).join('/') + '.md';
        if (blockPaths.has(owner)) return owner;
      }
      return null;
    };
    const blocks = [];
    const support = {};
    for (const f of blocksAll) {
      const owner = supportOf(f);
      if (owner) (support[owner] ??= []).push(meta(f));
      else blocks.push(f);
    }
    const label = cfg.rooms?.[id] || (indexFile ? titleOf(read(indexFile.path), indexFile.path) : pretty(id));
    rooms.push({
      id, title: label.length > 28 ? pretty(id) : label,
      path: indexFile?.path || null,
      mtime: list.map(f => f.mtime).sort().pop(),
      blocks: blocks.map(f => ({ ...meta(f), support: support[f.path] || [] })),
    });
  }

  const threads = [];
  for (const f of files) {
    for (const to of mentions(read(f.path), f.path, known)) threads.push({ from: f.path, to });
  }
  const words = center ? wordsOf(read(center.path), known) : {};

  return { center, boot, rooms, threads, words, files, count: files.length };
}

export function readBlock(cfg, rel) {
  const p = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!p || !/\.md$/i.test(p) || p.split('/').some(s => s === '..' || s.startsWith('.'))) return null;
  const full = path.resolve(cfg.brain, p);
  if (!full.startsWith(path.resolve(cfg.brain) + path.sep)) return null;
  try {
    const text = fs.readFileSync(full, 'utf8');
    const st = fs.statSync(full);
    return { path: p, title: titleOf(text, p), text, mtime: st.mtime.toISOString(), size: st.size };
  } catch { return null; }
}
