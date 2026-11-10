#!/usr/bin/env node
// Homebase as its own app (the app/ folder): the AI's face on the taskbar, one click to open, starts with the computer.
//   node tools/app.js setup        download the app shell once (about 100 MB, 280 MB unpacked)
//   node tools/app.js install      Start menu + desktop shortcuts, start with the computer, then open it
//   node tools/app.js install --no-startup   the same, without starting with the computer
//   node tools/app.js              open it (or bring the open window forward)
//   node tools/app.js status       what's set up
//   node tools/app.js uninstall    take the shortcuts and the startup entry away
// Without the app shell, `node tools/open.js` still opens Homebase in a Chrome or Edge window.
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/config.js';

const APP = path.join(ROOT, 'app');
const [cmd = 'open', ...rest] = process.argv.slice(2);
const pathTxt = path.join(APP, 'node_modules', 'electron', 'path.txt');
const electron = () => fs.existsSync(pathTxt) ? path.join(APP, 'node_modules', 'electron', 'dist', fs.readFileSync(pathTxt, 'utf8').trim()) : null;
const state = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'app.json'), 'utf8')); } catch { return null; } };
const wait = ms => new Promise(r => setTimeout(r, ms));

if (cmd === 'setup') {
  if (electron() && fs.existsSync(electron())) { console.log('The app shell is already here.'); process.exit(0); }
  console.log('Downloading the app shell (about 100 MB, about 280 MB once unpacked; a minute or two). npm may print warnings about allow-scripts or deprecated packages; they\x27re harmless.');
  execSync('npm install --no-audit --no-fund', { cwd: APP, stdio: 'inherit' });
  // Newer npm can hold back Electron's own download step (allow-scripts); run it ourselves if the app is missing.
  if (!(electron() && fs.existsSync(electron())) && fs.existsSync(path.join(APP, 'node_modules', 'electron', 'install.js'))) execSync(`"${process.execPath}" install.js`, { cwd: path.join(APP, 'node_modules', 'electron'), stdio: 'inherit' });
  console.log(electron() && fs.existsSync(electron()) ? 'Ready. Next: node tools/app.js install' : "The download didn't finish; run it again.");
  process.exit(0);
}

if (cmd === 'status') {
  const s = state();
  console.log(`app shell: ${electron() && fs.existsSync(electron()) ? 'here' : 'not downloaded (node tools/app.js setup)'}`);
  console.log(s ? `installed ${s.at || ''}\n  starts with the computer: ${s.startup ? 'yes' : 'no'}\n  shortcuts: ${(s.shortcuts || []).map(l => `${l} ${fs.existsSync(l) ? '✓' : '✗ missing'}`).join('\n             ') || 'none on this OS'}` : 'not installed (node tools/app.js install)');
  process.exit(0);
}

const exe = electron();
if (!exe || !fs.existsSync(exe)) { console.log('The app shell isn\'t downloaded yet. Run: node tools/app.js setup'); process.exit(1); }
const flags = { install: ['--install'], uninstall: ['--uninstall'], open: [] }[cmd];
if (!flags) { console.log('node tools/app.js setup|install|status|uninstall  (no word: open it)'); process.exit(1); }
const before = state()?.at;
const child = spawn(exe, [APP, ...flags, ...rest.filter(a => a === '--no-startup')], { detached: true, stdio: 'ignore', windowsHide: false });
child.unref();
if (cmd === 'install') {
  for (let i = 0; i < 40 && state()?.at === before; i++) await wait(250);
  const s = state();
  console.log(s && s.at !== before ? `Installed. Starts with the computer: ${s.startup ? 'yes' : 'no'}. Shortcuts:\n  ${(s.shortcuts || []).join('\n  ') || 'none on this OS'}\nThe window is opening. To pin it: right-click its face on the taskbar, then "Pin to taskbar".` : "Didn't hear back from the app; check node tools/app.js status.");
} else if (cmd === 'uninstall') {
  for (let i = 0; i < 40 && state(); i++) await wait(250);
  // The server goes too; node tools/open.js brings it back if they want Homebase in a browser window.
  try { process.kill(+fs.readFileSync(path.join(ROOT, 'data', 'server.pid'), 'utf8')); } catch {}
  console.log(state() ? "Didn't hear back; check node tools/app.js status." : 'Shortcuts, the startup entry and the running server are gone. A taskbar pin, if they made one, is theirs to unpin. To get the space back, delete the app/node_modules folder (about 280 MB).');
} else console.log('Opening Homebase.');
