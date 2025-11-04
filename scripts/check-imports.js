#!/usr/bin/env node
/*
  Fails if banned low-level SDKs are imported directly in Quantum app code.
  Allow only @ipayx/* client packages at app level.
*/
import { execSync } from 'node:child_process';

const banned = [
  '@hashgraph/sdk',
  '@chainlink/',
  'circle',
  'wormhole',
  'tronweb',
];

function grepImports(pattern) {
  try {
    // Look for import/require statements with the banned package
    // This will match any occurrence, we filter relative paths below
    const out = execSync(
      `git ls-files | grep -E "\\.(ts|tsx|js|jsx)$" | xargs grep -nH -E '(import|require).*["'"'"'].*${pattern}'`,
      { stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const lines = out.toString().trim().split('\n');
    
    // Filter out relative imports (./  ../ or /)
    const filtered = lines.filter(line => {
      const match = line.match(/["']([^"']+)["']/);
      if (!match) return false;
      const importPath = match[1];
      // Exclude if it starts with ./ or ../ or /
      return !importPath.startsWith('./') && !importPath.startsWith('../') && !importPath.startsWith('/');
    });
    
    return filtered.join('\n');
  } catch {
    return '';
  }
}

let failures = [];
for (const token of banned) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hits = grepImports(esc);
  if (hits) failures.push({ token, hits });
}

if (failures.length) {
  console.error('❌ Import guard failed. Banned imports detected in Quantum:');
  for (const f of failures) {
    console.error(`\n> ${f.token}\n${f.hits}`);
  }
  process.exit(1);
}

console.log('✅ Import guard passed.');
