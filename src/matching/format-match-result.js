/**
 * Readable summary formatting for healthcare shift matching results.
 */

const PROFESSION_LABELS = {
  registered_nurse: 'Registered nurse',
  practical_nurse: 'Practical nurse',
};

/**
 * @param {object} result
 * @returns {string}
 */
export function formatMatchSummary(result) {
  const lines = [
    '',
    '══════════════════════════════════════════════════════════',
    '  HEALTHCARE SHIFT MATCHING — DEMO RESULT',
    '══════════════════════════════════════════════════════════',
    '',
    '  ── Open shift ───────────────────────────────────────────',
    `  Workplace:    ${result.shift.workplace}`,
    `  Location:     ${result.shift.location}`,
    `  Date:         ${result.shift.date}`,
    `  Time:         ${result.shift.startTime} – ${result.shift.endTime}`,
    `  Profession:   ${PROFESSION_LABELS[result.shift.requiredProfession] ?? result.shift.requiredProfession}`,
    `  Work type:    ${result.shift.workType}`,
    `  Required:     ${result.shift.requiredQualifications.join(', ')}`,
    '',
    '  ── Summary ──────────────────────────────────────────────',
    `  Workers evaluated:  ${result.summary.totalWorkers}`,
    `  Eligible:           ${result.summary.eligibleCount}`,
    `  Rejected:           ${result.summary.rejectedCount}`,
  ];

  if (result.rankedCandidates.length > 0) {
    lines.push('', '  ── Ranked candidates ────────────────────────────────────');

    for (const candidate of result.rankedCandidates) {
      lines.push(
        '',
        `  #${candidate.rank}  ${candidate.name} (${candidate.workerId}) — score ${candidate.score}`,
        `       ${candidate.reasons.map((reason) => `• ${reason}`).join('\n       ')}`
      );
    }
  } else {
    lines.push('', '  No eligible candidates found.');
  }

  if (result.rejected.length > 0) {
    lines.push('', '  ── Rejected workers ─────────────────────────────────────');

    for (const worker of result.rejected) {
      lines.push(
        '',
        `  ✗  ${worker.name} (${worker.workerId})`,
        `       ${worker.reasons.map((reason) => `• ${reason}`).join('\n       ')}`
      );
    }
  }

  lines.push('', '══════════════════════════════════════════════════════════', '');

  return lines.join('\n');
}

/**
 * @param {object} result
 * @returns {string}
 */
export function formatMatchJson(result) {
  return JSON.stringify(result, null, 2);
}
