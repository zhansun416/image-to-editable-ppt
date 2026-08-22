import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const runtimeDist = process.env.PPTXGENJS_DIST || path.join(skillRoot, 'runtime', 'node_modules', 'pptxgenjs', 'dist', 'pptxgen.cjs.js');
const svgRoot = process.env.I2EP_SVG_LIBRARY || path.join(os.homedir(), 'Documents', 'Codex', 'svg-library');
const commandExists = (name) => { try { execFileSync(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: 'ignore' }); return true; } catch { return false; } };
const libreOfficePaths = process.platform === 'darwin'
  ? ['/Applications/LibreOffice.app/Contents/MacOS/soffice']
  : process.platform === 'win32' ? ['C:\\Program Files\\LibreOffice\\program\\soffice.exe'] : [];
const nodeMajor = Number(process.versions.node.split('.')[0]);

console.log(JSON.stringify({
  platform: process.platform,
  node: process.version,
  nodeSupported: nodeMajor >= 20,
  npm: commandExists('npm'),
  python: commandExists(process.platform === 'win32' ? 'python' : 'python3'),
  pptxGenJsDist: runtimeDist,
  pptxGenJsAvailable: fs.existsSync(runtimeDist),
  svgLibrary: svgRoot,
  svgLibraryAvailable: fs.existsSync(svgRoot),
  libreOffice: commandExists('soffice') || libreOfficePaths.some(fs.existsSync),
  popplerPdftoppm: commandExists('pdftoppm'),
  powerPointCom: process.platform === 'win32',
  macPowerPointManualQa: process.platform === 'darwin'
}, null, 2));
