#!/usr/bin/env node
/**
 * wiki-referencify CLI entry point
 * A tool to cover most concepts/terms in a markdown document with links to Wikipedia
 */

import { readFileSync } from 'node:fs';
import { makeConfig } from 'lino-arguments';
import { referencify } from './referencify.js';

const config = makeConfig({
  yargs: ({ yargs, getenv }) =>
    yargs
      .usage('Usage: wiki-referencify [options] [file]')
      .option('file', {
        type: 'string',
        describe: 'Markdown file to process (reads from stdin if not provided)',
        alias: 'f',
      })
      .option('auto-disambiguation', {
        type: 'boolean',
        describe:
          'Automatically resolve disambiguation pages using context from other matched terms',
        default: getenv('WIKI_AUTO_DISAMBIGUATION', false),
      })
      .option('max-phrase-length', {
        type: 'number',
        describe: 'Maximum number of words to consider as a single phrase',
        default: getenv('WIKI_MAX_PHRASE_LENGTH', 10),
      })
      .option('verbose', {
        type: 'boolean',
        describe: 'Enable verbose logging to stderr',
        default: getenv('WIKI_VERBOSE', false),
        alias: 'v',
      })
      .help()
      .alias('help', 'h'),
});

async function main() {
  let markdown;
  // Support both --file option and bare positional argument
  // Since makeConfig filters out `_` (positional args), we check process.argv for extra args
  const extraArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  const file =
    config.file ||
    (extraArgs.length > 0 ? extraArgs[extraArgs.length - 1] : null);

  if (file) {
    try {
      markdown = readFileSync(file, 'utf-8');
    } catch (error) {
      console.error(`Error reading file: ${error.message}`);
      process.exit(1);
    }
  } else {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    markdown = Buffer.concat(chunks).toString('utf-8');
  }

  try {
    const result = await referencify(markdown, {
      autoDisambiguation: config.autoDisambiguation,
      maxPhraseLength: config.maxPhraseLength,
      verbose: config.verbose,
    });
    process.stdout.write(result);
  } catch (error) {
    console.error(`Error processing markdown: ${error.message}`);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
