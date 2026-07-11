/**
 * Debug why Atlas is not being linked in bold context
 */

import {
  tokenizeText,
  findSkipRegions,
  generateNgrams,
  isTokenInSkipRegion,
} from '../src/markdown-processor.js';
import {
  checkWikipediaPages,
  hasDisambiguationPage,
} from '../src/wikipedia-api.js';

const text = '- **Atlas**: A famous atlas shows maps.';
console.log('Text:', JSON.stringify(text));

const tokens = tokenizeText(text);
const regions = findSkipRegions(text);
const active = tokens.filter((t) => !isTokenInSkipRegion(t, regions));

console.log(
  '\nActive tokens:',
  active.map((t) => `"${t.word}"(${t.start})`)
);

const ngrams = generateNgrams(active, 5, text, regions);
console.log(
  '\nNgrams:',
  ngrams.map((ng) => `"${ng.phrase}"(${ng.start}-${ng.end})`)
);

const phrases = ngrams.map((ng) => ng.phrase);
console.log('\nChecking Wikipedia for:', phrases);
const pageInfo = await checkWikipediaPages(phrases);

for (const [title, info] of Object.entries(pageInfo)) {
  if (info.exists) {
    console.log(
      `  "${title}": exists=${info.exists}, isDisambig=${info.isDisambiguation}`
    );
  }
}

// Specifically check Atlas
console.log('\nChecking Atlas specifically:');
const atlasInfo = await checkWikipediaPages(['Atlas', 'atlas']);
for (const [title, info] of Object.entries(atlasInfo)) {
  console.log(
    `  "${title}": exists=${info.exists}, isDisambig=${info.isDisambiguation}`
  );
}

console.log(
  '\nHas disambiguation "Atlas":',
  await hasDisambiguationPage('Atlas')
);
console.log(
  'Has disambiguation "atlas":',
  await hasDisambiguationPage('atlas')
);
