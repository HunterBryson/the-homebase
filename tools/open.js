#!/usr/bin/env node
// Start Homebase if it isn't running, then open it in its own app window (Chrome or Edge, no tabs or
// address bar). Falls back to the default browser. This is what a desktop shortcut should run.
//   node tools/open.js            start if needed, then open
//   node tools/open.js --no-open  only make sure it's running
//   node tools/open.js --restart  stop the running one first (after changing homebase.config.json)
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { loadConfig, ROOT } from '../lib/config.js';

const cfg = loadConfig();
const URL_ = `http://127.0.0.1:${cfg.port}/`;
const PID = path.join(ROOT, 'data', 'server.pid');
const up = () => new Promise(r => {
  const q = http.get(URL_ + 'api/flags', { timeout: 1200 }, res => { res.resume(); r(res.statusCode === 200); });
  q.on('error', () => r(false)); q.on('timeout', () => { q.destroy(); r(false); });
});
const wait = ms => new Promise(r => setTimeout(r, ms));

if (process.argv.includes('--restart') && fs.existsSync(PID)) {
  try { process.kill(+fs.readFileSync(PID, 'utf8')); } catch {}
  for (let i = 0; i < 20 && (await up()); i++) await wait(150);
}

if (!(await up())) {
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  const log = fs.openSync(path.join(ROOT, 'data', 'server.log'), 'a');
  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], { cwd: ROOT, detached: true, stdio: ['ignore', log, log], windowsHide: true });
  fs.writeFileSync(PID, String(child.pid));
  child.unref();
  for (let i = 0; i < 30 && !(await up()); i++) await wait(200);
  console.log((await up()) ? `Started Homebase: ${URL_}` : 'Homebase did not start; see data/server.log');
} else console.log(`Homebase is running: ${URL_}`);

if (process.argv.includes('--no-open')) process.exit(0);

const app = [`--app=${URL_}`, '--window-size=1500,950', `--user-data-dir=${path.join(ROOT, 'data', 'window')}`];
const tryRun = (file, args) => { try { if (!fs.existsSync(file)) return false; spawn(file, args, { detached: true, stdio: 'ignore' }).unref(); return true; } catch { return false; } };
let opened = false;
if (process.platform === 'win32') {
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA].filter(Boolean);
  const cands = roots.flatMap(p => [path.join(p, 'Google', 'Chrome', 'Application', 'chrome.exe'), path.join(p, 'Microsoft', 'Edge', 'Application', 'msedge.exe')]);
  for (const c of cands) if ((opened = tryRun(c, app))) break;
  if (!opened) spawn('cmd', ['/c', 'start', '', URL_], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
} else if (process.platform === 'darwin') {
  for (const a of ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']) if ((opened = tryRun(a, app))) break;
  if (!opened) spawn('open', [URL_], { detached: true, stdio: 'ignore' }).unref();
} else {
  for (const a of ['google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    try { execFileSync('which', [a], { stdio: 'ignore' }); spawn(a, app, { detached: true, stdio: 'ignore' }).unref(); opened = true; break; } catch {}
  }
  if (!opened) spawn('xdg-open', [URL_], { detached: true, stdio: 'ignore' }).unref();
}
console.log('Opened the window.');
