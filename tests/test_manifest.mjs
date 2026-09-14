import assert from 'node:assert/strict';
import { validateManifest } from '../skills/image-to-editable-ppt/scripts/lib/reconstruction-manifest.mjs';

const fidelity = { status: 'verified', methods: ['fixture-review'], notes: 'Synthetic validation fixture.' };
const base = {
  schemaVersion: '1.0',
  deck: { id: 'manifest-negative-regression' },
  slides: [{
    slide: 1,
    canvas: { widthPx: 800, heightPx: 600 },
    regions: [{
      id: 'region', bbox: { x: 0, y: 0, w: 800, h: 600 }, layer: 0, role: 'fixture', critical: true,
      fidelity,
      elements: [{
        id: 'title', bbox: { x: 50, y: 40, w: 500, h: 80 }, layer: 1, role: 'title',
        expectedEditability: 'native', representation: { mode: 'native-text', editability: 'native' },
        objectMap: [{ name: 'title', type: 'text' }],
        completion: { status: 'complete', notes: 'Created.' }, fidelity,
      }],
    }],
  }],
};
const errors = (manifest, mode = 'delivery') => validateManifest(manifest, { mode }).issues.filter(issue => issue.severity === 'error');
const copy = () => structuredClone(base);

assert.equal(errors(base).length, 0);
const partial = copy();
partial.slides[0].regions[0].elements[0].completion.status = 'partial';
partial.slides[0].regions[0].elements[0].degradation = { reason: 'Still rebuilding.', editabilityBoundary: 'Title is incomplete.' };
assert.equal(errors(partial, 'draft').length, 0);
assert.ok(errors(partial, 'delivery').some(issue => issue.code === 'delivery-incomplete'));
const mismatched = copy();
mismatched.slides[0].regions[0].elements[0].objectMap[0].type = 'shape';
assert.ok(errors(mismatched).some(issue => issue.code === 'representation-map-mismatch'));
const unreviewed = copy();
unreviewed.slides[0].regions[0].fidelity.status = 'review-needed';
assert.ok(errors(unreviewed).some(issue => issue.code === 'critical-region-unverified'));
const blank = { schemaVersion: '1.0', deck: { id: 'blank' }, slides: [{ slide: 1, canvas: { widthPx: 800, heightPx: 600 }, blank: true, blankReason: 'Source page is intentionally empty.', regions: [] }] };
assert.equal(errors(blank).length, 0);
const invalidBlank = structuredClone(blank);
delete invalidBlank.slides[0].blankReason;
assert.ok(errors(invalidBlank).some(issue => issue.code === 'missing-blank-reason'));

console.log('reconstruction manifest regression: passed');
