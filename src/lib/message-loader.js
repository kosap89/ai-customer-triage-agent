import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
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

/**
 * Load and validate a single customer message from a JSON file.
 * Expected format: { id?, customerName?, channel?, subject?, body }
 *
 * @param {string} filePath - Path to JSON file (relative or absolute)
 * @returns {Promise<object>}
 */
export async function loadMessageFromFile(filePath) {
  const resolvedPath = resolve(filePath);

  let raw;
  try {
    raw = await readFile(resolvedPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new FileLoadError(`Input file not found: ${resolvedPath}`);
    }
    throw new FileLoadError(
      `Could not read input file at ${resolvedPath}: ${err.message}`
    );
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new FileLoadError(`Input file contains invalid JSON: ${resolvedPath}`);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError(
      'Input file must contain a JSON object with a body field.'
    );
  }

  if (data.body === undefined || data.body === null) {
    throw new ValidationError('Input JSON is missing required field: body.');
  }

  if (typeof data.body !== 'string') {
    throw new ValidationError('Input JSON field body must be a string.');
  }

  return normalizeMessage(data);
}
