/**
 * Tests for wiki-referencify
 * Works with Node.js, Bun, and Deno
 */

import { describe, it, expect } from 'test-anywhere';
import {
  tokenizeText,
  findSkipRegions,
  generateNgrams,
  applyReplacements,
  isTokenInSkipRegion,
  isStopword,
} from '../src/markdown-processor.js';
import {
  buildWikipediaUrl,
  buildDisambiguationUrl,
} from '../src/wikipedia-api.js';

describe('tokenizeText', () => {
  it('should tokenize simple text', () => {
    const tokens = tokenizeText('Machine learning');
    expect(tokens.length).toBe(2);
    expect(tokens[0].word).toBe('Machine');
    expect(tokens[1].word).toBe('learning');
  });

  it('should track positions correctly', () => {
    const tokens = tokenizeText('Hello world');
    expect(tokens[0].start).toBe(0);
    expect(tokens[0].end).toBe(5);
    expect(tokens[1].start).toBe(6);
    expect(tokens[1].end).toBe(11);
  });

  it('should handle empty text', () => {
    const tokens = tokenizeText('');
    expect(tokens.length).toBe(0);
  });

  it('should skip punctuation', () => {
    const tokens = tokenizeText('Hello, world!');
    expect(tokens.length).toBe(2);
    expect(tokens[0].word).toBe('Hello');
    expect(tokens[1].word).toBe('world');
  });
});

describe('findSkipRegions', () => {
  it('should skip ATX headers', () => {
    const regions = findSkipRegions('# Header Title\n\nNormal text.');
    const headerRegion = regions.find((r) => r.reason === 'header');
    expect(headerRegion !== undefined).toBe(true);
    expect(headerRegion.start).toBe(0);
  });

  it('should skip existing markdown links', () => {
    const text = 'See [existing link](https://example.com) for details.';
    const regions = findSkipRegions(text);
    const linkRegion = regions.find((r) => r.reason === 'link');
    expect(linkRegion !== undefined).toBe(true);
  });

  it('should skip inline code', () => {
    const text = 'Use `console.log()` for debugging.';
    const regions = findSkipRegions(text);
    const codeRegion = regions.find((r) => r.reason === 'inline-code');
    expect(codeRegion !== undefined).toBe(true);
  });

  it('should skip fenced code blocks', () => {
    const text = '```\nconst x = 1;\n```';
    const regions = findSkipRegions(text);
    const codeRegion = regions.find((r) => r.reason === 'fenced-code');
    expect(codeRegion !== undefined).toBe(true);
  });

  it('should skip table headers', () => {
    const text =
      '| Column 1 | Column 2 |\n|----------|----------|\n| data | more |\n';
    const regions = findSkipRegions(text);
    const headerRegion = regions.find((r) => r.reason === 'table-header');
    expect(headerRegion !== undefined).toBe(true);
  });
});

describe('isTokenInSkipRegion', () => {
  it('should return true for tokens in skip regions', () => {
    const token = { start: 2, end: 8, word: 'Header' };
    const regions = [{ start: 0, end: 10 }];
    expect(isTokenInSkipRegion(token, regions)).toBe(true);
  });

  it('should return false for tokens outside skip regions', () => {
    const token = { start: 15, end: 21, word: 'Normal' };
    const regions = [{ start: 0, end: 10 }];
    expect(isTokenInSkipRegion(token, regions)).toBe(false);
  });

  it('should filter header tokens correctly', () => {
    const markdown = '# Header\n\nNormal text.';
    const regions = findSkipRegions(markdown);
    const tokens = tokenizeText(markdown);
    const active = tokens.filter((t) => !isTokenInSkipRegion(t, regions));
    const words = active.map((t) => t.word);
    expect(words.includes('Header')).toBe(false);
    expect(words.includes('Normal')).toBe(true);
  });
});

describe('generateNgrams', () => {
  it('should generate unigrams', () => {
    const tokens = tokenizeText('Machine learning');
    const ngrams = generateNgrams(tokens, 1);
    expect(ngrams.length).toBe(2);
    expect(ngrams[0].phrase).toBe('Machine');
    expect(ngrams[1].phrase).toBe('learning');
  });

  it('should generate bigrams', () => {
    const tokens = tokenizeText('Machine learning');
    const ngrams = generateNgrams(tokens, 2);
    const bigrams = ngrams.filter((ng) => ng.length === 2);
    expect(bigrams.length).toBe(1);
    expect(bigrams[0].phrase).toBe('Machine learning');
  });

  it('should not create ngrams spanning markdown markers', () => {
    const text = '**Atlas** and Python';
    const regions = findSkipRegions(text);
    const tokens = tokenizeText(text).filter(
      (t) => !isTokenInSkipRegion(t, regions)
    );
    const ngrams = generateNgrams(tokens, 5, text, regions);
    // "Atlas and" should not exist since "**" formatting marker is between
    const hasAtlasAnd = ngrams.some((ng) => ng.phrase === 'Atlas and');
    expect(hasAtlasAnd).toBe(false);
  });

  it('should track ngram position in original text', () => {
    const text = 'Machine learning algorithm';
    const tokens = tokenizeText(text);
    const ngrams = generateNgrams(tokens, 3);
    const mlNgram = ngrams.find((ng) => ng.phrase === 'Machine learning');
    expect(mlNgram !== undefined).toBe(true);
    expect(mlNgram.start).toBe(0);
    expect(mlNgram.end).toBe(16);
  });
});

describe('applyReplacements', () => {
  it('should apply single replacement', () => {
    const text = 'Machine learning is powerful.';
    const replacements = [
      {
        start: 0,
        end: 16,
        url: 'https://en.wikipedia.org/wiki/Machine_learning',
        text: 'Machine learning',
      },
    ];
    const result = applyReplacements(text, replacements);
    expect(result).toBe(
      '[Machine learning](https://en.wikipedia.org/wiki/Machine_learning) is powerful.'
    );
  });

  it('should apply multiple replacements in correct order', () => {
    const text = 'Python and machine learning';
    const replacements = [
      {
        start: 0,
        end: 6,
        url: 'https://en.wikipedia.org/wiki/Python',
        text: 'Python',
      },
      {
        start: 11,
        end: 27,
        url: 'https://en.wikipedia.org/wiki/Machine_learning',
        text: 'machine learning',
      },
    ];
    const result = applyReplacements(text, replacements);
    expect(result).toBe(
      '[Python](https://en.wikipedia.org/wiki/Python) and [machine learning](https://en.wikipedia.org/wiki/Machine_learning)'
    );
  });

  it('should handle empty replacements', () => {
    const text = 'No links here.';
    const result = applyReplacements(text, []);
    expect(result).toBe('No links here.');
  });
});

describe('isStopword', () => {
  it('should identify common function words as stopwords', () => {
    expect(isStopword('the')).toBe(true);
    expect(isStopword('and')).toBe(true);
    expect(isStopword('is')).toBe(true);
    expect(isStopword('a')).toBe(true);
  });

  it('should not identify technical terms as stopwords', () => {
    expect(isStopword('Python')).toBe(false);
    expect(isStopword('Wikipedia')).toBe(false);
    expect(isStopword('JavaScript')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(isStopword('THE')).toBe(true);
    expect(isStopword('The')).toBe(true);
  });
});

describe('buildWikipediaUrl', () => {
  it('should build correct URL for simple title', () => {
    const url = buildWikipediaUrl('Python');
    expect(url).toBe('https://en.wikipedia.org/wiki/Python');
  });

  it('should replace spaces with underscores', () => {
    const url = buildWikipediaUrl('Machine learning');
    expect(url).toBe('https://en.wikipedia.org/wiki/Machine_learning');
  });
});

describe('buildDisambiguationUrl', () => {
  it('should build correct disambiguation URL', () => {
    const url = buildDisambiguationUrl('Atlas');
    expect(url.startsWith('https://en.wikipedia.org/wiki/Atlas')).toBe(true);
    expect(url.includes('disambiguation')).toBe(true);
  });

  it('should handle multi-word titles', () => {
    const url = buildDisambiguationUrl('Artificial intelligence');
    expect(
      url.startsWith('https://en.wikipedia.org/wiki/Artificial_intelligence')
    ).toBe(true);
    expect(url.includes('disambiguation')).toBe(true);
  });
});
