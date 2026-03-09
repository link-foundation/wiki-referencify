/**
 * Markdown processor for wiki-referencify
 * Parses markdown and identifies text that should be linked
 */

/**
 * Common English words that are too trivial to link
 * These appear in Wikipedia but are not useful as references
 */
const STOPWORDS = new Set([
  // Articles and prepositions
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'up',
  'about',
  'into',
  'through',
  'during',
  'out',
  'off',
  'over',
  'under',
  'after',
  'before',
  'between',
  'against',
  'along',
  'amid',
  'among',
  'around',
  'beyond',
  'despite',
  'except',
  'inside',
  'near',
  'outside',
  'past',
  'since',
  'toward',
  'upon',
  'within',
  // Conjunctions and particles
  'if',
  'as',
  'than',
  'then',
  'when',
  'where',
  'why',
  'while',
  'because',
  'although',
  'though',
  'unless',
  'until',
  'since',
  'once',
  'again',
  'further',
  'here',
  'there',
  'so',
  'yet',
  'nor',
  'not',
  'no',
  // Auxiliary verbs
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'can',
  'shall',
  'ought',
  // Pronouns
  'that',
  'this',
  'these',
  'those',
  'it',
  'its',
  "it's",
  'they',
  'them',
  'their',
  'we',
  'us',
  'our',
  'you',
  'your',
  'he',
  'she',
  'his',
  'her',
  'i',
  'me',
  'my',
  'who',
  'which',
  'what',
  'how',
  // Common determiners and quantifiers
  'also',
  'just',
  'more',
  'most',
  'other',
  'some',
  'such',
  'only',
  'very',
  'both',
  'each',
  'few',
  'all',
  'any',
  'same',
  'too',
  'now',
  'non',
  'many',
  'much',
  'own',
  'first',
  'last',
  'new',
  'back',
  'well',
  'even',
  'still',
  'already',
  'quite',
  'rather',
  'really',
  'simply',
  'however',
  'therefore',
  'otherwise',
  'hence',
  'thus',
  'instead',
  'indeed',
  // Common verbs (often too generic)
  'see',
  'know',
  'make',
  'use',
  'take',
  'go',
  'get',
  'give',
  'say',
  'find',
  'think',
  'tell',
  'work',
  'call',
  'try',
  'ask',
  'need',
  'feel',
  'become',
  'leave',
  'put',
  'mean',
  'keep',
  'let',
  'begin',
  'show',
  'hear',
  'play',
  'run',
  'move',
  'live',
  'believe',
  'hold',
  'bring',
  'happen',
  'write',
  'provide',
  'sit',
  'stand',
  'lose',
  'pay',
  'meet',
  'include',
  'continue',
  'set',
  'turn',
  'follow',
  'create',
  'add',
  'allow',
  'change',
  'help',
  'focus',
  'build',
  'learn',
  'define',
  'define',
  'describe',
  'refer',
  'based',
  'given',
  'used',
  'called',
  'named',
  'known',
  'seen',
  'found',
  'shown',
  'considered',
  'defined',
  'described',
  'related',
  'associated',
  'building',
  'built',
  'builds',
  'modified',
  'modifies',
  'modify',
  'focused',
  'focuses',
  'focusing',
  'header',
  'headers',
  'footer',
  'systems',
  'system',
  'region',
  'regions',
  'maps',
  'map',
  'shows',
  'showing',
  'shown',
  'displays',
  'display',
  // Common adjectives (too generic to be concepts)
  'good',
  'bad',
  'big',
  'small',
  'large',
  'little',
  'long',
  'short',
  'high',
  'low',
  'old',
  'young',
  'early',
  'late',
  'hard',
  'easy',
  'free',
  'open',
  'close',
  'full',
  'empty',
  'whole',
  'half',
  'single',
  'double',
  'multiple',
  'common',
  'general',
  'specific',
  'simple',
  'complex',
  'basic',
  'advanced',
  'modern',
  'recent',
  'current',
  'original',
  'various',
  'different',
  'similar',
  'same',
  'certain',
  'clear',
  'true',
  'false',
  'possible',
  'available',
  'important',
  'popular',
  'famous',
  'significant',
  'typical',
  'normal',
  'standard',
  'special',
  'unique',
  'main',
  'major',
  'minor',
  'primary',
  'secondary',
  'local',
  'global',
  'public',
  'private',
  'personal',
  'physical',
  'natural',
  'human',
  'social',
  'political',
  'economic',
  'historical',
  'traditional',
  'practical',
  // Common generic nouns that are too broad
  'thing',
  'things',
  'way',
  'ways',
  'part',
  'parts',
  'kind',
  'kinds',
  'type',
  'types',
  'form',
  'forms',
  'area',
  'areas',
  'field',
  'fields',
  'level',
  'levels',
  'group',
  'groups',
  'number',
  'numbers',
  'case',
  'cases',
  'place',
  'places',
  'point',
  'points',
  'line',
  'lines',
  'side',
  'sides',
  'fact',
  'facts',
  'result',
  'results',
  'example',
  'examples',
  'problem',
  'problems',
  'question',
  'questions',
  'answer',
  'answers',
  'idea',
  'ideas',
  'word',
  'words',
  'term',
  'terms',
  'name',
  'names',
  'text',
  'content',
  'information',
  'data',
  'value',
  'values',
  'item',
  'items',
  'list',
  'lists',
  'step',
  'steps',
  'method',
  'methods',
  'approach',
  'process',
  'feature',
  'features',
  'note',
  'notes',
  'purpose',
  'concept',
  'concepts',
  'version',
  'versions',
  'file',
  'files',
  'page',
  'pages',
  'link',
  'links',
  'section',
  'sections',
  'chapter',
  'chapters',
  'table',
  'tables',
  'image',
  'images',
  'figure',
  'figures',
]);

/**
 * Check if a word is a stopword (should not be linked alone)
 * @param {string} word - Word to check (case-insensitive)
 * @returns {boolean}
 */
export function isStopword(word) {
  return STOPWORDS.has(word.toLowerCase());
}

/**
 * Extract all words and their positions from text, tokenizing into segments
 * @param {string} text - Input text
 * @returns {Array<{word: string, start: number, end: number}>} Array of word tokens
 */
export function tokenizeText(text) {
  const tokens = [];
  // Match sequences of word characters (letters, digits, hyphens within words)
  const regex = /[A-Za-z][A-Za-z0-9'-]*/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return tokens;
}

/**
 * Check if a position falls within any of the given ranges
 * @param {number} pos - Position to check
 * @param {Array<{start: number, end: number}>} ranges - Array of ranges
 * @returns {boolean}
 */
function isInRange(pos, ranges) {
  return ranges.some((r) => pos >= r.start && pos < r.end);
}

/**
 * Add all regex matches to regions array with a given reason
 * @param {string} text - Text to search
 * @param {RegExp} regex - Regex to match
 * @param {string} reason - Reason label for the region
 * @param {Array} regions - Array to push matches into
 */
function addRegexRegions(text, regex, reason, regions) {
  let match;
  while ((match = regex.exec(text)) !== null) {
    regions.push({
      start: match.index,
      end: match.index + match[0].length,
      reason,
    });
  }
}

/**
 * Add setext-style header regions (underlined with === or ---)
 * @param {string} markdown - Markdown content
 * @param {Array} regions - Array to push matches into
 */
function addSetextHeaderRegions(markdown, regions) {
  const setextRegex = /^(.+)\n[=-]{2,}\s*$/gm;
  let match;
  while ((match = setextRegex.exec(markdown)) !== null) {
    const lineEnd = markdown.indexOf('\n', match.index);
    regions.push({
      start: match.index,
      end: lineEnd > 0 ? lineEnd : match.index + match[0].length,
      reason: 'setext-header',
    });
  }
}

/**
 * Add table header regions (rows immediately before separator rows)
 * @param {string} markdown - Markdown content
 * @param {Array} regions - Array to push matches into
 */
function addTableHeaderRegions(markdown, regions) {
  const tableHeaderRegex = /^\|.+\|$/gm;
  let match;
  while ((match = tableHeaderRegex.exec(markdown)) !== null) {
    const nextLineStart = match.index + match[0].length + 1;
    const nextLineEnd = markdown.indexOf('\n', nextLineStart);
    const nextLine =
      nextLineEnd > 0
        ? markdown.slice(nextLineStart, nextLineEnd)
        : markdown.slice(nextLineStart);
    if (/^\|[\s|:-]+\|$/.test(nextLine)) {
      regions.push({
        start: match.index,
        end: match.index + match[0].length,
        reason: 'table-header',
      });
    }
  }
}

/**
 * Find all regions in the markdown that should be skipped (headers, links, code blocks)
 * @param {string} markdown - Markdown content
 * @returns {Array<{start: number, end: number, reason: string}>} Ranges to skip
 */
export function findSkipRegions(markdown) {
  const regions = [];

  // ATX-style headers (# Header)
  addRegexRegions(markdown, /^#{1,6}\s+.+$/gm, 'header', regions);
  // Setext-style headers (underlined with === or ---)
  addSetextHeaderRegions(markdown, regions);
  // Fenced code blocks: ```code``` (must be before inline code)
  addRegexRegions(markdown, /```[\s\S]*?```/g, 'fenced-code', regions);
  // Inline code: `code`
  addRegexRegions(markdown, /`[^`]+`/g, 'inline-code', regions);
  // Indented code blocks (4 spaces)
  addRegexRegions(markdown, /^( {4}|\t).+$/gm, 'indented-code', regions);
  // Existing markdown links: [text](url)
  addRegexRegions(markdown, /\[([^\]]*)\]\([^)]*\)/g, 'link', regions);
  // Reference-style links: [text][ref]
  addRegexRegions(markdown, /\[([^\]]*)\]\[[^\]]*\]/g, 'ref-link', regions);
  // Reference-style link definitions: [ref]: url
  addRegexRegions(markdown, /^\[[^\]]+\]:\s*.+$/gm, 'ref-def', regions);
  // HTML comments
  addRegexRegions(markdown, /<!--[\s\S]*?-->/g, 'html-comment', regions);
  // HTML tags
  addRegexRegions(markdown, /<[^>]+>/g, 'html-tag', regions);
  // Markdown formatting markers (bold, italic) - boundaries to prevent spanning
  addRegexRegions(markdown, /\*{1,3}|_{1,3}/g, 'formatting-marker', regions);
  // Table separator rows (|---|)
  addRegexRegions(markdown, /^\|[\s|:-]+\|$/gm, 'table-separator', regions);
  // Table header rows (rows immediately before separator rows)
  addTableHeaderRegions(markdown, regions);

  return regions;
}

/**
 * Check if two consecutive tokens are truly adjacent in the original text
 * (only whitespace between them, no markdown formatting markers)
 * @param {Object} token1 - First token
 * @param {Object} token2 - Second token
 * @param {string} text - Original text
 * @param {Array<{start: number, end: number, reason: string}>} skipRegions - Skip regions
 * @returns {boolean}
 */
function areTokensAdjacent(token1, token2, text, skipRegions) {
  const between = text.slice(token1.end, token2.start);
  // Only whitespace allowed between tokens in a phrase
  if (!/^\s+$/.test(between)) {
    return false;
  }
  // Check that no formatting markers are in the between region
  const hasBoundary = skipRegions.some(
    (r) =>
      r.reason === 'formatting-marker' &&
      r.start >= token1.end &&
      r.end <= token2.start
  );
  return !hasBoundary;
}

/**
 * Generate all possible n-grams (phrases) from an array of tokens
 * Only includes n-grams where all tokens are consecutive (no markdown markers between)
 * @param {Array<{word: string, start: number, end: number}>} tokens - Word tokens
 * @param {number} maxN - Maximum n-gram size
 * @param {string} originalText - Original text for adjacency check
 * @param {Array} skipRegions - Skip regions including formatting markers
 * @returns {Array<{phrase: string, tokens: Array, start: number, end: number}>}
 */
export function generateNgrams(
  tokens,
  maxN = 10,
  originalText = '',
  skipRegions = []
) {
  const ngrams = [];
  for (let i = 0; i < tokens.length; i++) {
    for (let n = 1; n <= Math.min(maxN, tokens.length - i); n++) {
      const tokenSlice = tokens.slice(i, i + n);

      // For n > 1, verify all consecutive pairs are adjacent (no markers between)
      if (n > 1 && originalText) {
        let allAdjacent = true;
        for (let j = 0; j < tokenSlice.length - 1; j++) {
          if (
            !areTokensAdjacent(
              tokenSlice[j],
              tokenSlice[j + 1],
              originalText,
              skipRegions
            )
          ) {
            allAdjacent = false;
            break;
          }
        }
        if (!allAdjacent) {
          break; // If pair j..j+1 is not adjacent, j+1..j+2 won't be either
        }
      }

      const phrase = tokenSlice.map((t) => t.word).join(' ');
      ngrams.push({
        phrase,
        tokens: tokenSlice,
        start: tokenSlice[0].start,
        end: tokenSlice[tokenSlice.length - 1].end,
        length: n,
      });
    }
  }
  return ngrams;
}

/**
 * Apply link replacements to markdown text
 * @param {string} markdown - Original markdown
 * @param {Array<{start: number, end: number, url: string, text: string}>} replacements - Replacements to apply
 * @returns {string} Modified markdown
 */
export function applyReplacements(markdown, replacements) {
  // Sort replacements by start position descending to apply from end to start
  const sorted = [...replacements].sort((a, b) => b.start - a.start);

  let result = markdown;
  for (const { start, end, url, text } of sorted) {
    const link = `[${text}](${url})`;
    result = result.slice(0, start) + link + result.slice(end);
  }

  return result;
}

/**
 * Check if a token is in a skip region
 * @param {{start: number, end: number}} token - Token to check
 * @param {Array<{start: number, end: number}>} skipRegions - Regions to skip
 * @returns {boolean}
 */
export function isTokenInSkipRegion(token, skipRegions) {
  return (
    isInRange(token.start, skipRegions) || isInRange(token.end - 1, skipRegions)
  );
}
