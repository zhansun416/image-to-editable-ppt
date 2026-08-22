import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const defaults = { library: process.env.I2EP_SVG_LIBRARY || path.join(os.homedir(), 'Documents', 'Codex', 'svg-library') };
const args = process.argv.slice(2);
const command = args.shift();
const get = (flag, fallback = undefined) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : fallback; };
const libraryRoot = get('--library', defaults.library);
const manifestPath = path.join(libraryRoot, 'library.json');
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const load = () => fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { libraryVersion: 1, root: '.', updatedAt: '', entries: [] };
const save = (manifest) => { manifest.updatedAt = new Date().toISOString(); fs.mkdirSync(libraryRoot, { recursive: true }); fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8'); };

if (command === 'init') {
  const seedRoot = path.join(skillRoot, 'assets', 'svg-library-seed', 'icons');
  const icons = path.join(libraryRoot, 'icons');
  fs.mkdirSync(icons, { recursive: true });
  const manifest = load();
  for (const name of fs.readdirSync(seedRoot).filter(name => name.endsWith('.svg'))) {
    const source = path.join(seedRoot, name); const text = fs.readFileSync(source, 'utf8');
    if (!/<svg\b/.test(text) || !/viewBox=/.test(text)) throw new Error(`Invalid seed SVG: ${name}`);
    const hash = sha256(source); const target = path.join(icons, name);
    if (!fs.existsSync(target)) fs.copyFileSync(source, target);
    if (!manifest.entries.some(entry => entry.sha256 === hash)) manifest.entries.push({ file: name, path: path.join('icons', name), sha256: hash, tags: path.basename(name, '.svg').split('-'), category: 'basic-geometry', sourceLabel: 'generated-basic', sourceUrl: null, extractionMethod: 'local-seed', downloadStatus: 'not-applicable', license: 'CC0-equivalent-local', addedAt: new Date().toISOString() });
  }
  save(manifest); console.log(JSON.stringify({ library: libraryRoot, entries: manifest.entries.length }, null, 2));
} else if (command === 'find') {
  const query = get('--query'); if (!query) throw new Error('find requires --query');
  const terms = query.toLowerCase().split(/[ ,;/|]+/).filter(Boolean);
  const matches = load().entries.map(entry => { const haystack = [entry.file, entry.path, entry.category, entry.sourceLabel, ...(entry.tags || [])].join(' ').toLowerCase(); return { score: terms.filter(term => haystack.includes(term)).length, ...entry }; }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
  console.log(JSON.stringify(matches.slice(0, Number(get('--limit', 12))), null, 2));
} else if (command === 'register') {
  const source = get('--file'); const role = get('--role'); if (!source || !role) throw new Error('register requires --file and --role');
  const text = fs.readFileSync(source, 'utf8'); if (!/<svg\b/.test(text) || !/viewBox=/.test(text)) throw new Error('SVG must be standalone and include a viewBox.');
  const hash = sha256(source); const icons = path.join(libraryRoot, 'icons'); fs.mkdirSync(icons, { recursive: true });
  const safeRole = role.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''); const name = `${safeRole}-${hash.slice(0, 8)}.svg`; const target = path.join(icons, name);
  if (fs.existsSync(target) && sha256(target) !== hash) throw new Error(`Refusing to overwrite different SVG: ${target}`);
  if (!fs.existsSync(target)) fs.copyFileSync(source, target);
  const manifest = load(); if (!manifest.entries.some(entry => entry.sha256 === hash)) manifest.entries.push({ file: name, path: path.join('icons', name), sha256: hash, tags: (get('--tags', '') || '').split(',').map(v => v.trim()).filter(Boolean), category: 'presentation-reference', role, sourceLabel: get('--source-label', 'user-supplied'), sourceUrl: get('--source-url', null), extractionMethod: get('--extraction-method', 'file-copy'), downloadStatus: get('--download-status', 'not-applicable'), license: get('--license', 'unknown-review'), addedAt: new Date().toISOString() });
  save(manifest); console.log(JSON.stringify({ file: target, sha256: hash, registered: true }, null, 2));
} else { throw new Error('Usage: svg-library.mjs <init|find|register> [options]'); }
