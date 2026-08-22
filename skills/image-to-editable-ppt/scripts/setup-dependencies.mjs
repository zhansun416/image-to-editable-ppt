import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = new Set(process.argv.slice(2));
const knownArgs = new Set(['--with-ocr', '--with-inpaint', '--skip-node']);
for (const arg of args) {
  if (!knownArgs.has(arg)) throw new Error(`Unknown argument: ${arg}`);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const runtime = path.join(skillRoot, 'runtime');
const run = (command, commandArgs, options = {}) => {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}.`);
};

const npmArgs = ['install', '--prefix', runtime, '--omit=dev', '--ignore-scripts'];
const windowsNpmCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
if (!args.has('--skip-node')) {
  if (process.platform === 'win32' && fs.existsSync(windowsNpmCli)) run(process.execPath, [windowsNpmCli, ...npmArgs]);
  else run('npm', npmArgs);
}
const python = process.platform === 'win32' ? 'python' : 'python3';
if (args.has('--with-ocr')) run(python, ['-m', 'pip', 'install', '-r', path.join(runtime, 'requirements-ocr.txt')]);
if (args.has('--with-inpaint')) run(python, ['-m', 'pip', 'install', '-r', path.join(runtime, 'requirements-inpaint.txt')]);

console.log(JSON.stringify({
  runtime,
  coreNodeInstalled: !args.has('--skip-node'),
  ocrInstalled: args.has('--with-ocr'),
  inpaintInstalled: args.has('--with-inpaint')
}, null, 2));
