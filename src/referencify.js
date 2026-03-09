/**
 * Core referencification logic for wiki-referencify
 * Processes markdown and adds Wikipedia links to concepts/terms
 */

import {
  tokenizeText,
  findSkipRegions,
  generateNgrams,
  applyReplacements,
  isTokenInSkipRegion,
  isStopword,
} from './markdown-processor.js';
import {
  checkWikipediaPages,
  buildWikipediaUrl,
  buildDisambiguationUrl,
  hasDisambiguationPage,
} from './wikipedia-api.js';

/**
 * Filter n-grams to only include meaningful phrases (not stopwords, not too short)
 * @param {Array} ngrams - All n-grams
 * @returns {Array} Filtered n-grams
 */
function filterMeaningfulNgrams(ngrams) {
  return ngrams.filter((ng) => {
    if (ng.length > 1) {
      return true;
    }
    const word = ng.phrase;
    if (word.length < 3) {
      return false;
    }
    return !isStopword(word);
  });
}

/**
 * Find the URL to use for a matched phrase
 * @param {Object} info - Wikipedia page info
 * @param {string} phrase - The phrase to link
 * @param {Function} log - Logger function
 * @returns {Promise<string>} URL to use
 */
async function getUrlForPhrase(info, phrase, log) {
  if (info.isDisambiguation) {
    return buildWikipediaUrl(info.title);
  }
  const disambigExists = await hasDisambiguationPage(phrase);
  if (disambigExists) {
    log(`Using disambiguation URL for: ${phrase}`);
    return buildDisambiguationUrl(phrase);
  }
  return buildWikipediaUrl(info.title);
}

/**
 * Build replacements list using greedy longest-match approach
 * @param {Array} existingNgrams - N-grams that have Wikipedia pages
 * @param {Map} existingPhrases - Map of phrase -> page info
 * @param {Array} allTokens - All tokens from original text
 * @param {string} markdown - Original markdown text
 * @param {Function} log - Logger function
 * @returns {Promise<Array>} List of replacements to apply
 */
async function buildReplacements(
  existingNgrams,
  existingPhrases,
  allTokens,
  markdown,
  log
) {
  const replacements = [];
  const usedTokenIndices = new Set();

  const tokenIndexMap = new Map();
  for (let i = 0; i < allTokens.length; i++) {
    tokenIndexMap.set(allTokens[i], i);
  }

  for (const ngram of existingNgrams) {
    const tokenIndices = ngram.tokens.map((t) => tokenIndexMap.get(t) ?? -1);
    const anyUsed = tokenIndices.some((idx) => usedTokenIndices.has(idx));
    if (anyUsed) {
      continue;
    }

    const info = existingPhrases.get(ngram.phrase);
    const url = await getUrlForPhrase(info, ngram.phrase, log);

    replacements.push({
      start: ngram.start,
      end: ngram.end,
      url,
      text: markdown.slice(ngram.start, ngram.end),
      phrase: ngram.phrase,
      isDisambiguation: info.isDisambiguation,
    });

    for (const idx of tokenIndices) {
      if (idx >= 0) {
        usedTokenIndices.add(idx);
      }
    }
  }

  return replacements;
}

/**
 * Find the best Wikipedia matches for all phrases in markdown text
 * Prefers longest sequences of words that match a single Wikipedia article
 *
 * @param {string} markdown - The markdown text to process
 * @param {Object} options - Processing options
 * @param {boolean} options.autoDisambiguation - Enable auto-disambiguation
 * @param {number} options.maxPhraseLength - Maximum phrase length in words (default: 10)
 * @param {boolean} options.verbose - Enable verbose logging
 * @returns {Promise<string>} Processed markdown with Wikipedia links
 */
export async function referencify(markdown, options = {}) {
  const {
    autoDisambiguation = false,
    maxPhraseLength = 10,
    verbose = false,
  } = options;

  const log = verbose ? console.error.bind(console) : () => {};

  const skipRegions = findSkipRegions(markdown);
  log(`Found ${skipRegions.length} skip regions`);

  const allTokens = tokenizeText(markdown);
  log(`Found ${allTokens.length} tokens`);

  const activeTokens = allTokens.filter(
    (token) => !isTokenInSkipRegion(token, skipRegions)
  );
  log(`Active tokens (not in skip regions): ${activeTokens.length}`);

  const ngrams = generateNgrams(
    activeTokens,
    maxPhraseLength,
    markdown,
    skipRegions
  );
  log(`Generated ${ngrams.length} n-grams`);

  const meaningfulNgrams = filterMeaningfulNgrams(ngrams);
  log(`Meaningful n-grams after stopword filter: ${meaningfulNgrams.length}`);

  const uniquePhrases = [...new Set(meaningfulNgrams.map((ng) => ng.phrase))];
  log(`Unique phrases to check: ${uniquePhrases.length}`);

  log('Checking phrases against Wikipedia API...');
  const pageInfo = await checkWikipediaPages(uniquePhrases);
  log(
    `Wikipedia results: ${Object.values(pageInfo).filter((p) => p.exists).length} found`
  );

  const existingPhrases = new Map();
  for (const phrase of uniquePhrases) {
    const info = pageInfo[phrase];
    if (info?.exists) {
      existingPhrases.set(phrase, info);
    }
  }
  log(`Existing Wikipedia articles: ${existingPhrases.size}`);

  const existingNgrams = meaningfulNgrams
    .filter((ng) => existingPhrases.has(ng.phrase))
    .sort((a, b) => {
      if (a.start !== b.start) {
        return a.start - b.start;
      }
      return b.length - a.length;
    });

  const replacements = await buildReplacements(
    existingNgrams,
    existingPhrases,
    allTokens,
    markdown,
    log
  );
  log(`Selected ${replacements.length} replacements`);

  if (autoDisambiguation && replacements.length > 0) {
    log('Auto-disambiguation mode enabled');
    return applyAutoDisambiguation(markdown, replacements, pageInfo, log);
  }

  return applyReplacements(markdown, replacements);
}

/**
 * Apply auto-disambiguation logic
 * Uses context from exactly matched pages to skip ambiguous terms
 *
 * @param {string} markdown - Original markdown
 * @param {Array} replacements - List of replacements
 * @param {Object} pageInfo - Wikipedia page info
 * @param {Function} log - Logger function
 * @returns {string} Processed markdown
 */
function applyAutoDisambiguation(markdown, replacements, pageInfo, log) {
  const ambiguous = replacements.filter((r) => r.isDisambiguation);
  log(
    `Unambiguous: ${replacements.length - ambiguous.length}, Ambiguous: ${ambiguous.length}`
  );

  const finalReplacements = replacements
    .filter((replacement) => {
      const info = pageInfo[replacement.phrase];
      if (replacement.isDisambiguation || info?.isDisambiguation) {
        log(`Skipping ambiguous term: ${replacement.phrase}`);
        return false;
      }
      return true;
    })
    .map((replacement) => {
      const info = pageInfo[replacement.phrase];
      return { ...replacement, url: buildWikipediaUrl(info.title) };
    });

  log(
    `Final replacements with auto-disambiguation: ${finalReplacements.length}`
  );
  return applyReplacements(markdown, finalReplacements);
}
