/**
 * Wikipedia API client with caching support
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';
const CACHE_SUBDIR = 'wiki-referencify-cache';

/**
 * Get cache directory path (lazy, computed on first use)
 * @returns {string} Cache directory path
 */
function getCacheDir() {
  return join(tmpdir(), CACHE_SUBDIR);
}

/**
 * Get cache file path for a given cache key
 * @param {string} key - Cache key
 * @returns {string} Cache file path
 */
function getCacheFilePath(key) {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 16);
  return join(getCacheDir(), `${hash}.json`);
}

/**
 * Read from file cache
 * @param {string} key - Cache key
 * @returns {any|null} Cached value or null if not found
 */
function readCache(key) {
  try {
    const filePath = getCacheFilePath(key);
    if (!existsSync(filePath)) {
      return null;
    }
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    return data.value;
  } catch {
    return null;
  }
}

/**
 * Write to file cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 */
function writeCache(key, value) {
  try {
    const cacheDir = getCacheDir();
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }
    const filePath = getCacheFilePath(key);
    writeFileSync(filePath, JSON.stringify({ key, value }), 'utf-8');
  } catch {
    // Ignore cache write errors
  }
}

/**
 * Fetch data from Wikipedia API with caching
 * @param {Object} params - API parameters
 * @returns {Promise<Object>} API response
 */
async function fetchWikipediaApi(params) {
  const urlParams = new URLSearchParams({
    ...params,
    format: 'json',
    origin: '*',
  });
  const url = `${WIKIPEDIA_API_BASE}?${urlParams.toString()}`;

  const cacheKey = url;
  const cached = readCache(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Wikipedia API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  writeCache(cacheKey, data);
  return data;
}

/**
 * Build a reverse map from canonical title to list of original titles
 * @param {Array} normalized - Normalized entries from Wikipedia API
 * @param {Array} redirects - Redirect entries from Wikipedia API
 * @returns {Object} Map of canonical title -> [original titles]
 */
function buildReverseMap(normalized, redirects) {
  const toOriginal = {};
  for (const entry of [...(normalized || []), ...(redirects || [])]) {
    if (!toOriginal[entry.to]) {
      toOriginal[entry.to] = [];
    }
    toOriginal[entry.to].push(entry.from);
  }
  return toOriginal;
}

/**
 * Process a single batch of Wikipedia API results into the results map
 * @param {Object} data - API response data
 * @param {string[]} batch - Original batch of titles
 * @param {Object} results - Results map to populate
 */
function processBatchResults(data, batch, results) {
  const pages = data.query?.pages || {};
  const toOriginal = buildReverseMap(
    data.query?.normalized,
    data.query?.redirects
  );

  for (const page of Object.values(pages)) {
    const exists = page.pageid !== undefined && page.pageid !== -1;
    const isDisambiguation =
      exists && 'disambiguation' in (page.pageprops || {});
    const result = {
      exists,
      title: page.title,
      pageId: page.pageid,
      isDisambiguation,
    };

    results[page.title] = result;
    for (const originalTitle of toOriginal[page.title] || []) {
      results[originalTitle] = result;
    }
  }

  for (const inputTitle of batch) {
    if (!(inputTitle in results)) {
      results[inputTitle] = {
        exists: false,
        title: inputTitle,
        pageId: undefined,
        isDisambiguation: false,
      };
    }
  }
}

/**
 * Check if multiple titles exist in Wikipedia and get their page properties
 * @param {string[]} titles - Array of titles to check
 * @returns {Promise<Object>} Map of title -> page info
 */
export async function checkWikipediaPages(titles) {
  if (titles.length === 0) {
    return {};
  }

  const batchSize = 50;
  const results = {};

  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize);
    const data = await fetchWikipediaApi({
      action: 'query',
      titles: batch.join('|'),
      prop: 'pageprops|info',
      redirects: '1',
    });
    processBatchResults(data, batch, results);
  }

  return results;
}

/**
 * Build Wikipedia URL for a given title
 * @param {string} title - Wikipedia article title
 * @returns {string} Full Wikipedia URL
 */
export function buildWikipediaUrl(title) {
  const encodedTitle = title.replace(/ /g, '_');
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(encodedTitle)}`;
}

/**
 * Build Wikipedia disambiguation URL for a given title
 * @param {string} title - Wikipedia article title (without disambiguation suffix)
 * @returns {string} Full Wikipedia disambiguation URL
 */
export function buildDisambiguationUrl(title) {
  const disambigTitle = `${title}_(disambiguation)`;
  const encodedTitle = disambigTitle.replace(/ /g, '_');
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(encodedTitle)}`;
}

/**
 * Check if a disambiguation page exists for a title
 * @param {string} title - Wikipedia article title
 * @returns {Promise<boolean>} True if disambiguation page exists
 */
export async function hasDisambiguationPage(title) {
  const disambigTitle = `${title} (disambiguation)`;
  const pageInfo = await checkWikipediaPages([disambigTitle]);
  return pageInfo[disambigTitle]?.exists === true;
}
