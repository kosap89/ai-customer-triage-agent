import { CATEGORIES, URGENCY_LEVELS } from '../config/categories.js';

/**
 * Produce a human-review note when automation should not auto-send.
 *
 * @param {object} params
 * @param {string} params.category
 * @param {string} params.urgency
 * @param {number} params.confidence
 * @param {string} params.text
 * @returns {{ requiresReview: boolean, note: string, flags: string[] }}
 */
export function evaluateRisk({ category, urgency, confidence, text }) {
  const flags = [];
  const normalized = text.toLowerCase();

  if (confidence < 0.55) {
    flags.push('low_classification_confidence');
  }

  if (urgency === URGENCY_LEVELS.HIGH) {
    flags.push('high_urgency');
  }

  if (category === CATEGORIES.COMPLAINT) {
    flags.push('complaint_sentiment');
  }

  if (category === CATEGORIES.CANCELLATION) {
    flags.push('retention_risk');
  }

  if (category === CATEGORIES.URGENT_ISSUE) {
    flags.push('operational_incident');
  }

  const legalSignals = ['laki', 'legal', 'lawyer', 'asiamies', 'gdpr', 'tietosuoja'];
  if (legalSignals.some((s) => normalized.includes(s))) {
    flags.push('possible_legal_reference');
  }

  const paymentSignals = ['veloitus', 'charge', 'refund', 'hyvitys', 'maksu', 'payment'];
  if (paymentSignals.some((s) => normalized.includes(s))) {
    flags.push('financial_topic');
  }

  const requiresReview =
    flags.length > 0 ||
    category === CATEGORIES.COMPLAINT ||
    category === CATEGORIES.URGENT_ISSUE ||
    category === CATEGORIES.CANCELLATION;

  let note;
  if (!requiresReview) {
    note =
      'Low risk: draft reply may be sent after a quick skim. No escalation flags detected.';
  } else if (flags.includes('operational_incident') || flags.includes('financial_topic')) {
    note =
      'Review required before sending: message may involve billing or system failure. Verify facts and escalate to support lead if needed.';
  } else if (flags.includes('complaint_sentiment') || flags.includes('retention_risk')) {
    note =
      'Review required: customer may churn or escalate. Personalize the reply and consider offering a concrete next step.';
  } else if (flags.includes('low_classification_confidence')) {
    note =
      'Review required: classification confidence is low. Confirm category manually before replying.';
  } else {
    note = 'Review recommended: one or more caution flags were detected.';
  }

  return { requiresReview, note, flags };
}
