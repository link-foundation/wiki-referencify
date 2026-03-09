/**
 * Experiment to test Wikipedia API integration
 * Run with: node experiments/test-wikipedia-api.mjs
 */

import {
  checkWikipediaPages,
  buildWikipediaUrl,
  buildDisambiguationUrl,
  hasDisambiguationPage,
} from '../src/wikipedia-api.js';

console.log('=== Testing checkWikipediaPages ===');
const titles = [
  'Machine learning',
  'Atlas',
  'Python',
  'xyz-nonexistent-page-12345',
  'Artificial intelligence',
];
console.log(`Checking: ${titles.join(', ')}`);
const results = await checkWikipediaPages(titles);
for (const [title, info] of Object.entries(results)) {
  console.log(
    `  "${title}": exists=${info.exists}, isDisambig=${info.isDisambiguation}, id=${info.pageId}`
  );
}

console.log('\n=== Testing buildWikipediaUrl ===');
console.log(buildWikipediaUrl('Machine learning'));
console.log(buildWikipediaUrl('Atlas'));

console.log('\n=== Testing buildDisambiguationUrl ===');
console.log(buildDisambiguationUrl('Atlas'));
console.log(buildDisambiguationUrl('Python'));

console.log('\n=== Testing hasDisambiguationPage ===');
const atlasHasDisambig = await hasDisambiguationPage('Atlas');
console.log(`Atlas has disambiguation: ${atlasHasDisambig}`);
const mlHasDisambig = await hasDisambiguationPage('Machine learning');
console.log(`Machine learning has disambiguation: ${mlHasDisambig}`);
