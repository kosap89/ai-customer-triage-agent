import { CATEGORIES, URGENCY_LEVELS } from '../config/categories.js';

/**
 * Assign urgency based on category + message content.
 * Replace with ML/LLM scoring later; keep the same function signature.
 *
 * @param {object} params
 * @param {string} params.category
 * @param {string} params.text - Full message text
 * @returns {{ level: string, reason: string }}
 */
export function assessUrgency({ category, text }) {
  const normalized = text.toLowerCase();

  const highSignals = [
    'heti', 'urgent', 'hätä', 'immediately', 'asap', 'emergency',
    'double charge', 'kaksi kertaa', 'kaatui', 'crashed', 'veloitti',
  ];
  const hasHighSignal = highSignals.some((s) => normalized.includes(s));

  if (category === CATEGORIES.URGENT_ISSUE || hasHighSignal) {
    return {
      level: URGENCY_LEVELS.HIGH,
      reason: hasHighSignal
        ? 'Message contains urgent language or payment/system failure signals.'
        : 'Category is urgent_issue.',
    };
  }

  if (
    category === CATEGORIES.COMPLAINT ||
    category === CATEGORIES.CANCELLATION
  ) {
    const angrySignals = ['pettynyt', 'unacceptable', 'vihainen', 'reklamaatio'];
    const isEscalated = angrySignals.some((s) => normalized.includes(s));
    return {
      level: isEscalated ? URGENCY_LEVELS.HIGH : URGENCY_LEVELS.NORMAL,
      reason: isEscalated
        ? 'Complaint/cancellation with strong negative sentiment.'
        : 'Complaint or cancellation requires timely human follow-up.',
    };
  }

  if (
    category === CATEGORIES.APPOINTMENT_BOOKING ||
    category === CATEGORIES.PRICING_QUESTION
  ) {
    return {
      level: URGENCY_LEVELS.NORMAL,
      reason: 'Standard sales or scheduling inquiry.',
    };
  }

  return {
    level: URGENCY_LEVELS.LOW,
    reason: 'General informational question with no escalation signals.',
  };
}
