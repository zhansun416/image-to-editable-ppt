import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inspector = path.join(repoRoot, 'skills', 'image-to-editable-ppt', 'scripts', 'inspect-ppt.mjs');
const deck = path.resolve(process.argv[2] || '');
const manifestPath = path.resolve(process.argv[3] || '');
if (!fs.existsSync(deck) || !fs.existsSync(manifestPath)) throw new Error('Usage: node tests/test_inspector_negative.mjs <fixture.pptx> <manifest.json>');

const withoutManifest = spawnSync(process.execPath, [inspector, deck, '--mode', 'delivery'], { encoding: 'utf8' });
assert.notEqual(withoutManifest.status, 0, 'Delivery inspection must reject a missing manifest.');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.slides[0].regions[0].elements[0].objectMap[0].name = 'object-that-does-not-exist';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'i2ep-inspector-negative-'));
try {
  const badManifest = path.join(temp, 'bad-manifest.json');
  fs.writeFileSync(badManifest, JSON.stringify(manifest));
  const missingObject = spawnSync(process.execPath, [inspector, deck, '--manifest', badManifest, '--mode', 'delivery'], { encoding: 'utf8' });
  assert.notEqual(missingObject.status, 0, 'Delivery inspection must reject a missing mapped object.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

console.log('PPTX inspector negative regression: passed');
