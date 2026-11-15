#!/usr/bin/env node
// Plug a build into Homebase's left side, the same way for every build.
// It writes data/nav.json (made from nav.suggested.json the first time) and the open page picks it up by itself.
// Works whether or not Homebase is running.
//
//   node tools/plug.js add "<name>" <url> [--sub "<one line>"] [--icon <icon>]
//        adds it to "Built for you", or updates the item with that name if it's already there
//   node tools/plug.js remove "<name>"
//   node tools/plug.js list                  what's plugged in
//
// Icons: mark words person chat book room link page money music calendar mail tool star
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'data', 'nav.json');
const SUGGESTED = path.join(ROOT, 'nav.suggested.json');
const GROUP = 'Built for you';
const ICONS = 'mark words person chat book room link page money music calendar mail tool star'.split(' ');

const argv = process.argv.slice(2);
const flag = k => { const i = argv.indexOf('--' + k); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const sub = flag('sub'), icon = flag('icon');
const [cmd, name, url] = argv;

const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const load = () => {
  if (fs.existsSync(FILE)) return read(FILE);
  return { groups: read(SUGGESTED).groups };
};
const save = nav => {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE + '.tmp', JSON.stringify(nav, null, 2));
  fs.renameSync(FILE + '.tmp', FILE);
};
const group = nav => {
  let g = nav.groups.find(g => g.name === GROUP);
  if (!g) { g = { name: GROUP, items: [], empty: 'When your AI makes you a page or a tool, it goes here.' }; nav.groups.push(g); }
  g.items ||= [];
  return g;
};
const die = m => { console.error(m); process.exit(1); };

if (cmd === 'add') {
  if (!name || !url) die('Usage: node tools/plug.js add "<name>" <url> [--sub "<one line>"] [--icon <icon>]');
  if (!/^https?:\/\//.test(url)) die(`"${url}" isn't an address. Give the full one, like http://127.0.0.1:7950/`);
  if (icon && !ICONS.includes(icon)) die(`"${icon}" isn't an icon Homebase has. Pick one of: ${ICONS.join(' ')}`);
  const nav = load(), g = group(nav);
  const had = g.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  const item = { name, sub: sub ?? had?.sub ?? '', url, icon: icon ?? had?.icon ?? 'page' };
  if (had) Object.assign(had, item); else g.items.push(item);
  save(nav);
  console.log(`${had ? 'Updated' : 'Plugged in'}: ${name} → ${url}, under "${GROUP}". The open page shows it within a few seconds.`);
} else if (cmd === 'remove') {
  if (!name) die('Usage: node tools/plug.js remove "<name>"');
  const nav = load(), g = group(nav);
  const gone = g.items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (!gone) die(`Nothing called "${name}" is plugged in.`);
  g.items = g.items.filter(i => i !== gone);
  save(nav);
  console.log(`Took ${gone.name} off the left side.`);
} else if (!cmd || cmd === 'list') {
  const items = fs.existsSync(FILE) ? group(read(FILE)).items : [];
  if (!items.length) console.log(`Nothing plugged in yet under "${GROUP}".`);
  else for (const i of items) console.log(`${i.name}  ${i.url || i.block}${i.sub ? '  · ' + i.sub : ''}`);
} else die('Commands: add, remove, list (see the top of this file).');
