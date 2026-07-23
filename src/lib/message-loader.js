import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FileLoadError, ValidationError } from './errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_MESSAGES_PATH = join(__dirname, '../../data/sample-messages.json');

/**
 * Load sample customer messages from disk.
 * @returns {Promise<Array<object>>}
 */
export async function loadSampleMessages() {
  let raw;
  try {
    raw = await readFile(SAMPLE_MESSAGES_PATH, 'utf-8');
  } catch (err) {
    throw new FileLoadError(
      `Could not read sample messages at ${SAMPLE_MESSAGES_PATH}: ${err.message}`
    );
  }

  let messages;
  try {
    messages = JSON.parse(raw);
  } catch {
    throw new FileLoadError('Sample messages file contains invalid JSON.');
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new FileLoadError('Sample messages file must be a non-empty array.');
  }

  return messages;
}

/**
 * Normalize user or sample input into a consistent message object.
 * @param {object} input
 * @returns {object}
 */
export function normalizeMessage(input) {
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (!body) {
    throw new ValidationError('Message body cannot be empty.');
  }

  return {
    id: input.id ?? `custom-${Date.now()}`,
    customerName: input.customerName?.trim() || 'Unknown Customer',
    channel: input.channel?.trim() || 'manual',
    subject: input.subject?.trim() || null,
    body,
  };
}

/**
 * Build a message object from raw CLI text input.
 * @param {string} text
 * @returns {object}
 */
export function messageFromText(text) {
  const trimmed = text?.trim();
  if (!trimmed) {
    throw new ValidationError('Please enter a message or choose a sample.');
  }
  return normalizeMessage({ body: trimmed, channel: 'cli' });
}
