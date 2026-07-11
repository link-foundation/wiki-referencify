/**
 * Test how lino-arguments parses positional arguments
 */

import { makeConfig } from 'lino-arguments';

const config = makeConfig({
  argv: ['node', 'cli.js', '--verbose', 'test.md'],
  yargs: ({ yargs }) =>
    yargs.option('verbose', { type: 'boolean', default: false }).help(),
});

console.log('config:', JSON.stringify(config, null, 2));
