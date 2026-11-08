// Homebase's own small notes, in data/ (never in the brain, and never pushed anywhere):
//   flags.json   the person's ⚑ flags: which block, the part they selected, their words, and the AI's answer
//   seen.json    when the person last looked at each block, so what changed since then can glow
//   nav.json     the left side: theirs to fill (the AI edits it; nav.suggested.json is a starting set)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.js';

export function store(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const file = n => path.join(dir, n);
  const get = (n, d) => { try { return JSON.parse(fs.readFileSync(file(n), 'utf8')); } catch { return d; } };
  const put = (n, v) => { const f = file(n); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify(v, null, 1)); fs.renameSync(f + '.tmp', f); };
  const now = () => new Date().toISOString();
  const id = () => Math.random().toString(36).slice(2, 8);

  // ---- seen: the glow ----
  let seenMem = get('seen.json', null);
  function seenState() {
    if (!seenMem) { seenMem = { since: now(), files: {} }; put('seen.json', seenMem); }
    return seenMem;
  }
  seenState(); // the starting point is when Homebase first ran: anything changed after that glows
  const seenAt = p => seenState().files[p] || seenState().since;
  const isChanged = (p, mtime) => Date.parse(mtime) > Date.parse(seenAt(p)) + 1500;
  function seen(files) {
    return { changed: files.filter(f => isChanged(f.path, f.mtime)).map(f => ({ path: f.path, mtime: f.mtime })) };
  }
  function markSeen(paths) {
    const s = seenState();
    for (const p of paths) s.files[p] = now();
    put('seen.json', s);
    return { ok: true, seen: paths.length };
  }

  // ---- flags ----
  const flagsAll = () => get('flags.json', { flags: [] });
  function flags() {
    const all = flagsAll().flags;
    return {
      open: all.filter(f => !f.done && !f.removed),
      done: all.filter(f => f.done).sort((a, b) => b.done.localeCompare(a.done)).slice(0, 20),
    };
  }
  function addFlag({ path: p, quote, note }) {
    const s = flagsAll();
    const f = { id: id(), path: String(p), quote: String(quote || '').trim().slice(0, 2000), note: String(note || '').trim().slice(0, 4000), at: now(), done: null, what: '' };
    s.flags.push(f); put('flags.json', s); return f;
  }
  function edit(fid, fn) { const s = flagsAll(); const f = s.flags.find(x => x.id === fid); if (!f) return null; fn(f); put('flags.json', s); return f; }
  const noteFlag = (fid, note) => edit(fid, f => { f.note = String(note || '').trim().slice(0, 4000); });
  const removeFlag = fid => edit(fid, f => { f.removed = now(); });
  const doneFlag = (fid, what) => edit(fid, f => { f.done = now(); f.what = String(what || '').trim().slice(0, 4000); });

  // ---- nav ----
  const suggested = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'nav.suggested.json'), 'utf8')); } catch { return { groups: [] }; } };
  function nav() {
    const mine = get('nav.json', null);
    return { mine, suggested: suggested(), welcomeDismissed: !!get('ui.json', {}).welcomeDismissed };
  }
  function useSuggested() { const s = suggested(); put('nav.json', { groups: s.groups }); return nav(); }
  function dismissWelcome() { const u = get('ui.json', {}); u.welcomeDismissed = true; put('ui.json', u); return { ok: true }; }

  return { seen, seenAt, isChanged, markSeen, flags, addFlag, noteFlag, removeFlag, doneFlag, nav, useSuggested, dismissWelcome };
}
