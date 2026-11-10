// Homebase as its own app. One window, the AI's face on the taskbar, opens with one click and with the computer.
// It starts Homebase's server if it isn't running (with Electron's own Node, so it doesn't need anything else),
// and the server keeps running when the window closes, so the AI's tools still work.
//
//   electron app              open Homebase (or bring the open window forward)
//   electron app --install    make the Start menu and desktop shortcuts, start with the computer, then open
//   electron app --no-startup with --install: shortcuts only, don't start with the computer
//   electron app --uninstall  take the shortcuts and the startup entry away again
// tools/app.js runs these for you: `node tools/app.js install`.
const { app, BrowserWindow, nativeImage, shell, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const STATE = path.join(DATA, 'app-window.json');
const ICON = path.join(DATA, 'homebase.ico');
let argv = process.argv;
const has = f => argv.includes(f);
// One id for the window and its shortcuts, so a pinned taskbar button and the open window are the same button.
const APP_ID = 'Homebase.' + require('node:crypto').createHash('sha1').update(ROOT.toLowerCase()).digest('hex').slice(0, 8);

if (!app.requestSingleInstanceLock()) app.exit(0);
app.setAppUserModelId(APP_ID);

let win = null, cfg = null, base = '';
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const up = () => new Promise(r => {
  const q = http.get(base + 'api/flags', { timeout: 1200 }, res => { res.resume(); r(res.statusCode === 200); });
  q.on('error', () => r(false)); q.on('timeout', () => { q.destroy(); r(false); });
});

async function ensureServer() {
  if (await up()) return;
  fs.mkdirSync(DATA, { recursive: true });
  const log = fs.openSync(path.join(DATA, 'server.log'), 'a');
  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT, detached: true, stdio: ['ignore', log, log], windowsHide: true,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  });
  fs.writeFileSync(path.join(DATA, 'server.pid'), String(child.pid));
  child.unref();
  for (let i = 0; i < 50 && !(await up()); i++) await wait(200);
}

// The AI's picture, cut round like a face, at a few sizes.
function faces() {
  const file = path.isAbsolute(cfg.ai.picture || '') ? cfg.ai.picture : path.join(ROOT, cfg.ai.picture || 'public/odie.jpg');
  let img = nativeImage.createFromPath(file);
  if (img.isEmpty()) img = nativeImage.createFromPath(path.join(ROOT, 'public', 'odie.jpg'));
  const { width, height } = img.getSize(), s = Math.min(width, height);
  img = img.crop({ x: Math.floor((width - s) / 2), y: Math.floor((height - s) / 2), width: s, height: s });
  return [256, 48, 32, 16].map(n => {
    const bmp = Buffer.from(img.resize({ width: n, height: n, quality: 'best' }).toBitmap());
    const r = n / 2;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const d = Math.hypot(x + 0.5 - r, y + 0.5 - r), a = Math.max(0, Math.min(1, r - d)); // soft edge
      bmp[(y * n + x) * 4 + 3] = Math.round(bmp[(y * n + x) * 4 + 3] * a);
    }
    return { n, img: nativeImage.createFromBitmap(bmp, { width: n, height: n }) };
  });
}

// A Windows .ico holding PNGs (Windows reads PNG inside .ico since Vista).
function writeIco(list) {
  const pngs = list.map(f => f.img.toPNG());
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let off = head.length;
  pngs.forEach((p, i) => {
    const e = 6 + i * 16, n = list[i].n;
    head.writeUInt8(n >= 256 ? 0 : n, e); head.writeUInt8(n >= 256 ? 0 : n, e + 1);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(p.length, e + 8); head.writeUInt32LE(off, e + 12); off += p.length;
  });
  fs.mkdirSync(DATA, { recursive: true });
  fs.writeFileSync(ICON, Buffer.concat([head, ...pngs]));
}

const links = () => {
  const name = 'Homebase.lnk';
  return [path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', name), path.join(app.getPath('desktop'), name)];
};
// Windows writes this line into the Run key as-is, so paths with spaces (C:\Users\John Smith) need their own quotes.
const q = p => process.platform === 'win32' ? `"${p}"` : p;
const startup = on => app.setLoginItemSettings({ openAtLogin: on, path: q(process.execPath), args: [q(__dirname), '--startup'] });

function install() {
  const lines = [], saved = readJSON(path.join(DATA, 'app.json'), {});
  const on = has('--install') ? !has('--no-startup') : saved.startup !== false;
  if (process.platform === 'win32') {
    for (const l of links()) {
      fs.mkdirSync(path.dirname(l), { recursive: true });
      const ok = shell.writeShortcutLink(l, fs.existsSync(l) ? 'replace' : 'create', {
        target: process.execPath, args: `"${__dirname}"`, cwd: ROOT, icon: ICON, iconIndex: 0,
        appUserModelId: APP_ID, description: `${cfg.ai.name}'s memory, as a living web`,
      });
      lines.push(`${ok ? 'made' : "couldn't make"} ${l}`);
    }
  }
  if (process.platform !== 'linux') { startup(on); lines.push(on ? 'starts with the computer' : 'does not start with the computer'); }
  fs.writeFileSync(path.join(DATA, 'app.json'), JSON.stringify({ installed: true, startup: on, id: APP_ID, shortcuts: process.platform === 'win32' ? links() : [], at: new Date().toISOString() }, null, 1));
  console.log('Homebase app: ' + lines.join('; '));
}

function uninstall() {
  for (const l of links()) try { fs.unlinkSync(l); } catch {}
  if (process.platform !== 'linux') startup(false);
  try { fs.unlinkSync(path.join(DATA, 'app.json')); } catch {}
  console.log('Homebase app: shortcuts and the startup entry are gone. The pin on the taskbar, if any, is theirs to unpin.');
}

function open(icon) {
  const st = readJSON(STATE, {});
  const onScreen = st.x != null && screen.getAllDisplays().some(d => st.x >= d.bounds.x - 50 && st.x < d.bounds.x + d.bounds.width - 100 && st.y >= d.bounds.y - 50 && st.y < d.bounds.y + d.bounds.height - 100);
  const wa = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: st.width || Math.min(1500, wa.width), height: st.height || Math.min(950, wa.height),
    ...(onScreen ? { x: st.x, y: st.y } : {}),
    backgroundColor: '#0b0d10', icon, autoHideMenuBar: true, show: false, title: 'Homebase',
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  if (st.max) win.maximize();
  win.once('ready-to-show', () => win.show());
  const save = () => { if (!win || win.isDestroyed()) return; const b = win.getNormalBounds(); fs.writeFile(STATE, JSON.stringify({ ...b, max: win.isMaximized() }), () => {}); };
  win.on('resize', save); win.on('move', save); win.on('close', save);
  // Homebase's own pages stay in the window; everything else opens in their browser.
  const ours = u => u.startsWith(base);
  win.webContents.setWindowOpenHandler(({ url }) => { if (ours(url)) win.loadURL(url); else shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!ours(url)) { e.preventDefault(); shell.openExternal(url); } });
  let tries = 0;
  win.webContents.on('did-fail-load', async (_e, code) => { if (code !== -3 && tries++ < 30) { await ensureServer(); setTimeout(() => win && win.loadURL(base), 1000); } });
  win.loadURL(base);
}

// A second launch hands its words to this one: install and uninstall still happen while the window is open.
app.on('second-instance', (_e, args) => {
  argv = args;
  if (has('--uninstall')) { uninstall(); return app.quit(); }
  if (has('--install')) { try { install(); } catch (e) { console.log('shortcut trouble: ' + e.message); } }
  if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
});
app.on('window-all-closed', () => app.quit());

app.whenReady().then(async () => {
  cfg = (await import(pathToFileURL(path.join(ROOT, 'lib', 'config.js')).href)).loadConfig();
  base = `http://127.0.0.1:${cfg.port}/`;
  if (has('--uninstall')) { uninstall(); return app.quit(); }
  const list = faces();
  try { writeIco(list); } catch {}
  // The face follows their AI's picture: shortcuts are refreshed on every start once they exist.
  if (has('--install') || readJSON(path.join(DATA, 'app.json'), {}).installed) { try { install(); } catch (e) { console.log('shortcut trouble: ' + e.message); } }
  if (app.dock) app.dock.setIcon(list[0].img);
  await ensureServer();
  open(list[0].img);
});
