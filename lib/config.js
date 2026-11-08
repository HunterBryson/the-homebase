// homebase.config.json: which brain to read, and what to call things.
// No config yet? Homebase reads the example brain, so it works the minute it's cloned.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG = path.join(ROOT, 'homebase.config.json');

const DEFAULTS = {
  brain: 'example-brain',
  person: '',
  ai: { name: 'Odie', picture: 'public/odie.jpg', color: '#f2a84b' },
  port: 7940,
  rooms: { human: 'You', self: 'Me' },
  edges: [],
  allowHosts: [],
};

export function loadConfig() {
  let mine = {};
  if (fs.existsSync(CONFIG)) {
    try { mine = JSON.parse(fs.readFileSync(CONFIG, 'utf8')); }
    catch (e) { console.error(`homebase.config.json isn't valid JSON (${e.message}). Using the example brain until it's fixed.`); }
  }
  const cfg = { ...DEFAULTS, ...mine, ai: { ...DEFAULTS.ai, ...(mine.ai || {}) } };
  cfg.brain = path.resolve(ROOT, cfg.brain);
  cfg.example = path.resolve(ROOT, 'example-brain') === cfg.brain;
  // The red panda is Odie, the AI this was built with: a stand-in until your AI has its own picture.
  cfg.ai.placeholder = path.resolve(ROOT, cfg.ai.picture || '') === path.join(ROOT, 'public', 'odie.jpg');
  if (process.env.HOMEBASE_PORT) cfg.port = +process.env.HOMEBASE_PORT;
  if (!fs.existsSync(cfg.brain)) {
    console.error(`The brain folder isn't there: ${cfg.brain}\nFix "brain" in homebase.config.json. Showing the example brain for now.`);
    cfg.brain = path.join(ROOT, 'example-brain');
    cfg.example = true;
  }
  return cfg;
}
