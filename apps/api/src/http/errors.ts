/**
 * A small error hierarchy so controllers can throw domain-meaningful errors and
 * a single middleware decides how they become HTTP responses. Nothing below the
 * HTTP layer needs to know about status codes.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'not_found';

  constructor(resource: string, id?: string) {
    super(id ? `${resource} ${id} was not found.` : `${resource} was not found.`);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 422;
  readonly code = 'validation_failed';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'conflict';
}

export class UpstreamError extends AppError {
  readonly statusCode = 502;
  readonly code = 'upstream_failed';
}
