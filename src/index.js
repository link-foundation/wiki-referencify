/**
 * wiki-referencify - A tool to cover most concepts/terms in a markdown document
 * with links to Wikipedia
 */

export { referencify } from './referencify.js';
export {
  checkWikipediaPages,
  buildWikipediaUrl,
  buildDisambiguationUrl,
} from './wikipedia-api.js';
export {
  tokenizeText,
  findSkipRegions,
  generateNgrams,
  applyReplacements,
} from './markdown-processor.js';
