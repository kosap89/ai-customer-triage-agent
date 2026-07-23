import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Simple interactive CLI prompts (no extra dependencies).
 */

/**
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function ask(question) {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

/**
 * @param {string} question
 * @param {string[]} options - Display labels
 * @returns {Promise<number>} Selected index (0-based), or -1 on invalid
 */
export async function choose(question, options) {
  console.log(question);
  options.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt}`);
  });

  const raw = await ask('\nEnter number (or press Enter to cancel): ');
  if (!raw) return -1;

  const num = parseInt(raw, 10);
  if (Number.isNaN(num) || num < 1 || num > options.length) {
    return -1;
  }
  return num - 1;
}
