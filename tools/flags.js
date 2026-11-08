#!/usr/bin/env node
// The AI's side of the ⚑ flags. Works whether or not Homebase is running.
//
//   node tools/flags.js                     every open flag: which block, the part they selected, their words
//   node tools/flags.js done <id> "what"    mark one fixed, with a line on what changed (it shows under the flag)
//   node tools/flags.js recent              the last few done, with what was changed
//   add --json to any of them for JSON
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'data', 'flags.json');
const json = process.argv.includes('--json');
const args = process.argv.slice(2).filter(a => a !== '--json');
const load = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return { flags: [] }; } };
const save = s => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE + '.tmp', JSON.stringify(s, null, 1)); fs.renameSync(FILE + '.tmp', FILE); };
const when = iso => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const [cmd, id, ...rest] = args;
const s = load();

if (!cmd || cmd === 'list') {
  const open = s.flags.filter(f => !f.done && !f.removed);
  if (json) { console.log(JSON.stringify(open, null, 1)); process.exit(0); }
  if (!open.length) { console.log('No flags waiting.'); process.exit(0); }
  console.log(`${open.length} flag${open.length > 1 ? 's' : ''} waiting:\n`);
  for (const f of open) {
    console.log(`[${f.id}] ${f.path}  (${when(f.at)})`);
    if (f.quote) console.log(`  the part they selected: "${f.quote.replace(/\s+/g, ' ')}"`);
    console.log(`  their words: ${f.note || '(none: read the block and find what looks wrong, old or tangled)'}`);
    console.log('');
  }
  console.log('Fix each block in the brain itself, then: node tools/flags.js done <id> "what you changed"');
} else if (cmd === 'done') {
  const f = s.flags.find(x => x.id === id);
  if (!f) { console.error(`No flag ${id}. Run node tools/flags.js to see the open ones.`); process.exit(1); }
  const what = rest.join(' ').trim();
  if (!what) { console.error('Say what you changed, in one line: node tools/flags.js done <id> "what you changed"'); process.exit(1); }
  f.done = new Date().toISOString(); f.what = what;
  save(s);
  console.log(json ? JSON.stringify(f) : `Done: ${f.path}. Your line shows under the flag on their screen.`);
} else if (cmd === 'recent') {
  const done = s.flags.filter(f => f.done).sort((a, b) => b.done.localeCompare(a.done)).slice(0, 10);
  if (json) console.log(JSON.stringify(done, null, 1));
  else if (!done.length) console.log('Nothing marked done yet.');
  else for (const f of done) console.log(`${when(f.done)}  ${f.path}\n  they said: ${f.note || '(no words)'}\n  you did: ${f.what}\n`);
} else {
  console.log('node tools/flags.js [list | done <id> "what" | recent] [--json]');
}
