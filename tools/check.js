#!/usr/bin/env node
// A quick look at the setup, for the AI: is Node new enough, which brain will be read, what the web
// will show, whether there's git (for "what changed"), and whether Homebase is answering.
import fs from 'node:fs';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { loadConfig, CONFIG } from '../lib/config.js';
import { readBrain } from '../lib/brain.js';

const ok = (b, s) => console.log(`${b ? '✓' : '✗'} ${s}`);
const major = +process.versions.node.split('.')[0];
ok(major >= 18, `Node ${process.versions.node}${major >= 18 ? '' : ' (needs 18 or newer)'}`);
ok(fs.existsSync(CONFIG), fs.existsSync(CONFIG) ? 'homebase.config.json is here' : 'no homebase.config.json yet (copy homebase.config.example.json and point "brain" at the memory folder)');
const cfg = loadConfig();
console.log(`  brain: ${cfg.brain}${cfg.example ? '   <- the example brain, not yours yet' : ''}`);
console.log(`  center: ${cfg.ai.name}${cfg.ai.placeholder ? ' (picture: Odie, the placeholder)' : ''}  ·  person: ${cfg.person || '(not set)'}  ·  port ${cfg.port}`);
const b = readBrain(cfg);
ok(!!b.center, b.center ? `center block: ${b.center.path}` : 'no DESK.md / INDEX.md / README.md / CLAUDE.md at the top of the brain, so the center opens nothing');
console.log(`  ${b.count} blocks · ${b.rooms.length} rooms (${b.rooms.map(r => `${r.title} ${r.blocks.length}`).join(', ') || 'none'}) · ${b.threads.length} threads between blocks · ${Object.keys(b.words).length} words from the desk`);
if (b.count >= 3000) console.log('  ! stopped at 3000 files: is "brain" pointing at too big a folder?');
if (b.boot.length > 8) console.log(`  ! ${b.boot.length} files sit loose at the top of the brain and will crowd the center. Folders become rooms.`);
let g = false;
try { g = !!execFileSync('git', ['ls-files', '--', '.'], { cwd: cfg.brain, windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
ok(g, g ? 'the brain is in git, so "what changed" shows the exact edits' : 'the brain is not in git: changes still glow, but there is no "what changed" view (git init in the brain folder fixes that)');
const req = http.get({ host: '127.0.0.1', port: cfg.port, path: '/api/flags', timeout: 1500 }, res => {
  let s = ''; res.on('data', c => { s += c; }); res.on('end', () => {
    try { const f = JSON.parse(s); ok(true, `Homebase is answering at http://127.0.0.1:${cfg.port}  (${f.open.length} flag${f.open.length === 1 ? '' : 's'} open)`); }
    catch { ok(false, `something else is on port ${cfg.port}; set "port" in homebase.config.json`); }
  });
});
req.on('error', () => ok(false, 'Homebase is not running (node tools/open.js starts it and opens the window)'));
req.on('timeout', () => req.destroy());
