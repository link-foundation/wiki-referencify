/**
 * wiki-referencify type definitions
 */

/**
 * Options for referencify function
 */
export interface ReferencifyOptions {
  /** Automatically resolve disambiguation pages using context from other matched terms */
  autoDisambiguation?: boolean;
  /** Maximum number of words to consider as a single phrase */
  maxPhraseLength?: number;
  /** Enable verbose logging to stderr */
  verbose?: boolean;
}

/**
 * Wikipedia page information
 */
export interface WikipediaPageInfo {
  /** Whether the page exists */
  exists: boolean;
  /** Canonical page title */
  title: string;
  /** Wikipedia page ID */
  pageId: number;
  /** Whether this page is a disambiguation page */
  isDisambiguation: boolean;
}

/**
 * Word token from tokenization
 */
export interface Token {
  /** The word text */
  word: string;
  /** Start position in the original text */
  start: number;
  /** End position in the original text */
  end: number;
}

/**
 * N-gram (phrase) from tokenization
 */
export interface Ngram {
  /** The phrase text (words joined with spaces) */
  phrase: string;
  /** Individual tokens in this ngram */
  tokens: Token[];
  /** Start position in the original text */
  start: number;
  /** End position in the original text */
  end: number;
  /** Number of words in this ngram */
  length: number;
}

/**
 * Region in markdown text to skip
 */
export interface SkipRegion {
  /** Start position */
  start: number;
  /** End position */
  end: number;
  /** Reason for skipping */
  reason: string;
}

/**
 * Process a markdown document and add Wikipedia links to concepts/terms
 * @param markdown - The markdown text to process
 * @param options - Processing options
 * @returns Promise resolving to the processed markdown with Wikipedia links
 */
export declare function referencify(
  markdown: string,
  options?: ReferencifyOptions
): Promise<string>;

/**
 * Check if multiple Wikipedia pages exist and get their properties
 * @param titles - Array of page titles to check
 * @returns Promise resolving to a map of title -> page info
 */
export declare function checkWikipediaPages(
  titles: string[]
): Promise<Record<string, WikipediaPageInfo>>;

/**
 * Build a Wikipedia URL for a given title
 * @param title - Wikipedia article title
 * @returns Full Wikipedia URL
 */
export declare function buildWikipediaUrl(title: string): string;

/**
 * Build a Wikipedia disambiguation URL for a given title
 * @param title - Wikipedia article title (without disambiguation suffix)
 * @returns Full Wikipedia disambiguation URL
 */
export declare function buildDisambiguationUrl(title: string): string;

/**
 * Tokenize text into words with positions
 * @param text - Input text
 * @returns Array of word tokens
 */
export declare function tokenizeText(text: string): Token[];

/**
 * Find all regions in markdown that should be skipped
 * @param markdown - Markdown content
 * @returns Array of skip regions
 */
export declare function findSkipRegions(markdown: string): SkipRegion[];

/**
 * Generate all n-grams from an array of tokens
 * @param tokens - Word tokens
 * @param maxN - Maximum n-gram size
 * @returns Array of n-grams
 */
export declare function generateNgrams(tokens: Token[], maxN?: number): Ngram[];

/**
 * Apply link replacements to markdown text
 * @param markdown - Original markdown
 * @param replacements - Replacements to apply
 * @returns Modified markdown
 */
export declare function applyReplacements(
  markdown: string,
  replacements: Array<{ start: number; end: number; url: string; text: string }>
): string;
