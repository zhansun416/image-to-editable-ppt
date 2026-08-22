import fs from 'node:fs';
import JSZip from 'jszip';

const pptx = process.argv[2];
if (!pptx) throw new Error('Usage: node inspect-ppt.mjs <deck.pptx>');
const zip = await JSZip.loadAsync(fs.readFileSync(pptx));
const names = Object.keys(zip.files);
const slides = names.filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name)).length;
const charts = names.filter(name => /^ppt\/charts\/chart\d+\.xml$/.test(name)).length;
const media = names.filter(name => name.startsWith('ppt/media/')).length;
if (!names.includes('[Content_Types].xml') || slides < 1) throw new Error('PPTX package is missing required content or slides.');
console.log(JSON.stringify({ pptx, slides, charts, mediaAssets: media, packageIntegrity: 'passed' }, null, 2));
