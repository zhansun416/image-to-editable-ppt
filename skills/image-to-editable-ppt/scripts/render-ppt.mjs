import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const [pptx, output] = process.argv.slice(2);
if (!pptx || !output) throw new Error('Usage: node render-ppt.mjs <deck.pptx> <output-dir>');
if (!fs.existsSync(pptx)) throw new Error(`PPTX file not found: ${pptx}`);
const commandExists = (name) => { try { execFileSync(process.platform === 'win32' ? 'where' : 'which', [name], { stdio: 'ignore' }); return true; } catch { return false; } };
const libreOffice = process.env.SOFFICE_BIN || (commandExists('soffice') ? 'soffice' : process.platform === 'win32' && fs.existsSync('C:\\Program Files\\LibreOffice\\program\\soffice.exe') ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe' : process.platform === 'darwin' && fs.existsSync('/Applications/LibreOffice.app/Contents/MacOS/soffice') ? '/Applications/LibreOffice.app/Contents/MacOS/soffice' : null);
if (!libreOffice) throw new Error('LibreOffice soffice is required. Set SOFFICE_BIN when it is not on PATH.');

fs.mkdirSync(output, { recursive: true });
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'i2ep-render-'));
try {
  const conversion = spawnSync(libreOffice, ['--headless', '--convert-to', 'pdf', '--outdir', temp, path.resolve(pptx)], { stdio: 'inherit' });
  if (conversion.error) throw conversion.error;
  if (conversion.status !== 0) throw new Error(`LibreOffice exited with status ${conversion.status}.`);
  const pdf = path.join(temp, `${path.parse(pptx).name}.pdf`);
  if (!fs.existsSync(pdf)) throw new Error('LibreOffice did not produce a PDF.');
  if (commandExists('pdftoppm')) {
    const pages = spawnSync('pdftoppm', ['-png', '-r', '150', pdf, path.join(path.resolve(output), 'slide')], { stdio: 'inherit' });
    if (pages.error) throw pages.error;
    if (pages.status !== 0) throw new Error(`pdftoppm exited with status ${pages.status}.`);
    console.log(`Rendered PNG pages in ${path.resolve(output)}`);
  } else {
    const target = path.join(path.resolve(output), 'render.pdf');
    fs.copyFileSync(pdf, target);
    console.log(`Created ${target}. Install Poppler (pdftoppm) for PNG pages.`);
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
