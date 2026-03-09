/**
 * Experiment to test the full referencify function end-to-end
 * Run with: node experiments/test-full-referencify.mjs
 */

import { referencify } from '../src/referencify.js';

const markdown = `# Introduction to Machine Learning

Machine learning is a branch of artificial intelligence that focuses on building systems that learn from data.

## Key Concepts

- **Atlas**: A famous atlas shows maps of various regions.
- **Python**: Python is a popular programming language for machine learning.
- [Already linked](https://example.com) text should not be modified.
- Headers should not have their content linked.

## Table of Contents

| Topic | Description |
|-------|-------------|
| ML | Machine Learning |
`;

console.log('=== Input Markdown ===');
console.log(markdown);

console.log('=== Processing... ===');
const result = await referencify(markdown, { verbose: true });

console.log('\n=== Output Markdown ===');
console.log(result);
