import { classify } from '../classifiers/rule-based-classifier.js';
import { assessUrgency } from './urgency-assessor.js';
import { evaluateRisk } from './risk-evaluator.js';
import { generateReply } from './reply-generator.js';

/**
 * Main triage orchestrator.
 *
 * This is the integration point for future backends:
 * inject a different classifier or reply generator without changing the CLI.
 *
 * @param {object} message - Normalized customer message
 * @returns {object} Full triage result (summary + structured payload)
 */
export function triageMessage(message) {
  const fullText = [message.subject, message.body].filter(Boolean).join('\n');

  const classification = classify(fullText);
  const urgency = assessUrgency({
    category: classification.category,
    text: fullText,
  });
  const risk = evaluateRisk({
    category: classification.category,
    urgency: urgency.level,
    confidence: classification.confidence,
    text: fullText,
  });
  const reply = generateReply({
    message,
    category: classification.category,
    urgency: urgency.level,
  });

  const processedAt = new Date().toISOString();

  return {
    meta: {
      agent: 'ai-customer-triage-agent',
      version: '1.0.0',
      processedAt,
      classifier: classification.method,
    },
    input: {
      id: message.id,
      customerName: message.customerName,
      channel: message.channel,
      subject: message.subject,
      body: message.body,
    },
    classification: {
      category: classification.category,
      confidence: classification.confidence,
      matchedSignals: classification.matchedSignals,
    },
    urgency: {
      level: urgency.level,
      reason: urgency.reason,
    },
    risk: {
      requiresHumanReview: risk.requiresReview,
      note: risk.note,
      flags: risk.flags,
    },
    reply: {
      language: reply.language,
      tone: reply.tone,
      draft: reply.draft,
    },
  };
}
