import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const checker = path.join(scriptDir, '..', 'skills', 'image-to-editable-ppt', 'scripts', 'check-env.mjs');
const result = spawnSync(process.execPath, [checker], { stdio: 'inherit' });
process.exit(result.status ?? 1);
