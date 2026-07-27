/**
 * Rule-based healthcare shift matcher (experimental).
 *
 * Evaluates fictional workers against an open shift using hard rejection rules
 * and a simple scoring model for eligible candidates.
 */

/** @typedef {object} Shift */
/** @typedef {object} Worker */

/**
 * Convert HH:MM to minutes since midnight for time comparisons.
 * @param {string} time
 * @returns {number}
 */
function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check whether a worker's availability covers the full shift window.
 * @param {Worker} worker
 * @param {Shift} shift
 * @returns {{ available: boolean, reason: string|null }}
 */
function checkAvailability(worker, shift) {
  const shiftStart = toMinutes(shift.startTime);
  const shiftEnd = toMinutes(shift.endTime);

  const matchingSlot = worker.availability.find((slot) => slot.date === shift.date);

  if (!matchingSlot) {
    return {
      available: false,
      reason: `Not available on ${shift.date}.`,
    };
  }

  const slotStart = toMinutes(matchingSlot.startTime);
  const slotEnd = toMinutes(matchingSlot.endTime);

  if (slotStart > shiftStart || slotEnd < shiftEnd) {
    return {
      available: false,
      reason: `Available ${matchingSlot.startTime}–${matchingSlot.endTime} on ${shift.date}, but shift requires ${shift.startTime}–${shift.endTime}.`,
    };
  }

  return {
    available: true,
    reason: `Available ${matchingSlot.startTime}–${matchingSlot.endTime} on ${shift.date}, covering the full shift.`,
  };
}

/**
 * @param {Worker} worker
 * @param {Shift} shift
 * @returns {string[]}
 */
function getMissingQualifications(worker, shift) {
  return shift.requiredQualifications.filter(
    (qualification) => !worker.qualifications.includes(qualification)
  );
}

/**
 * @param {Worker} worker
 * @param {Shift} shift
 * @returns {boolean}
 */
function hasExclusionConflict(worker, shift) {
  return worker.excludedWorkTypes.includes(shift.workType);
}

/**
 * Score an eligible worker (higher = better match).
 * @param {Worker} worker
 * @param {Shift} shift
 * @returns {{ score: number, reasons: string[] }}
 */
function scoreWorker(worker, shift) {
  let score = 50;
  const reasons = ['Base eligibility score: 50.'];

  const locationMatch = worker.preferredLocations.some((location) =>
    location.toLowerCase().includes(shift.location.split(',')[0].trim().toLowerCase()) ||
    shift.location.toLowerCase().includes(location.split(',')[0].trim().toLowerCase())
  );

  if (locationMatch) {
    score += 25;
    reasons.push(`+25 preferred location matches shift location (${shift.location}).`);
  } else {
    reasons.push('No preferred location match (no score bonus).');
  }

  const extraQualifications = worker.qualifications.filter(
    (qualification) => !shift.requiredQualifications.includes(qualification)
  );

  if (extraQualifications.length > 0) {
    const bonus = extraQualifications.length * 10;
    score += bonus;
    reasons.push(
      `+${bonus} for additional qualifications: ${extraQualifications.join(', ')}.`
    );
  }

  const availability = checkAvailability(worker, shift);
  const shiftDuration = toMinutes(shift.endTime) - toMinutes(shift.startTime);
  const slot = worker.availability.find((entry) => entry.date === shift.date);
  const slotDuration = toMinutes(slot.endTime) - toMinutes(slot.startTime);

  if (slotDuration - shiftDuration >= 120) {
    score += 10;
    reasons.push('+10 flexible availability window (2+ hours beyond shift).');
  }

  return {
    score: Math.min(score, 100),
    reasons,
  };
}

/**
 * Evaluate one worker against a shift.
 * @param {Worker} worker
 * @param {Shift} shift
 * @returns {object}
 */
function evaluateWorker(worker, shift) {
  const rejectionReasons = [];
  const matchReasons = [];

  if (worker.profession !== shift.requiredProfession) {
    rejectionReasons.push(
      `Profession mismatch: worker is ${worker.profession}, shift requires ${shift.requiredProfession}.`
    );
  } else {
    matchReasons.push(`Profession matches required role (${shift.requiredProfession}).`);
  }

  const availability = checkAvailability(worker, shift);
  if (!availability.available) {
    rejectionReasons.push(availability.reason);
  } else {
    matchReasons.push(availability.reason);
  }

  const missingQualifications = getMissingQualifications(worker, shift);
  if (missingQualifications.length > 0) {
    rejectionReasons.push(
      `Missing required qualifications: ${missingQualifications.join(', ')}.`
    );
  } else {
    matchReasons.push('Has all required qualifications.');
  }

  if (hasExclusionConflict(worker, shift)) {
    rejectionReasons.push(
      `Excluded work type conflict: worker excludes "${shift.workType}".`
    );
  } else {
    matchReasons.push(`No conflict with excluded work types for "${shift.workType}".`);
  }

  const eligible = rejectionReasons.length === 0;

  if (!eligible) {
    return {
      workerId: worker.id,
      name: worker.name,
      profession: worker.profession,
      status: 'rejected',
      score: null,
      rank: null,
      reasons: rejectionReasons,
    };
  }

  const scoring = scoreWorker(worker, shift);

  return {
    workerId: worker.id,
    name: worker.name,
    profession: worker.profession,
    status: 'eligible',
    score: scoring.score,
    rank: null,
    reasons: [...matchReasons, ...scoring.reasons],
  };
}

/**
 * Match workers to an open shift and return ranked results.
 *
 * @param {Shift} shift
 * @param {Worker[]} workers
 * @returns {object}
 */
export function matchShiftToWorkers(shift, workers) {
  const evaluated = workers.map((worker) => evaluateWorker(worker, shift));

  const eligible = evaluated
    .filter((result) => result.status === 'eligible')
    .sort((a, b) => b.score - a.score)
    .map((result, index) => ({
      ...result,
      rank: index + 1,
    }));

  const rejected = evaluated
    .filter((result) => result.status === 'rejected')
    .map((result) => ({
      ...result,
      rank: null,
    }));

  return {
    meta: {
      module: 'healthcare-shift-matcher',
      version: '1.0.0-experimental',
      processedAt: new Date().toISOString(),
      matcher: 'rule-based-v1',
    },
    shift: {
      id: shift.id,
      workplace: shift.workplace,
      location: shift.location,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      requiredProfession: shift.requiredProfession,
      requiredQualifications: shift.requiredQualifications,
      workType: shift.workType,
    },
    summary: {
      totalWorkers: workers.length,
      eligibleCount: eligible.length,
      rejectedCount: rejected.length,
    },
    rankedCandidates: eligible,
    rejected,
    allResults: [...eligible, ...rejected],
  };
}
