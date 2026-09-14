import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const skillRoot = path.join(repoRoot, 'skills', 'image-to-editable-ppt');
const require = createRequire(path.join(skillRoot, 'runtime', 'package.json'));
const pptxgen = require('pptxgenjs');

const output = path.resolve(process.argv[2] || path.join(repoRoot, 'tmp', 'regression-fixture.pptx'));
const pptx = new pptxgen();
pptx.defineLayout({ name: 'REFERENCE_CANVAS', width: 12, height: 7.2 });
pptx.layout = 'REFERENCE_CANVAS';
pptx.author = 'image-to-editable-ppt regression fixture';
pptx.subject = 'Synthetic coverage fixture; not evidence of fidelity on a user image.';
pptx.title = 'Image-to-editable-PPT structural regression';
pptx.lang = 'en-US';

const slide = pptx.addSlide();
slide.background = { color: 'F4F0E8' };
slide.addText('REFERENCE RECONSTRUCTION', {
  objectName: 'header-title', x: 0.45, y: 0.3, w: 7.2, h: 0.45, margin: 0,
  fontFace: 'Avenir Next', fontSize: 24, bold: true, color: '17324D', charSpacing: 1.2
});
slide.addText('synthetic structural fixture', {
  objectName: 'header-kicker', x: 8.55, y: 0.34, w: 2.95, h: 0.3, margin: 0,
  fontFace: 'Georgia', italic: true, fontSize: 12, color: '8B4A31', align: 'right'
});

const flowNodes = [
  { x: 0.55, label: 'Input', color: 'D8E8E5' },
  { x: 2.32, label: 'Review', color: 'F3D7B5' },
  { x: 4.09, label: 'Deliver', color: 'D9D7ED' }
];
for (const [index, node] of flowNodes.entries()) {
  slide.addShape(pptx.ShapeType.roundRect, {
    objectName: `flow-node-${index + 1}`, x: node.x, y: 1.48, w: 1.25, h: 0.82,
    rectRadius: 0.08, fill: { color: node.color }, line: { color: '17324D', width: 1.2 }
  });
  slide.addText(node.label, {
    objectName: `flow-label-${index + 1}`, x: node.x + 0.08, y: 1.72, w: 1.09, h: 0.3,
    margin: 0, align: 'center', fontFace: 'Avenir Next', fontSize: 15, bold: true, color: '17324D'
  });
}
for (const [index, x] of [1.83, 3.6].entries()) {
  slide.addShape(pptx.ShapeType.line, {
    objectName: `flow-line-${index + 1}`, x, y: 1.89, w: 0.46, h: 0,
    line: { color: '8B4A31', width: 2, beginArrowType: 'none', endArrowType: 'triangle' }
  });
}
slide.addText('Editable line shapes show direction; they are not connection-bound OOXML connectors.', {
  objectName: 'flow-note', x: 0.58, y: 2.52, w: 4.72, h: 0.55, margin: 0,
  fontFace: 'Georgia', fontSize: 10.5, color: '4F5B66', breakLine: false
});

slide.addChart(pptx.ChartType.bar, [{ name: 'Load', labels: ['A', 'B', 'C', 'D', 'E'], values: [7, 11, 6, 14, 9] }], {
  objectName: 'dense-chart', x: 6.08, y: 1.12, w: 3.15, h: 2.45, barDir: 'col',
  chartColors: ['8B4A31'], showLegend: false, showTitle: true, title: 'Dense chart',
  catAxisLabelFontFace: 'Avenir Next', catAxisLabelFontSize: 9,
  valAxisLabelFontFace: 'Avenir Next', valAxisLabelFontSize: 8,
  showValue: true, dataLabelPosition: 'outEnd', showCatName: false,
  valGridLine: { color: 'D6D0C5', width: 0.5 }, border: { color: 'B8B0A5', width: 0.8 }
});
slide.addTable([
  [{ text: 'Stage', options: { bold: true, color: 'FFFFFF', fill: '17324D' } }, { text: 'Owner', options: { bold: true, color: 'FFFFFF', fill: '17324D' } }],
  ['Map', 'A'], ['Build', 'B'], ['Verify', 'C'], ['Deliver', 'D']
], {
  objectName: 'dense-table', x: 9.42, y: 1.12, w: 2.05, h: 2.45,
  colW: [1.15, 0.9], rowH: 0.43, margin: 0.06, fontFace: 'Avenir Next', fontSize: 9,
  color: '17324D', border: { type: 'solid', color: 'B8B0A5', pt: 0.7 },
  fill: 'FFFDF7', valign: 'mid'
});

slide.addShape(pptx.ShapeType.arc, {
  objectName: 'illustration-arc', x: 0.7, y: 4.15, w: 1.75, h: 1.75,
  adjustPoint: 0.35, rotate: 16, fill: { color: 'D9D7ED', transparency: 20 }, line: { color: '514B7E', width: 2 }
});
slide.addShape(pptx.ShapeType.hexagon, {
  objectName: 'illustration-hexagon', x: 2.06, y: 4.48, w: 1.25, h: 1.08,
  fill: { color: 'D8E8E5' }, line: { color: '2B6F6A', width: 1.5 }
});
slide.addShape(pptx.ShapeType.ellipse, {
  objectName: 'illustration-dot', x: 3.22, y: 4.24, w: 0.62, h: 0.62,
  fill: { color: 'C66B46' }, line: { color: 'C66B46', transparency: 100 }
});
slide.addImage({
  objectName: 'illustration-svg-asset',
  path: path.join(skillRoot, 'assets', 'svg-library-seed', 'icons', 'target.svg'),
  x: 3.68, y: 4.72, w: 0.85, h: 0.85, altText: 'SVG target retained as an image asset'
});
slide.addText('COMPOSITE', {
  objectName: 'illustration-label', x: 0.76, y: 5.97, w: 3.72, h: 0.36,
  margin: 0, fontFace: 'Avenir Next', fontSize: 12, bold: true, color: '514B7E', charSpacing: 2.4
});

slide.addShape(pptx.ShapeType.roundRect, {
  objectName: 'overlap-panel', x: 5.25, y: 4.24, w: 6.25, h: 2.1,
  rectRadius: 0.06, fill: { color: '17324D' }, line: { color: '17324D' }
});
slide.addImage({
  objectName: 'overlap-svg-asset',
  path: path.join(skillRoot, 'assets', 'svg-library-seed', 'icons', 'bar-chart.svg'),
  x: 9.36, y: 4.52, w: 1.44, h: 1.44, transparency: 14,
  altText: 'SVG chart retained beneath native text'
});
slide.addText('TEXT OVER IMAGE', {
  objectName: 'overlap-title', x: 5.72, y: 4.78, w: 4.85, h: 0.48,
  margin: 0, fontFace: 'Georgia', fontSize: 21, bold: true, color: 'FFFDF7'
});
slide.addText('The text remains a single native object; the source asset contains no duplicated lettering.', {
  objectName: 'overlap-copy', x: 5.72, y: 5.38, w: 3.35, h: 0.6,
  margin: 0, fontFace: 'Avenir Next', fontSize: 10.5, color: 'D8E8E5', breakLine: false
});

await pptx.writeFile({ fileName: output });
console.log(output);
