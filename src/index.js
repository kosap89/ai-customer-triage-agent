#!/usr/bin/env node

/**
 * AI Customer Message Triage Agent — CLI entry point (v1)
 *
 * Usage:
 *   node src/index.js                  Interactive mode
 *   node src/index.js --sample 3       Triage sample message #3
 *   node src/index.js --text "..."     Triage custom text
 *   node src/index.js --input-file data/input-message.json  Triage JSON file input
 */

import { triageMessage } from './services/triage-agent.js';
import { formatSummary, formatJson } from './output/formatter.js';
import {
  loadSampleMessages,
  loadMessageFromFile,
  normalizeMessage,
  messageFromText,
} from './lib/message-loader.js';
import { choose, ask } from './cli/prompt.js';
import { TriageError } from './lib/errors.js';

/** Parse simple CLI flags without adding dependencies. */
function parseArgs(argv) {
  const args = { sample: null, text: null, inputFile: null, jsonOnly: false, help: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--json-only') {
      args.jsonOnly = true;
    } else if (arg === '--sample' || arg === '-s') {
      args.sample = parseInt(argv[++i], 10);
    } else if (arg === '--text' || arg === '-t') {
      args.text = argv[++i];
    } else if (arg === '--input-file' || arg === '-f') {
      args.inputFile = argv[++i];
    }
  }

  return args;
}

function printHelp() {
  console.log(`
AI Customer Message Triage Agent v1.0.0

Usage:
  npm start                         Interactive mode
  npm start -- --sample 1             Run sample message #1
  npm start -- --text "Your message"  Triage custom text
  npm start -- --input-file data/input-message.json --json-only
  npm start -- --json-only            JSON output only

Options:
  -s, --sample <n>       Sample message number (1-based)
  -t, --text <msg>       Custom message text
  -f, --input-file <path>  Customer message JSON file
      --json-only        Skip human-readable summary
  -h, --help             Show this help
`);
}

/**
 * Run triage and print results.
 * @param {object} message
 * @param {boolean} jsonOnly
 */
function runTriage(message, jsonOnly) {
  const result = triageMessage(message);

  if (!jsonOnly) {
    console.log(formatSummary(result));
    console.log('── Structured JSON ──\n');
  }

  console.log(formatJson(result));
}

/**
 * Interactive flow: pick sample or type custom message.
 */
async function runInteractive() {
  const mode = await choose('\nHow would you like to provide a message?', [
    'Select a sample customer message',
    'Type a custom message',
  ]);

  if (mode === -1) {
    console.log('Cancelled.');
    return;
  }

  let message;

  if (mode === 0) {
    const samples = await loadSampleMessages();
    const labels = samples.map(
      (m, i) =>
        `[${i + 1}] ${m.customerName} — ${m.subject ?? m.body.slice(0, 40)}…`
    );
    const idx = await choose('\nSelect a sample message:', labels);

    if (idx === -1) {
      console.log('Cancelled.');
      return;
    }

    message = normalizeMessage(samples[idx]);
  } else {
    const text = await ask('\nEnter customer message:\n> ');
    message = messageFromText(text);
  }

  runTriage(message, false);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  try {
    // Non-interactive: --text flag
    if (args.text) {
      runTriage(messageFromText(args.text), args.jsonOnly);
      return;
    }

    // Non-interactive: --input-file flag
    if (args.inputFile) {
      const message = await loadMessageFromFile(args.inputFile);
      runTriage(message, args.jsonOnly);
      return;
    }

    // Non-interactive: --sample flag
    if (args.sample) {
      const samples = await loadSampleMessages();
      const idx = args.sample - 1;

      if (idx < 0 || idx >= samples.length) {
        throw new TriageError(
          `Invalid sample number. Choose 1–${samples.length}.`,
          'INVALID_SAMPLE'
        );
      }

      runTriage(normalizeMessage(samples[idx]), args.jsonOnly);
      return;
    }

    // Default: interactive
    await runInteractive();
  } catch (err) {
    if (err instanceof TriageError) {
      console.error(`\nError [${err.code}]: ${err.message}\n`);
      process.exitCode = 1;
      return;
    }
    console.error('\nUnexpected error:', err.message);
    process.exitCode = 1;
  }
}

main();
