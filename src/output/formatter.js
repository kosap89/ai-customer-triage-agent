/**
 * Human-readable summary + JSON output for CLI and future webhooks.
 */

const CATEGORY_LABELS = {
  appointment_booking: 'Appointment booking',
  pricing_question: 'Pricing question',
  complaint: 'Complaint',
  cancellation: 'Cancellation',
  general_question: 'General question',
  urgent_issue: 'Urgent issue',
};

const URGENCY_ICONS = {
  low: '○',
  normal: '◐',
  high: '●',
};

/**
 * @param {object} result - Output from triageMessage()
 * @returns {string}
 */
export function formatSummary(result) {
  const lines = [
    '',
    '══════════════════════════════════════════════════════════',
    '  AI CUSTOMER MESSAGE TRIAGE — RESULT',
    '══════════════════════════════════════════════════════════',
    '',
    `  Customer:     ${result.input.customerName}`,
    `  Channel:      ${result.input.channel}`,
    `  Message ID:   ${result.input.id}`,
  ];

  if (result.input.subject) {
    lines.push(`  Subject:      ${result.input.subject}`);
  }

  lines.push(
    '',
    '  ── Message ──────────────────────────────────────────────',
    wrapText(result.input.body, 4),
    '',
    '  ── Classification ───────────────────────────────────────',
    `  Category:     ${CATEGORY_LABELS[result.classification.category] ?? result.classification.category}`,
    `  Confidence:   ${(result.classification.confidence * 100).toFixed(0)}%`,
    `  Signals:      ${result.classification.matchedSignals.join(', ') || 'none'}`,
    '',
    '  ── Urgency ────────────────────────────────────────────────',
    `  Level:        ${URGENCY_ICONS[result.urgency.level] ?? ''} ${result.urgency.level.toUpperCase()}`,
    `  Reason:       ${result.urgency.reason}`,
    '',
    '  ── Human review ───────────────────────────────────────────',
    `  Required:     ${result.risk.requiresHumanReview ? 'YES' : 'No'}`,
    `  Note:         ${result.risk.note}`,
  );

  if (result.risk.flags.length > 0) {
    lines.push(`  Flags:        ${result.risk.flags.join(', ')}`);
  }

  lines.push(
    '',
    '  ── Finnish reply draft ────────────────────────────────────',
    wrapText(result.reply.draft, 4),
    '',
    '══════════════════════════════════════════════════════════',
    ''
  );

  return lines.join('\n');
}

/**
 * @param {object} result
 * @returns {string}
 */
export function formatJson(result) {
  return JSON.stringify(result, null, 2);
}

/**
 * Soft-wrap text for terminal display.
 * @param {string} text
 * @param {number} indent
 * @returns {string}
 */
function wrapText(text, indent = 0) {
  const prefix = ' '.repeat(indent);
  return text
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}
