// What changed. If the brain lives in git, Homebase can show exactly what the AI changed in a block
// since the person last looked (a diff), and the recent saves by commit. Without git, it still
// works from file times; there's just no "what changed" view.
import { execFile } from 'node:child_process';

function git(cwd, args) {
  return new Promise(resolve => {
    execFile('git', ['-c', 'core.quotepath=false', ...args], { cwd, timeout: 8000, maxBuffer: 16 * 1024 * 1024, windowsHide: true },
      (err, out) => resolve(err ? null : out));
  });
}

let gitCache = { at: 0, root: null, ok: false };
async function hasGit(root) {
  if (gitCache.root === root && Date.now() - gitCache.at < 30000) return gitCache.ok;
  const out = await git(root, ['ls-files', '--', '.']);
  gitCache = { at: Date.now(), root, ok: !!(out && out.trim()) };
  return gitCache.ok;
}

// A block's recent commits, and its diff since `since` (the last time the person looked at it).
export async function history(root, rel, since) {
  if (!(await hasGit(root))) return { git: false };
  const log = await git(root, ['log', '-n', '8', '--format=%h%x1f%cI%x1f%s', '--', rel]);
  const commits = (log || '').trim().split('\n').filter(Boolean).map(l => { const [hash, date, subject] = l.split('\x1f'); return { hash, date, subject }; });
  let diff = null;
  if (since) {
    const base = ((await git(root, ['rev-list', '-1', `--before=${since}`, 'HEAD'])) || '').trim();
    diff = base ? await git(root, ['diff', '--no-color', '-U2', base, '--', rel]) : await git(root, ['diff', '--no-color', '-U2', 'HEAD', '--', rel]);
    if (base && diff === '') {
      // nothing in git since then: maybe the change isn't committed yet
      diff = await git(root, ['diff', '--no-color', '-U2', '--', rel]);
    }
    const tracked = await git(root, ['ls-files', '--', rel]);
    if (tracked !== null && !tracked.trim()) diff = 'NEW';
  }
  return { git: true, commits, diff: diff || '' };
}

// The last week of saves: commits if there's git (plus what isn't committed yet), else file times.
export async function recent(root, files) {
  const week = Date.now() - 7 * 864e5;
  if (await hasGit(root)) {
    const out = await git(root, ['log', '--since=7.days', '-n', '40', '--name-only', '--format=%x1e%h%x1f%cI%x1f%s', '--', '.']);
    const prefix = ((await git(root, ['rev-parse', '--show-prefix'])) || '').trim();
    const strip = f => (prefix && f.startsWith(prefix) ? f.slice(prefix.length) : f);
    const saves = (out || '').split('\x1e').filter(s => s.trim()).map(rec => {
      const [head, ...rest] = rec.split('\n');
      const [hash, date, subject] = head.split('\x1f');
      return { hash, date, subject, paths: rest.map(s => s.trim()).filter(f => /\.md$/i.test(f)).map(strip) };
    }).filter(s => s.paths.length);
    const status = await git(root, ['status', '--porcelain', '--', '.']);
    const dirty = (status || '').split('\n').filter(Boolean).map(l => strip(l.slice(3).replace(/^"|"$/g, ''))).filter(f => /\.md$/i.test(f));
    if (dirty.length) {
      const latest = dirty.map(p => files.find(f => f.path === p)?.mtime).filter(Boolean).sort().pop() || new Date().toISOString();
      saves.unshift({ hash: null, date: latest, subject: 'Not saved to git yet', paths: dirty });
    }
    return { git: true, saves };
  }
  // No git: files saved within a couple of minutes of each other count as one save.
  const saves = [];
  for (const f of files.filter(f => Date.parse(f.mtime) > week).sort((a, b) => b.mtime.localeCompare(a.mtime)).slice(0, 80)) {
    const last = saves[saves.length - 1];
    if (last && Date.parse(last.oldest) - Date.parse(f.mtime) < 120000) { last.paths.push(f.path); last.oldest = f.mtime; }
    else saves.push({ hash: null, date: f.mtime, oldest: f.mtime, subject: '', paths: [f.path] });
  }
  return { git: false, saves: saves.slice(0, 30) };
}
