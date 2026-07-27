#!/usr/bin/env node

/**
 * Local HTTP API for n8n and other automation tools.
 * Uses Node.js built-in http module — no external dependencies.
 *
 * Endpoints:
 *   GET  /health      — liveness check
 *   POST /triage      — run triage on a customer message
 *   POST /match-shift — run healthcare shift matching (experimental)
 */

import http from 'node:http';
import { triageMessage } from './services/triage-agent.js';
import { normalizeApiRequest } from './lib/message-loader.js';
import { ValidationError } from './lib/errors.js';
import { matchShiftToWorkers } from './matching/shift-matcher.js';
import {
  validateMatchShiftRequest,
  MatchValidationError,
} from './matching/validate-match-request.js';

const HOST = 'localhost';
const PORT = 3000;

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} statusCode
 * @param {object} data
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

/**
 * Read the full request body as UTF-8 text.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

/**
 * Parse and validate a JSON request body.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<object|null>} Parsed object, or null if a response was already sent.
 */
async function parseJsonBody(req, res) {
  let raw;
  try {
    raw = await readBody(req);
  } catch {
    sendJson(res, 400, { error: 'Could not read request body.' });
    return null;
  }

  if (!raw.trim()) {
    sendJson(res, 400, { error: 'Request body is empty.' });
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON in request body.' });
    return null;
  }
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleHealth(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed. Use GET.' });
    return;
  }

  sendJson(res, 200, { status: 'ok' });
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleTriage(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
    return;
  }

  const data = await parseJsonBody(req, res);
  if (!data) return;

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    sendJson(res, 400, { error: 'Request body must be a JSON object.' });
    return;
  }

  if (data.customer_message === undefined || data.customer_message === null) {
    sendJson(res, 400, { error: 'Missing required field: customer_message.' });
    return;
  }

  if (typeof data.customer_message !== 'string') {
    sendJson(res, 400, { error: 'Field customer_message must be a string.' });
    return;
  }

  try {
    const message = normalizeApiRequest(data);
    const result = triageMessage(message);
    sendJson(res, 200, result);
  } catch (err) {
    if (err instanceof ValidationError) {
      sendJson(res, 400, { error: err.message, code: err.code });
      return;
    }

    console.error('Unexpected server error:', err);
    sendJson(res, 500, { error: 'Internal server error.' });
  }
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleMatchShift(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
    return;
  }

  const data = await parseJsonBody(req, res);
  if (!data) return;

  try {
    const { shift, workers } = validateMatchShiftRequest(data);
    const result = matchShiftToWorkers(shift, workers);
    sendJson(res, 200, result);
  } catch (err) {
    if (err instanceof MatchValidationError) {
      sendJson(res, 400, { error: err.message });
      return;
    }

    console.error('Unexpected server error:', err);
    sendJson(res, 500, { error: 'Internal server error.' });
  }
}

/**
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleRequest(req, res) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? HOST}`);

  try {
    if (url.pathname === '/health') {
      await handleHealth(req, res);
      return;
    }

    if (url.pathname === '/triage') {
      await handleTriage(req, res);
      return;
    }

    if (url.pathname === '/match-shift') {
      await handleMatchShift(req, res);
      return;
    }

    sendJson(res, 404, { error: 'Not found.' });
  } catch (err) {
    console.error('Unexpected server error:', err);
    sendJson(res, 500, { error: 'Internal server error.' });
  }
}

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or change PORT in src/server.js.`
    );
    process.exit(1);
  }
  console.error('Server error:', err.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`AI Customer Triage API listening at http://${HOST}:${PORT}`);
  console.log('  GET  /health');
  console.log('  POST /triage');
  console.log('  POST /match-shift');
});
