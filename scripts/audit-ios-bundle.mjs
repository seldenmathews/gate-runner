import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const FORBIDDEN = [
  'process.emitWarning',
  'THREE_CJS_DEPRECATED',
  "require('fs')",
  'require("fs")',
  "require('node:fs')",
  'require("node:fs")',
  "require('child_process')",
  'require("child_process")',
];

function walk(dir, files) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) walk(full, files);
    else if (/\.(js|hbc|bundle|map)$/.test(name)) files.push(full);
  }
  return files;
}

export function findForbidden(root) {
  const hits = [];
  for (const file of walk(root, [])) {
    const text = readFileSync(file);
    const source = text.toString('utf8');
    for (const token of FORBIDDEN) {
      if (source.includes(token)) hits.push({ file, token });
    }
  }
  return hits;
}

function main() {
  const root = process.argv[2];
  if (!root) {
    console.error('usage: node scripts/audit-ios-bundle.mjs <expo-export-dir>');
    process.exit(1);
  }
  const hits = findForbidden(root);
  if (hits.length === 0) {
    console.log(`iOS bundle audit passed (${root})`);
    return;
  }
  console.error('iOS bundle contains a Node-only API:');
  for (const hit of hits) console.error(`  ${hit.token} in ${hit.file}`);
  process.exit(1);
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) main();
