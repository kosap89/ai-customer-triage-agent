import { CATEGORIES } from '../config/categories.js';

/**
 * Rule-based message classifier (v1).
 *
 * Replace this module with an AI-backed implementation later:
 * - Ollama: call local /api/generate with a structured prompt
 * - OpenAI/Gemini: swap classify() body, keep the same return shape
 * - n8n: POST message to webhook, map response fields
 *
 * @typedef {object} ClassificationResult
 * @property {string} category - One of CATEGORIES values
 * @property {number} confidence - 0–1 heuristic score
 * @property {string} method - Identifier for the classifier used
 * @property {string[]} matchedSignals - Keywords/rules that influenced the decision
 */

/** Keyword groups per category (Finnish + English). Order matters for tie-breaking. */
const RULES = [
  {
    category: CATEGORIES.URGENT_ISSUE,
    keywords: [
      'urgent', 'hätä', 'heti', 'immediately', 'emergency', 'kaatui', 'crashed',
      'kaksi kertaa', 'double charge', 'veloitti', 'charged twice', 'asap',
      'kriittinen', 'critical', 'ei toimi', 'not working', 'hälytys',
    ],
    weight: 3,
  },
  {
    category: CATEGORIES.CANCELLATION,
    keywords: [
      'peruuta', 'peruutan', 'peruutus', 'cancel', 'cancellation', 'lopeta tilaus',
      'terminate', 'irtisano', 'unsubscribe', 'peru varaus',
    ],
    weight: 2,
  },
  {
    category: CATEGORIES.COMPLAINT,
    keywords: [
      'valitus', 'complaint', 'pettynyt', 'disappointed', 'huono', 'bad service',
      'unacceptable', 'epäkohta', 'ongelma palvelun', 'en suosittele',
      'reklamaatio', 'dissatisfied', 'angry', 'vihainen',
    ],
    weight: 2,
  },
  {
    category: CATEGORIES.APPOINTMENT_BOOKING,
    keywords: [
      // Finnish booking phrases (inflected forms matter — include common variants)
      'ajanvaraus', 'varata ajan', 'varata aika', 'varaa aika', 'varaa ajan',
      'haluaisin ajan', 'haluaisin varata', 'vapaita aikoja', 'vapaata aikaa',
      'vapaata', 'aika ensi viikolle', 'ensi viikon', 'ensi viikolle',
      'sopiiko torstai', 'sopiiko tiistai', 'sopiiko keskiviikko',
      'siirtää ajan', 'siirtaa ajan', 'siirrä ajan', 'siirrä aika', 'ajan siirto',
      // English
      'appointment', 'book', 'reschedule', 'available slot', 'kalenteri',
      'schedule', 'meeting', 'huomenna klo', 'tomorrow at',
    ],
    weight: 2,
  },
  {
    category: CATEGORIES.PRICING_QUESTION,
    keywords: [
      'hinta', 'price', 'pricing', 'maksaa', 'cost', 'kuukausi', 'alennus',
      'discount', 'tarjous', 'offer', 'lasku', 'invoice amount', 'paljonko',
      'how much',
    ],
    weight: 2,
  },
  {
    category: CATEGORIES.GENERAL_QUESTION,
    keywords: [
      'aukiolo', 'opening hours', 'miten', 'how does', 'voiko', 'can i',
      'kysymys', 'question', 'tietoa', 'info', 'palautus', 'return policy',
    ],
    weight: 1,
  },
];

/**
 * Score text against keyword rules.
 * @param {string} text - Combined subject + body (lowercase)
 * @returns {ClassificationResult}
 */
export function classify(text) {
  const normalized = text.toLowerCase();
  const scores = new Map();
  const signals = new Map();

  for (const rule of RULES) {
    const hits = rule.keywords.filter((kw) => normalized.includes(kw));
    if (hits.length > 0) {
      const points = hits.length * rule.weight;
      scores.set(rule.category, (scores.get(rule.category) ?? 0) + points);
      signals.set(rule.category, [...(signals.get(rule.category) ?? []), ...hits]);
    }
  }

  // Default when no keywords match
  if (scores.size === 0) {
    return {
      category: CATEGORIES.GENERAL_QUESTION,
      confidence: 0.35,
      method: 'rule-based-v1',
      matchedSignals: ['fallback: no keyword match'],
    };
  }

  // Pick highest score; urgent_issue wins ties at same score
  let bestCategory = CATEGORIES.GENERAL_QUESTION;
  let bestScore = -1;

  for (const [category, score] of scores) {
    if (
      score > bestScore ||
      (score === bestScore && category === CATEGORIES.URGENT_ISSUE)
    ) {
      bestScore = score;
      bestCategory = category;
    }
  }

  // Rough confidence: more hits → higher, capped at 0.95
  const confidence = Math.min(0.95, 0.45 + bestScore * 0.08);

  return {
    category: bestCategory,
    confidence: Math.round(confidence * 100) / 100,
    method: 'rule-based-v1',
    matchedSignals: signals.get(bestCategory) ?? [],
  };
}
