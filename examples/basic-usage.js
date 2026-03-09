/**
 * Basic usage example for wiki-referencify
 * Demonstrates how to use the package programmatically
 *
 * Run with any runtime:
 * - Bun: bun examples/basic-usage.js
 * - Node.js: node examples/basic-usage.js
 * - Deno: deno run examples/basic-usage.js
 */

import { referencify } from '../src/index.js';

const markdown = `# Introduction to Machine Learning

Machine learning is a branch of artificial intelligence. It uses algorithms and statistical models.

## Key Libraries

- Python is the most popular language for machine learning.
- NumPy and Pandas are commonly used libraries.
`;

console.log('Input markdown:');
console.log(markdown);

console.log('Processing...');
const result = await referencify(markdown);

console.log('Output with Wikipedia links:');
console.log(result);
