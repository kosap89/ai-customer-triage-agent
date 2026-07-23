/**
 * Shared constants for classification and urgency.
 * Central place to update labels when connecting external systems (n8m, CRM, etc.).
 */

export const CATEGORIES = Object.freeze({
  APPOINTMENT_BOOKING: 'appointment_booking',
  PRICING_QUESTION: 'pricing_question',
  COMPLAINT: 'complaint',
  CANCELLATION: 'cancellation',
  GENERAL_QUESTION: 'general_question',
  URGENT_ISSUE: 'urgent_issue',
});

export const URGENCY_LEVELS = Object.freeze({
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
});

/** All valid category values (for validation). */
export const VALID_CATEGORIES = Object.freeze(Object.values(CATEGORIES));

/** All valid urgency values (for validation). */
export const VALID_URGENCY = Object.freeze(Object.values(URGENCY_LEVELS));
