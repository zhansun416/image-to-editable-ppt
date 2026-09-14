import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadAndValidateManifest, summarizeIssues } from './lib/reconstruction-manifest.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const require = createRequire(path.join(skillRoot, 'runtime', 'package.json'));
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');

const args = process.argv.slice(2);
const pptxArg = args.shift();
const option = (flag, fallback = undefined) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const manifestArg = option('--manifest');
const mode = option('--mode', 'draft');
if (!pptxArg || !['draft', 'delivery'].includes(mode)) {
  throw new Error('Usage: node inspect-ppt.mjs <deck.pptx> [--manifest reconstruction.json] [--mode draft|delivery]');
}
if (mode === 'delivery' && !manifestArg) {
  throw new Error('Delivery inspection requires --manifest <reconstruction.json>.');
}

const pptx = path.resolve(pptxArg);
const packageIssues = [];
const inspectionIssues = [];
const packageIssue = (code, part, message) => packageIssues.push({ severity: 'error', code, part, message });
const inspectionIssue = (severity, code, location, message) => inspectionIssues.push({ severity, code, location, message });
const localName = (node) => node?.localName || String(node?.nodeName || '').split(':').pop();
const childElements = (node) => Array.from(node?.childNodes || []).filter(child => child.nodeType === 1);
const descendants = (node, wanted) => {
  const found = [];
  const visit = (current) => {
    for (const child of childElements(current)) {
      if (localName(child) === wanted) found.push(child);
      visit(child);
    }
  };
  visit(node);
  return found;
};
const firstDescendant = (node, wanted) => descendants(node, wanted)[0] || null;
const attr = (node, wanted) => {
  for (const attribute of Array.from(node?.attributes || [])) {
    if (attribute.localName === wanted || attribute.name === wanted) return attribute.value;
  }
  return null;
};
const relationshipId = (node) => {
  for (const attribute of Array.from(node?.attributes || [])) {
    if (attribute.localName === 'id' && /\/relationships\/?$/.test(attribute.namespaceURI || '')) return attribute.value;
  }
  return null;
};
const resolvePart = (sourcePart, target) => target.startsWith('/')
  ? path.posix.normalize(target.replace(/^\/+/, ''))
  : path.posix.normalize(path.posix.join(path.posix.dirname(sourcePart), target));
const relsPartFor = (sourcePart) => path.posix.join(path.posix.dirname(sourcePart), '_rels', `${path.posix.basename(sourcePart)}.rels`);

function parseXml(text, part) {
  try {
    return new DOMParser({
      onError(level, message) {
        throw new Error(`${level}: ${message}`);
      }
    }).parseFromString(text, 'application/xml');
  } catch (error) {
    packageIssue('malformed-xml', part, error.message);
    return null;
  }
}

const zip = await JSZip.loadAsync(fs.readFileSync(pptx));
const names = Object.keys(zip.files).filter(name => !zip.files[name].dir);
const requiredParts = ['[Content_Types].xml', 'ppt/presentation.xml', 'ppt/_rels/presentation.xml.rels'];
for (const required of requiredParts) if (!names.includes(required)) packageIssue('missing-required-part', required, 'Required OOXML package part is missing.');

const parsed = new Map();
for (const name of names.filter(name => name.endsWith('.xml') || name.endsWith('.rels'))) {
  const text = await zip.file(name).async('string');
  const document = parseXml(text, name);
  if (document) parsed.set(name, document);
}

const relationshipCache = new Map();
function relationshipMap(sourcePart) {
  if (relationshipCache.has(sourcePart)) return relationshipCache.get(sourcePart);
  const relsPart = relsPartFor(sourcePart);
  const document = parsed.get(relsPart);
  if (!document) {
    const empty = new Map();
    relationshipCache.set(sourcePart, empty);
    return empty;
  }
  const result = new Map();
  for (const relationship of descendants(document, 'Relationship')) {
    const id = attr(relationship, 'Id');
    const target = attr(relationship, 'Target');
    const targetMode = attr(relationship, 'TargetMode');
    if (!id || !target) {
      packageIssue('invalid-relationship', relsPart, 'Relationship is missing Id or Target.');
      continue;
    }
    result.set(id, {
      id,
      target,
      targetMode,
      resolved: targetMode === 'External' ? target : resolvePart(sourcePart, target)
    });
    if (targetMode !== 'External' && !names.includes(resolvePart(sourcePart, target))) {
      packageIssue('missing-relationship-target', relsPart, `Relationship ${id} points to missing part ${resolvePart(sourcePart, target)}.`);
    }
  }
  relationshipCache.set(sourcePart, result);
  return result;
}

for (const relsPart of names.filter(name => name.endsWith('.rels'))) {
  if (relsPart === '_rels/.rels') relationshipMap('');
  else {
    const match = relsPart.match(/^(.*)\/_rels\/([^/]+)\.rels$/);
    if (match) relationshipMap(path.posix.join(match[1], match[2]));
    else packageIssue('unrecognized-relationship-part', relsPart, 'Relationship part path could not be associated with a source part.');
  }
}

const presentationPart = 'ppt/presentation.xml';
const presentation = parsed.get(presentationPart);
const presentationRels = relationshipMap(presentationPart);
const orderedSlides = [];
if (presentation) {
  for (const slideId of descendants(presentation, 'sldId')) {
    const relationId = relationshipId(slideId);
    const relationship = presentationRels.get(relationId);
    if (!relationship || relationship.targetMode === 'External') {
      packageIssue('unresolved-slide-relationship', presentationPart, `Slide relationship ${relationId || '(missing)'} cannot be resolved.`);
      continue;
    }
    if (!names.includes(relationship.resolved)) {
      packageIssue('missing-slide-part', relationship.resolved, 'Presentation slide order points to a missing slide part.');
      continue;
    }
    orderedSlides.push(relationship.resolved);
  }
}
if (orderedSlides.length === 0) packageIssue('no-slides', presentationPart, 'No resolvable slides were found in presentation order.');

let slideSize = null;
if (presentation) {
  const size = firstDescendant(presentation, 'sldSz');
  const cx = Number(attr(size, 'cx'));
  const cy = Number(attr(size, 'cy'));
  if (cx > 0 && cy > 0) slideSize = { widthEmu: cx, heightEmu: cy, widthIn: cx / 914400, heightIn: cy / 914400, aspectRatio: cx / cy };
  else packageIssue('invalid-slide-size', presentationPart, 'Presentation slide size is missing or invalid.');
}

function objectIdentity(element) {
  const properties = firstDescendant(element, 'cNvPr');
  return { id: attr(properties, 'id'), name: attr(properties, 'name') };
}

function objectBbox(element) {
  const transform = firstDescendant(element, 'xfrm');
  const offset = transform ? firstDescendant(transform, 'off') : null;
  const extent = transform ? firstDescendant(transform, 'ext') : null;
  const values = [attr(offset, 'x'), attr(offset, 'y'), attr(extent, 'cx'), attr(extent, 'cy')];
  if (values.some(value => value === null)) return null;
  const [x, y, w, h] = values.map(Number);
  return [x, y, w, h].every(Number.isFinite) ? { xEmu: x, yEmu: y, widthEmu: w, heightEmu: h } : null;
}

function embeddedTargets(element, relationships) {
  const ids = new Set();
  for (const node of [...descendants(element, 'blip'), ...descendants(element, 'svgBlip')]) {
    const id = attr(node, 'embed') || attr(node, 'link');
    if (id) ids.add(id);
  }
  return [...ids].map(id => relationships.get(id)).filter(Boolean);
}

function inspectSlide(slidePart, slideNumber) {
  const document = parsed.get(slidePart);
  if (!document) return { slide: slideNumber, part: slidePart, objects: [], error: 'Slide XML could not be parsed.' };
  const relationships = relationshipMap(slidePart);
  const objects = [];
  const addObject = (element, type, extra = {}, parentGroup = null) => {
    const identity = objectIdentity(element);
    const bbox = objectBbox(element);
    objects.push({
      id: identity.id,
      name: identity.name,
      type,
      parentGroup,
      bbox: bbox ? { ...bbox, coordinateSpace: parentGroup ? 'parent-group' : 'slide' } : null,
      ...extra
    });
  };
  const visit = (container, parentGroup = null) => {
    for (const element of childElements(container)) {
      const kind = localName(element);
      if (kind === 'AlternateContent') {
        const choice = childElements(element).find(child => localName(child) === 'Choice') || childElements(element).find(child => localName(child) === 'Fallback');
        if (choice) visit(choice, parentGroup);
      } else if (kind === 'grpSp') {
        const identity = objectIdentity(element);
        addObject(element, 'group', {}, parentGroup);
        visit(element, identity.name || parentGroup);
      } else if (kind === 'sp') {
        const shapeProperties = childElements(element).find(child => localName(child) === 'spPr');
        const directShapeProperties = childElements(shapeProperties);
        const lineProperties = directShapeProperties.find(child => localName(child) === 'ln');
        const textBox = attr(firstDescendant(element, 'cNvSpPr'), 'txBox') === '1'
          || (descendants(element, 'txBody').length > 0
            && directShapeProperties.some(child => localName(child) === 'noFill')
            && lineProperties && childElements(lineProperties).length === 0 && (lineProperties.attributes?.length || 0) === 0);
        const geometry = attr(firstDescendant(element, 'prstGeom'), 'prst');
        const customGeometry = descendants(element, 'custGeom').length > 0;
        const type = textBox ? 'text' : ['line', 'lineInv'].includes(geometry) ? 'line' : 'shape';
        const text = descendants(element, 't').map(node => node.textContent || '').join('');
        addObject(element, type, { geometry: customGeometry ? 'custom' : geometry || null, ...(text ? { text } : {}) }, parentGroup);
      } else if (kind === 'cxnSp') {
        addObject(element, 'connector', {}, parentGroup);
      } else if (kind === 'pic') {
        const targets = embeddedTargets(element, relationships);
        const resolvedTargets = targets.map(item => item.resolved);
        const hasSvgBlip = descendants(element, 'svgBlip').length > 0;
        const hasSvgTarget = resolvedTargets.some(target => /\.svg(?:$|[?#])/i.test(target));
        const rasterTarget = resolvedTargets.some(target => /\.(?:png|jpe?g|gif|bmp|tiff?)(?:$|[?#])/i.test(target));
        const type = hasSvgBlip || hasSvgTarget ? 'picture-svg' : rasterTarget ? 'picture-raster' : 'picture-unknown';
        addObject(element, type, { mediaTargets: resolvedTargets }, parentGroup);
      } else if (kind === 'graphicFrame') {
        const graphicData = firstDescendant(element, 'graphicData');
        const uri = attr(graphicData, 'uri') || '';
        const type = uri.includes('/chart') || descendants(element, 'chart').length > 0 ? 'chart'
          : uri.includes('/table') || descendants(element, 'tbl').length > 0 ? 'table'
            : 'unknown';
        addObject(element, type, uri ? { graphicDataUri: uri } : {}, parentGroup);
      } else if (kind === 'spTree' || kind === 'Choice' || kind === 'Fallback') {
        visit(element, parentGroup);
      }
    }
  };
  const tree = firstDescendant(document, 'spTree');
  if (!tree) packageIssue('missing-shape-tree', slidePart, 'Slide has no shape tree.');
  else visit(tree);
  return { slide: slideNumber, part: slidePart, objects };
}

const slides = orderedSlides.map((part, index) => inspectSlide(part, index + 1));
for (const slide of slides) {
  const namesSeen = new Map();
  for (const object of slide.objects) {
    if (!object.name) inspectionIssue('error', 'unnamed-object', `slide ${slide.slide}`, `Object id ${object.id || '(missing)'} has no stable name.`);
    else if (namesSeen.has(object.name)) inspectionIssue('error', 'duplicate-object-name', `slide ${slide.slide}`, `Object name "${object.name}" is duplicated.`);
    else namesSeen.set(object.name, object);
    if (object.type === 'unknown' || object.type === 'picture-unknown') {
      inspectionIssue('warning', 'unknown-object-type', `slide ${slide.slide}/${object.name || object.id}`, 'Object type could not be classified; it is not counted as native editable content.');
    }
  }
}

let manifestReport = null;
if (manifestArg) {
  const validation = loadAndValidateManifest(manifestArg, { mode });
  manifestReport = { file: validation.file, mode, ...summarizeIssues(validation.issues), issues: validation.issues, mapping: [] };
  if (validation.manifest) {
    const manifestSlideNumbers = new Set((validation.manifest.slides || []).map(slide => slide.slide));
    const manifestSlidesByNumber = new Map((validation.manifest.slides || []).map(slide => [slide.slide, slide]));
    for (const slide of slides) {
      if (!manifestSlideNumbers.has(slide.slide)) {
        manifestReport.issues.push({ severity: 'error', code: 'ppt-slide-unmanifested', location: `slide ${slide.slide}`, message: 'Every actual slide, including a blank slide, requires a manifest record.' });
      }
      if (manifestSlidesByNumber.get(slide.slide)?.blank === true && slide.objects.length > 0) {
        manifestReport.issues.push({ severity: 'error', code: 'declared-blank-slide-has-objects', location: `slide ${slide.slide}`, message: 'Manifest declares this slide blank, but the PPTX contains objects.' });
      }
      const actualByName = new Map(slide.objects.filter(object => object.name).map(object => [object.name, object]));
      const mappings = validation.objectMapsBySlide.get(slide.slide) || [];
      const mappedNames = new Set();
      for (const mapping of mappings) {
        if (mappedNames.has(mapping.name)) {
          manifestReport.issues.push({ severity: 'error', code: 'duplicate-manifest-mapping', location: mapping.location, message: `PowerPoint object "${mapping.name}" is mapped by more than one element.` });
          continue;
        }
        mappedNames.add(mapping.name);
        const actual = actualByName.get(mapping.name);
        const typeMatches = actual?.type === mapping.type;
        const geometryMatches = !mapping.geometry || actual?.geometry === mapping.geometry;
        const status = !actual ? 'missing' : !typeMatches ? 'type-mismatch' : !geometryMatches ? 'geometry-mismatch' : 'matched';
        manifestReport.mapping.push({ slide: slide.slide, name: mapping.name, expectedType: mapping.type, actualType: actual?.type || null, expectedGeometry: mapping.geometry || null, actualGeometry: actual?.geometry || null, elementId: mapping.elementId, status });
        if (status === 'missing') manifestReport.issues.push({ severity: 'error', code: 'mapped-object-missing', location: mapping.location, message: `No object named "${mapping.name}" exists on slide ${slide.slide}.` });
        if (status === 'type-mismatch') manifestReport.issues.push({ severity: 'error', code: 'mapped-object-type-mismatch', location: mapping.location, message: `Object "${mapping.name}" is ${actual.type}, not ${mapping.type}.` });
        if (status === 'geometry-mismatch') manifestReport.issues.push({ severity: 'error', code: 'mapped-object-geometry-mismatch', location: mapping.location, message: `Object "${mapping.name}" geometry is ${actual.geometry || 'unknown'}, not ${mapping.geometry}.` });
      }
      for (const object of slide.objects) {
        if (!object.name || mappedNames.has(object.name)) continue;
        manifestReport.issues.push({ severity: mode === 'delivery' ? 'error' : 'warning', code: 'ppt-object-unmapped', location: `slide ${slide.slide}/${object.name}`, message: 'PowerPoint object is not mapped by any manifest leaf element.' });
      }
    }
    const actualSlideNumbers = new Set(slides.map(slide => slide.slide));
    for (const manifestSlide of validation.manifest.slides || []) {
      if (!actualSlideNumbers.has(manifestSlide.slide)) manifestReport.issues.push({ severity: 'error', code: 'manifest-slide-missing', location: `manifest slide ${manifestSlide.slide}`, message: 'Manifest refers to a slide outside the presentation.' });
      const canvas = manifestSlide.canvas;
      if (slideSize && canvas?.widthPx > 0 && canvas?.heightPx > 0) {
        const manifestRatio = canvas.widthPx / canvas.heightPx;
        const relativeDifference = Math.abs(manifestRatio - slideSize.aspectRatio) / slideSize.aspectRatio;
        if (relativeDifference > 0.005) manifestReport.issues.push({ severity: 'error', code: 'manifest-canvas-aspect-mismatch', location: `manifest slide ${manifestSlide.slide}/canvas`, message: `Source canvas ratio ${manifestRatio.toFixed(6)} differs from slide ratio ${slideSize.aspectRatio.toFixed(6)}.` });
      }
    }
  }
  const counts = summarizeIssues(manifestReport.issues);
  manifestReport.errors = counts.errors;
  manifestReport.warnings = counts.warnings;
}

const typeCounts = {};
for (const slide of slides) for (const object of slide.objects) typeCounts[object.type] = (typeCounts[object.type] || 0) + 1;
const report = {
  pptx,
  packageVerification: {
    status: packageIssues.length === 0 ? 'verified' : 'failed',
    scope: 'Checks XML well-formedness, required parts, internal relationship targets, presentation slide order, slide size, object classification, and optional manifest mapping. It does not verify rendering or prove that every source-image element was inventoried.',
    parsedXmlParts: parsed.size,
    requiredPartsChecked: requiredParts,
    issues: packageIssues
  },
  presentationOrder: orderedSlides,
  slideSize,
  summary: {
    slides: slides.length,
    objects: slides.reduce((total, slide) => total + slide.objects.length, 0),
    byType: typeCounts,
    charts: names.filter(name => /^ppt\/charts\/chart\d+\.xml$/.test(name)).length,
    mediaAssets: names.filter(name => name.startsWith('ppt/media/')).length
  },
  inspectionIssues,
  slides,
  manifest: manifestReport
};
console.log(JSON.stringify(report, null, 2));
if (packageIssues.length > 0 || inspectionIssues.some(item => item.severity === 'error') || (manifestReport?.errors || 0) > 0) process.exitCode = 1;
