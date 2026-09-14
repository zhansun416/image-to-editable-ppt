import { loadAndValidateManifest, summarizeIssues } from './lib/reconstruction-manifest.mjs';

const args = process.argv.slice(2);
const file = args.shift();
const modeIndex = args.indexOf('--mode');
const mode = modeIndex >= 0 ? args[modeIndex + 1] : 'draft';
if (!file || !['draft', 'delivery'].includes(mode)) {
  throw new Error('Usage: node check-manifest.mjs <manifest.json> [--mode draft|delivery]');
}
const result = loadAndValidateManifest(file, { mode });
const summary = summarizeIssues(result.issues);
console.log(JSON.stringify({ manifest: result.file, mode, ...summary, issues: result.issues }, null, 2));
if (summary.errors > 0) process.exitCode = 1;
