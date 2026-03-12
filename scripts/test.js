import {run} from 'jest';

// Do this as the first thing so that any code reading it knows the right env.
// process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';
process.env.TZ = 'America/New_York';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

let argv = process.argv.slice(2);

// Remove watch if in CI or in coverage mode
if (process.env.CI || process.env.SENTRY_PRECOMMIT || argv.includes('--coverage')) {
  argv = argv.filter(arg => arg !== '--watch');
}

// In CI, when MERGE_BASE is set (PRs), prepend --changedSince and --passWithNoTests
// so Jest parses them as options instead of test patterns.
// This is only set in the frontend workflow (frontend.yml).
if (process.env.CI && process.env.MERGE_BASE) {
  argv = ['--changedSince', process.env.MERGE_BASE, '--passWithNoTests', ...argv];
}

if (process.env.CI) {
  console.log('Running Jest with new argv:', argv);
}

run(argv);
