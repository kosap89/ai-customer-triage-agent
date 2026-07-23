/**
 * Rule-based detection of scheduling details in customer messages.
 * Used by reply-generator to ask only for information that appears missing.
 */

/** @type {RegExp[]} */
const DAY_DATE_PATTERNS = [
  /\bhuomenna\b/i,
  /\bhuomiseksi\b/i,
  /\bylihuomenna\b/i,
  /\btänään\b/i,
  /\btänä\s+iltana\b/i,
  /\bensi\s+viikon?\b/i,
  /\bensi\s+viikolle\b/i,
  /\b(maanantai|tiistai|keskiviikko|torstai|perjantai|lauantai|sunnuntai)(?:lle|na|ksi|sin)?\b/i,
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+afternoon|\s+morning)?\b/i,
  /\btomorrow\b/i,
  /\bnext\s+week\b/i,
  /\bfrom\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bto\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b\d{1,2}\.\d{1,2}(\.\d{2,4})?\b/,
  /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/,
];

/** @type {RegExp[]} */
const TIME_PATTERNS = [
  /\bklo\s*\d{1,2}([:.]\d{2})?\b/i,
  /\b(at|@)\s*\d{1,2}([:.]\d{2})?\b/i,
  /\b\d{1,2}[:.]\d{2}\b/,
  /\b(iltapäivä|aamupäivä|aamu|ilta|morning|afternoon|evening)\b/i,
];

/** @type {string[]} */
const PURPOSE_KEYWORDS = [
  'hieronta',
  'hierontaan',
  'kampaaja',
  'kampaamoon',
  'parturi',
  'parturiin',
  'hammas',
  'hammaslääkäri',
  'lääkäri',
  'lääkärintarkastus',
  'tarkastus',
  'vuositarkastus',
  'konsultaatio',
  'neuvonta',
  'neuvontaan',
  'huolto',
  'huoltoon',
  'korjaus',
  'korjaukseen',
  'kuntoutus',
  'fysioterapia',
  'optikko',
  'silmätarkastus',
  'initial consultation',
  'appointment for',
  'palveluun',
  'käyntiin',
];

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_PATTERN = /(?:\+358[\s-]?|0)\d[\d\s-]{6,12}\d/;

/**
 * Return first matching snippet for patterns (for optional acknowledgment).
 * @param {string} text
 * @param {RegExp[]} patterns
 * @returns {string|null}
 */
function findFirstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function hasPurpose(text) {
  const normalized = text.toLowerCase();
  return PURPOSE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

/**
 * Detect which scheduling details appear to be present in the message.
 *
 * @param {string} text - Combined subject + body
 * @returns {{
 *   hasDayOrDate: boolean,
 *   hasTime: boolean,
 *   hasPurpose: boolean,
 *   hasContact: boolean,
 *   hints: { dayOrDate: string|null, time: string|null }
 * }}
 */
export function detectAppointmentDetails(text) {
  const normalized = text.trim();
  const dayOrDate = findFirstMatch(normalized, DAY_DATE_PATTERNS);
  const time = findFirstMatch(normalized, TIME_PATTERNS);

  return {
    hasDayOrDate: dayOrDate !== null,
    hasTime: time !== null,
    hasPurpose: hasPurpose(normalized),
    hasContact: EMAIL_PATTERN.test(normalized) || PHONE_PATTERN.test(normalized),
    hints: {
      dayOrDate,
      time,
    },
  };
}

/** Finnish prompts for each detail type when missing. */
const MISSING_PROMPTS = {
  dayOrDate: 'toivottu päivä tai ajankohta',
  time: 'toivottu kellonaika',
  purpose: 'palvelu tai asia, jota varten varaat ajan',
  contact: 'puhelinnumerosi tai sähköpostisi varauksen vahvistusta varten',
};

/**
 * Build an appointment booking reply that asks only for missing details.
 *
 * @param {object} params
 * @param {string} params.customerName
 * @param {string} params.fullText - Subject + body combined
 * @returns {string}
 */
export function buildAppointmentBookingReply({ customerName, fullText }) {
  const name = customerName.split(' ')[0] || 'asiakas';
  const details = detectAppointmentDetails(fullText);

  const missing = [];
  if (!details.hasDayOrDate) missing.push(MISSING_PROMPTS.dayOrDate);
  if (!details.hasTime) missing.push(MISSING_PROMPTS.time);
  if (!details.hasPurpose) missing.push(MISSING_PROMPTS.purpose);
  if (!details.hasContact) missing.push(MISSING_PROMPTS.contact);

  const acknowledged = [];
  if (details.hasDayOrDate && details.hints.dayOrDate) {
    acknowledged.push(details.hints.dayOrDate);
  }
  if (details.hasTime && details.hints.time) {
    acknowledged.push(details.hints.time);
  }

  let body = `Hei ${name},

Kiitos viestistäsi! Autamme mielellämme ajanvarauksessa.

`;

  if (acknowledged.length > 0) {
    body += `Huomasin toiveesi ajankohdasta (${acknowledged.join(', ')}). `;
  }

  body += `Tarkistan kalenteristamme saatavuuden emmekä vielä vahvista varausta — palaan sinulle pian vahvistuksella tai vaihtoehtoisilla ajoilla.`;

  if (missing.length > 0) {
    body += `\n\nJotta voimme tehdä varauksen, tarvitsisin vielä:\n`;
    body += missing.map((item) => `- ${item}`).join('\n');
  } else {
    body += `\n\nSinulla näyttää olevan kaikki tarvittavat tiedot viestissä — tarkistan saatavuuden ja palaan asiaan pian.`;
  }

  body += `\n\nYstävällisin terveisin,
Asiakaspalvelu`;

  return body;
}
