import fs from 'node:fs';
import path from 'node:path';

export const OBJECT_TYPES = new Set([
  'text',
  'shape',
  'line',
  'connector',
  'chart',
  'table',
  'picture-raster',
  'picture-svg',
  'picture-unknown',
  'group',
  'unknown'
]);

const REPRESENTATION_MODES = new Set([
  'native-text',
  'native-shape',
  'native-line',
  'native-connector',
  'native-chart',
  'native-table',
  'native-group',
  'verified-native-path',
  'raster-picture',
  'svg-picture',
  'mixed',
  'deferred'
]);
const EDITABILITY = new Set(['native', 'partial', 'asset']);
const COMPLETION = new Set(['complete', 'partial', 'deferred']);
const FIDELITY = new Set(['verified', 'review-needed', 'failed', 'not-applicable']);
const REPRESENTATION_OBJECT_TYPES = {
  'native-text': new Set(['text']),
  'native-shape': new Set(['shape']),
  'native-line': new Set(['line']),
  'native-connector': new Set(['connector']),
  'native-chart': new Set(['chart']),
  'native-table': new Set(['table']),
  'native-group': new Set(['group']),
  'verified-native-path': new Set(['shape']),
  'raster-picture': new Set(['picture-raster']),
  'svg-picture': new Set(['picture-svg'])
};

const issue = (severity, code, location, message) => ({ severity, code, location, message });
const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

function validateBbox(bbox, canvas, location, issues) {
  if (!isObject(bbox)) {
    issues.push(issue('error', 'missing-bbox', location, 'bbox must be an object with x, y, w, and h in source-image pixels.'));
    return;
  }
  for (const key of ['x', 'y', 'w', 'h']) {
    if (!isFiniteNumber(bbox[key])) issues.push(issue('error', 'invalid-bbox', `${location}.bbox.${key}`, 'Value must be a finite number.'));
  }
  if (![bbox.x, bbox.y, bbox.w, bbox.h].every(isFiniteNumber)) return;
  if (bbox.x < 0 || bbox.y < 0 || bbox.w <= 0 || bbox.h <= 0) {
    issues.push(issue('error', 'invalid-bbox', `${location}.bbox`, 'bbox must have non-negative x/y and positive width/height.'));
  }
  if (canvas && (bbox.x + bbox.w > canvas.widthPx + 0.01 || bbox.y + bbox.h > canvas.heightPx + 0.01)) {
    issues.push(issue('error', 'bbox-outside-canvas', `${location}.bbox`, 'bbox extends outside the slide source canvas.'));
  }
}

function validateFidelity(value, location, issues, { required = true } = {}) {
  if (!isObject(value)) {
    if (required) issues.push(issue('error', 'missing-fidelity', location, 'fidelity is required.'));
    return;
  }
  if (!FIDELITY.has(value.status)) {
    issues.push(issue('error', 'invalid-fidelity-status', `${location}.status`, `Expected one of: ${[...FIDELITY].join(', ')}.`));
  }
  if (!Array.isArray(value.methods) || value.methods.length === 0 || value.methods.some(method => !isNonEmptyString(method))) {
    issues.push(issue('error', 'missing-fidelity-method', `${location}.methods`, 'List at least one concrete review method.'));
  }
  if (!isNonEmptyString(value.notes)) {
    issues.push(issue('error', 'missing-fidelity-notes', `${location}.notes`, 'Record what was checked or what remains uncertain.'));
  }
}

function validateDegradation(element, location, issues) {
  const completionStatus = element.completion?.status;
  const expected = element.expectedEditability;
  const actual = element.representation?.editability;
  const downgraded = expected === 'native' && actual !== 'native';
  const incomplete = completionStatus === 'partial' || completionStatus === 'deferred';
  if (!downgraded && !incomplete) return;
  const degradation = element.degradation;
  if (!isObject(degradation) || !isNonEmptyString(degradation.reason) || !isNonEmptyString(degradation.editabilityBoundary)) {
    issues.push(issue('error', 'undeclared-degradation', `${location}.degradation`, 'A partial/deferred or native-to-asset downgrade requires reason and editabilityBoundary.'));
  }
}

function validateElement(element, canvas, location, issues, seenIds, objectMaps, mode) {
  if (!isObject(element)) {
    issues.push(issue('error', 'invalid-element', location, 'Each element must be an object.'));
    return;
  }
  if (!isNonEmptyString(element.id)) issues.push(issue('error', 'missing-id', `${location}.id`, 'Element id is required.'));
  else if (seenIds.has(element.id)) issues.push(issue('error', 'duplicate-id', `${location}.id`, `Duplicate id: ${element.id}`));
  else seenIds.add(element.id);
  validateBbox(element.bbox, canvas, location, issues);
  if (!Number.isInteger(element.layer)) issues.push(issue('error', 'invalid-layer', `${location}.layer`, 'layer must be an integer.'));
  if (!isNonEmptyString(element.role)) issues.push(issue('error', 'missing-role', `${location}.role`, 'role is required.'));

  const representation = element.representation;
  if (!isObject(representation)) issues.push(issue('error', 'missing-representation', `${location}.representation`, 'representation is required.'));
  else {
    if (!REPRESENTATION_MODES.has(representation.mode)) {
      issues.push(issue('error', 'invalid-representation', `${location}.representation.mode`, `Expected one of: ${[...REPRESENTATION_MODES].join(', ')}.`));
    }
    if (!EDITABILITY.has(representation.editability)) {
      issues.push(issue('error', 'invalid-editability', `${location}.representation.editability`, `Expected one of: ${[...EDITABILITY].join(', ')}.`));
    }
    const nativeMode = representation.mode?.startsWith('native-') || representation.mode === 'verified-native-path';
    const pictureMode = representation.mode === 'raster-picture' || representation.mode === 'svg-picture';
    if (nativeMode && representation.editability !== 'native') {
      issues.push(issue('error', 'representation-editability-mismatch', `${location}.representation`, 'A native representation must declare native editability.'));
    }
    if (pictureMode && representation.editability === 'native') {
      issues.push(issue('error', 'representation-editability-mismatch', `${location}.representation`, 'An embedded picture is not a native editable PowerPoint object.'));
    }
  }
  if (!['native', 'asset'].includes(element.expectedEditability)) {
    issues.push(issue('error', 'missing-expected-editability', `${location}.expectedEditability`, 'Expected editability must be native or asset.'));
  }
  if (element.expectedEditability === 'asset') {
    if (!isNonEmptyString(element.assetReason) || !isNonEmptyString(element.editabilityBoundary)) {
      issues.push(issue('error', 'missing-asset-boundary', location, 'Intentional source assets require assetReason and editabilityBoundary.'));
    }
  }

  const completion = element.completion;
  if (!isObject(completion) || !COMPLETION.has(completion.status)) {
    issues.push(issue('error', 'invalid-completion', `${location}.completion`, `completion.status must be one of: ${[...COMPLETION].join(', ')}.`));
  }
  if (!isObject(completion) || !isNonEmptyString(completion.notes)) {
    issues.push(issue('error', 'missing-completion-notes', `${location}.completion.notes`, 'Record what was implemented or remains.'));
  }
  validateFidelity(element.fidelity, `${location}.fidelity`, issues);
  validateDegradation(element, location, issues);

  if (!Array.isArray(element.objectMap)) {
    issues.push(issue('error', 'missing-object-map', `${location}.objectMap`, 'objectMap must be an array.'));
  } else {
    if (completion?.status !== 'deferred' && element.objectMap.length === 0) {
      issues.push(issue('error', 'unmapped-element', `${location}.objectMap`, 'A non-deferred element must map to at least one PowerPoint object.'));
    }
    element.objectMap.forEach((mapping, index) => {
      const mapLocation = `${location}.objectMap[${index}]`;
      if (!isObject(mapping) || !isNonEmptyString(mapping.name)) {
        issues.push(issue('error', 'invalid-object-map', mapLocation, 'Each mapping requires a stable PowerPoint object name.'));
        return;
      }
      if (!OBJECT_TYPES.has(mapping.type)) {
        issues.push(issue('error', 'invalid-object-type', `${mapLocation}.type`, `Expected one of: ${[...OBJECT_TYPES].join(', ')}.`));
      }
      const allowedTypes = REPRESENTATION_OBJECT_TYPES[representation?.mode];
      if (allowedTypes && !allowedTypes.has(mapping.type)) {
        issues.push(issue('error', 'representation-map-mismatch', mapLocation, `${representation.mode} cannot map to object type ${mapping.type}.`));
      }
      if (representation?.mode === 'verified-native-path' && mapping.geometry !== 'custom') {
        issues.push(issue('error', 'native-path-unverified', mapLocation, 'verified-native-path mappings must require geometry "custom".'));
      }
      objectMaps.push({ ...mapping, elementId: element.id, location: mapLocation });
    });
  }

  if (mode === 'delivery') {
    if (completion?.status !== 'complete') {
      issues.push(issue('error', 'delivery-incomplete', `${location}.completion.status`, 'Delivery mode requires every element to be complete.'));
    }
    if (element.fidelity?.status !== 'verified') {
      issues.push(issue('error', 'delivery-fidelity-open', `${location}.fidelity.status`, 'Delivery mode requires every visible element to have verified fidelity.'));
    }
  } else {
    if (completion?.status !== 'complete') issues.push(issue('warning', 'draft-incomplete', `${location}.completion.status`, 'Draft contains an incomplete element.'));
    if (element.fidelity?.status === 'review-needed' || element.fidelity?.status === 'failed') {
      issues.push(issue('warning', 'draft-fidelity-open', `${location}.fidelity.status`, 'Draft contains an open or failed element fidelity check.'));
    }
  }
}

export function validateManifest(manifest, { mode = 'draft' } = {}) {
  const issues = [];
  const objectMapsBySlide = new Map();
  if (!isObject(manifest)) return { issues: [issue('error', 'invalid-manifest', '$', 'Manifest must be a JSON object.')], objectMapsBySlide };
  if (manifest.schemaVersion !== '1.0') issues.push(issue('error', 'unsupported-schema', '$.schemaVersion', 'schemaVersion must be "1.0".'));
  if (!isObject(manifest.deck) || !isNonEmptyString(manifest.deck.id)) issues.push(issue('error', 'missing-deck-id', '$.deck.id', 'deck.id is required.'));
  if (!Array.isArray(manifest.slides) || manifest.slides.length === 0) {
    issues.push(issue('error', 'missing-slides', '$.slides', 'At least one slide record is required.'));
    return { issues, objectMapsBySlide };
  }
  const slideNumbers = new Set();
  const seenIds = new Set();
  manifest.slides.forEach((slide, slideIndex) => {
    const slideLocation = `$.slides[${slideIndex}]`;
    if (!isObject(slide) || !Number.isInteger(slide.slide) || slide.slide < 1) {
      issues.push(issue('error', 'invalid-slide-number', `${slideLocation}.slide`, 'slide must be a positive integer in presentation order.'));
      return;
    }
    if (slideNumbers.has(slide.slide)) issues.push(issue('error', 'duplicate-slide-number', `${slideLocation}.slide`, `Duplicate slide number: ${slide.slide}`));
    slideNumbers.add(slide.slide);
    const canvas = slide.canvas;
    if (!isObject(canvas) || !isFiniteNumber(canvas.widthPx) || !isFiniteNumber(canvas.heightPx) || canvas.widthPx <= 0 || canvas.heightPx <= 0) {
      issues.push(issue('error', 'invalid-canvas', `${slideLocation}.canvas`, 'canvas requires positive widthPx and heightPx matching the source image.'));
    }
    if (slide.blank === true) {
      if (!isNonEmptyString(slide.blankReason)) issues.push(issue('error', 'missing-blank-reason', `${slideLocation}.blankReason`, 'A declared blank slide requires a reason.'));
      if (!Array.isArray(slide.regions) || slide.regions.length !== 0) issues.push(issue('error', 'blank-slide-has-regions', `${slideLocation}.regions`, 'A declared blank slide must use an empty regions array.'));
      objectMapsBySlide.set(slide.slide, []);
      return;
    }
    if (!Array.isArray(slide.regions) || slide.regions.length === 0) {
      issues.push(issue('error', 'missing-regions', `${slideLocation}.regions`, 'Each slide needs at least one review region.'));
      return;
    }
    const objectMaps = [];
    slide.regions.forEach((region, regionIndex) => {
      const regionLocation = `${slideLocation}.regions[${regionIndex}]`;
      if (!isObject(region)) {
        issues.push(issue('error', 'invalid-region', regionLocation, 'Each region must be an object.'));
        return;
      }
      if (!isNonEmptyString(region.id)) issues.push(issue('error', 'missing-id', `${regionLocation}.id`, 'Region id is required.'));
      else if (seenIds.has(region.id)) issues.push(issue('error', 'duplicate-id', `${regionLocation}.id`, `Duplicate id: ${region.id}`));
      else seenIds.add(region.id);
      validateBbox(region.bbox, canvas, regionLocation, issues);
      if (!Number.isInteger(region.layer)) issues.push(issue('error', 'invalid-layer', `${regionLocation}.layer`, 'layer must be an integer.'));
      if (!isNonEmptyString(region.role)) issues.push(issue('error', 'missing-role', `${regionLocation}.role`, 'role is required.'));
      if (typeof region.critical !== 'boolean') issues.push(issue('error', 'missing-critical-flag', `${regionLocation}.critical`, 'critical must be true or false.'));
      validateFidelity(region.fidelity, `${regionLocation}.fidelity`, issues);
      if (mode === 'delivery' && region.critical && region.fidelity?.status !== 'verified') {
        issues.push(issue('error', 'critical-region-unverified', `${regionLocation}.fidelity.status`, 'Delivery mode requires every critical region to be verified.'));
      } else if (mode === 'draft' && region.critical && region.fidelity?.status !== 'verified') {
        issues.push(issue('warning', 'critical-region-unverified', `${regionLocation}.fidelity.status`, 'Critical region still needs verification.'));
      }
      if (mode === 'delivery' && region.fidelity?.status === 'failed') {
        issues.push(issue('error', 'region-fidelity-failed', `${regionLocation}.fidelity.status`, 'A failed region cannot be delivered.'));
      } else if (!region.critical && region.fidelity?.status === 'review-needed') {
        issues.push(issue('warning', 'region-review-open', `${regionLocation}.fidelity.status`, 'Non-critical region still has an open fidelity review.'));
      }
      if (!Array.isArray(region.elements) || region.elements.length === 0) {
        issues.push(issue('error', 'missing-elements', `${regionLocation}.elements`, 'Each region needs at least one leaf element.'));
      } else {
        region.elements.forEach((element, elementIndex) => validateElement(element, canvas, `${regionLocation}.elements[${elementIndex}]`, issues, seenIds, objectMaps, mode));
      }
    });
    objectMapsBySlide.set(slide.slide, objectMaps);
  });
  return { issues, objectMapsBySlide };
}

export function loadAndValidateManifest(file, options = {}) {
  const absolute = path.resolve(file);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (error) {
    return {
      manifest: null,
      file: absolute,
      issues: [issue('error', 'manifest-read-failed', '$', error.message)],
      objectMapsBySlide: new Map()
    };
  }
  const result = validateManifest(manifest, options);
  return { manifest, file: absolute, ...result };
}

export function summarizeIssues(issues) {
  return {
    errors: issues.filter(item => item.severity === 'error').length,
    warnings: issues.filter(item => item.severity === 'warning').length
  };
}
