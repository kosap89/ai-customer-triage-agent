/**
 * Request validation for POST /match-shift.
 */

export class MatchValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MatchValidationError';
  }
}

const SHIFT_REQUIRED_FIELDS = [
  'workplace',
  'location',
  'date',
  'startTime',
  'endTime',
  'requiredProfession',
  'requiredQualifications',
  'workType',
];

const WORKER_REQUIRED_FIELDS = [
  'id',
  'name',
  'profession',
  'availability',
  'qualifications',
  'preferredLocations',
  'excludedWorkTypes',
];

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * @param {unknown} data
 * @returns {{ shift: object, workers: object[] }}
 */
export function validateMatchShiftRequest(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new MatchValidationError('Request body must be a JSON object.');
  }

  if (!data.shift || typeof data.shift !== 'object' || Array.isArray(data.shift)) {
    throw new MatchValidationError('Missing required field: shift.');
  }

  for (const field of SHIFT_REQUIRED_FIELDS) {
    const value = data.shift[field];

    if (value === undefined || value === null) {
      throw new MatchValidationError(`Missing required shift field: ${field}.`);
    }

    if (field !== 'requiredQualifications' && !isNonEmptyString(value)) {
      throw new MatchValidationError(`Shift field ${field} must be a non-empty string.`);
    }
  }

  if (
    !Array.isArray(data.shift.requiredQualifications) ||
    data.shift.requiredQualifications.length === 0
  ) {
    throw new MatchValidationError(
      'Shift field requiredQualifications must be a non-empty array.'
    );
  }

  if (!Array.isArray(data.workers) || data.workers.length === 0) {
    throw new MatchValidationError('Field workers must be a non-empty array.');
  }

  data.workers.forEach((worker, index) => {
    if (!worker || typeof worker !== 'object' || Array.isArray(worker)) {
      throw new MatchValidationError(`Worker at index ${index} must be a JSON object.`);
    }

    for (const field of WORKER_REQUIRED_FIELDS) {
      const value = worker[field];

      if (value === undefined || value === null) {
        throw new MatchValidationError(
          `Worker at index ${index} is missing required field: ${field}.`
        );
      }
    }

    if (!isNonEmptyString(worker.id) || !isNonEmptyString(worker.name) || !isNonEmptyString(worker.profession)) {
      throw new MatchValidationError(
        `Worker at index ${index} must have non-empty id, name, and profession.`
      );
    }

    if (!Array.isArray(worker.availability) || worker.availability.length === 0) {
      throw new MatchValidationError(
        `Worker at index ${index} field availability must be a non-empty array.`
      );
    }

    if (!Array.isArray(worker.qualifications)) {
      throw new MatchValidationError(
        `Worker at index ${index} field qualifications must be an array.`
      );
    }

    if (!Array.isArray(worker.preferredLocations)) {
      throw new MatchValidationError(
        `Worker at index ${index} field preferredLocations must be an array.`
      );
    }

    if (!Array.isArray(worker.excludedWorkTypes)) {
      throw new MatchValidationError(
        `Worker at index ${index} field excludedWorkTypes must be an array.`
      );
    }
  });

  return {
    shift: data.shift,
    workers: data.workers,
  };
}
