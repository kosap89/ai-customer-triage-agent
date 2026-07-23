/**
 * Custom errors for clearer CLI feedback and future API responses.
 */

export class TriageError extends Error {
  constructor(message, code = 'TRIAGE_ERROR') {
    super(message);
    this.name = 'TriageError';
    this.code = code;
  }
}

export class ValidationError extends TriageError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class FileLoadError extends TriageError {
  constructor(message) {
    super(message, 'FILE_LOAD_ERROR');
    this.name = 'FileLoadError';
  }
}
