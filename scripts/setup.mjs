import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const installer = path.join(scriptDir, '..', 'skills', 'image-to-editable-ppt', 'scripts', 'setup-dependencies.mjs');
const result = spawnSync(process.execPath, [installer, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 1);
