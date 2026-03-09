/**
 * Test how bold text is handled
 */

import {
  tokenizeText,
  findSkipRegions,
  isTokenInSkipRegion,
} from '../src/markdown-processor.js';

const text = '- **Atlas**: A famous atlas';
console.log('Text:', JSON.stringify(text));

const tokens = tokenizeText(text);
console.log('\nTokens:');
for (const t of tokens) {
  console.log(`  [${t.start}-${t.end}] "${t.word}"`);
}

const regions = findSkipRegions(text);
console.log('\nSkip regions:');
for (const r of regions) {
  console.log(
    `  [${r.start}-${r.end}] ${r.reason}: "${text.slice(r.start, r.end)}"`
  );
}

console.log('\nActive tokens:');
const active = tokens.filter((t) => !isTokenInSkipRegion(t, regions));
for (const t of active) {
  console.log(`  [${t.start}-${t.end}] "${t.word}"`);
}
