import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const runtimeDist = process.env.PPTXGENJS_DIST || path.join(skillRoot, 'runtime', 'node_modules', 'pptxgenjs', 'dist', 'pptxgen.cjs.js');
const svgRoot = process.env.I2EP_SVG_LIBRARY || path.join(os.homedir(), 'Documents', 'Codex', 'svg-library');
const commandExists = (name) => { try { execFileSync(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: 'ignore' }); return true; } catch { return false; } };
const findWingetPoppler = () => {
  if (process.platform !== 'win32' || !process.env.LOCALAPPDATA) return null;
  const packageRoot = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages');
  try {
    for (const vendorDir of fs.readdirSync(packageRoot)) {
      if (!vendorDir.toLowerCase().startsWith('oschwartz10612.poppler_')) continue;
      const vendorPath = path.join(packageRoot, vendorDir);
      for (const releaseDir of fs.readdirSync(vendorPath)) {
        const candidate = path.join(vendorPath, releaseDir, 'Library', 'bin', 'pdftoppm.exe');
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  } catch { /* Winget Poppler is optional. */ }
  return null;
};
const libreOfficePaths = process.platform === 'darwin'
  ? ['/Applications/LibreOffice.app/Contents/MacOS/soffice']
  : process.platform === 'win32' ? ['C:\\Program Files\\LibreOffice\\program\\soffice.exe'] : [];
const nodeMajor = Number(process.versions.node.split('.')[0]);
const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
const pillowAvailable = commandExists(pythonCommand)
  && spawnSync(pythonCommand, ['-c', 'from PIL import Image; print(Image.__version__)'], { stdio: 'ignore' }).status === 0;

console.log(JSON.stringify({
  platform: process.platform,
  node: process.version,
  nodeSupported: nodeMajor >= 20,
  npm: commandExists('npm'),
  python: commandExists(pythonCommand),
  pillowComparison: pillowAvailable,
  pptxGenJsDist: runtimeDist,
  pptxGenJsAvailable: fs.existsSync(runtimeDist),
  svgLibrary: svgRoot,
  svgLibraryAvailable: fs.existsSync(svgRoot),
  libreOffice: commandExists('soffice') || libreOfficePaths.some(fs.existsSync),
  popplerPdftoppm: commandExists('pdftoppm') || Boolean(findWingetPoppler()),
  powerPointCom: process.platform === 'win32',
  macPowerPointManualQa: process.platform === 'darwin'
}, null, 2));
