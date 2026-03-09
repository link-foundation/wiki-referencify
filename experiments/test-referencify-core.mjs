/**
 * Experiment to test the core referencify logic
 * Run with: node experiments/test-referencify-core.mjs
 */

import {
  tokenizeText,
  findSkipRegions,
  generateNgrams,
  isTokenInSkipRegion,
} from '../src/markdown-processor.js';

console.log('=== Testing tokenizeText ===');
const text = 'Machine learning is a subset of artificial intelligence.';
const tokens = tokenizeText(text);
console.log(
  'Tokens:',
  tokens.map((t) => `"${t.word}"(${t.start}-${t.end})`).join(', ')
);

console.log('\n=== Testing findSkipRegions ===');
const markdown = `# Header Title

This is normal text with [an existing link](https://example.com).

## Another Header

More text here with \`inline code\` and a term.

| Column 1 | Column 2 |
|----------|----------|
| Cell     | Data     |
`;

const skipRegions = findSkipRegions(markdown);
console.log('Skip regions:');
for (const r of skipRegions) {
  console.log(
    `  [${r.start}-${r.end}] ${r.reason}: "${markdown.slice(r.start, r.end).slice(0, 40).replace(/\n/g, '\\n')}..."`
  );
}

console.log('\n=== Testing ngrams ===');
const simpleText = 'Machine learning algorithm';
const simpleTokens = tokenizeText(simpleText);
const ngrams = generateNgrams(simpleTokens, 3);
console.log(
  'Ngrams:',
  ngrams.map((ng) => `"${ng.phrase}"(len=${ng.length})`).join(', ')
);

console.log('\n=== Testing skip region filter ===');
const headerText = '# Header\n\nNormal text.';
const headerSkipRegions = findSkipRegions(headerText);
const headerTokens = tokenizeText(headerText);
const activeTokens = headerTokens.filter(
  (t) => !isTokenInSkipRegion(t, headerSkipRegions)
);
console.log('All tokens:', headerTokens.map((t) => `"${t.word}"`).join(', '));
console.log(
  'Active tokens:',
  activeTokens.map((t) => `"${t.word}"`).join(', ')
);
