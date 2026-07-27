#!/usr/bin/env node

/**
 * Demo CLI for experimental healthcare shift matching.
 * Uses fictional sample data only — not connected to any real staffing system.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { matchShiftToWorkers } from './shift-matcher.js';
import { formatMatchSummary, formatMatchJson } from './format-match-result.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHIFT_PATH = join(__dirname, 'data/open-shift.json');
const WORKERS_PATH = join(__dirname, 'data/workers.json');

async function loadJson(path, label) {
  let raw;
  try {
    raw = await readFile(path, 'utf-8');
  } catch (err) {
    throw new Error(`Could not read ${label} at ${path}: ${err.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${label} contains invalid JSON.`);
  }
}

async function main() {
  try {
    const shift = await loadJson(SHIFT_PATH, 'open shift data');
    const workers = await loadJson(WORKERS_PATH, 'worker data');

    if (!Array.isArray(workers) || workers.length === 0) {
      throw new Error('Worker data must be a non-empty array.');
    }

    const result = matchShiftToWorkers(shift, workers);

    console.log(formatMatchSummary(result));
    console.log('── Structured JSON ──\n');
    console.log(formatMatchJson(result));
  } catch (err) {
    console.error(`\nMatch demo error: ${err.message}\n`);
    process.exitCode = 1;
  }
}

main();
