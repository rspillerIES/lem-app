import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for API errors
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public field?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error handling middleware (should be last middleware)
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      status: err.status,
      field: err.field,
      timestamp: new Date().toISOString(),
    });
  }

  // Generic error
  return res.status(500).json({
    error: 'Internal server error',
    status: 500,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  NOT_FOUND: (resource: string) =>
    new AppError(`${resource} not found`, 404),

  INVALID_REQUEST: (message: string) =>
    new AppError(message, 400),

  UNAUTHORIZED: () =>
    new AppError('Unauthorized', 401),

  FORBIDDEN: (message: string = 'Access denied') =>
    new AppError(message, 403),

  CONFLICT: (message: string) =>
    new AppError(message, 409),

  VALIDATION_ERROR: (field: string, message: string) =>
    new AppError(message, 400, field),

  DATABASE_ERROR: (message: string = 'Database error') =>
    new AppError(message, 500),
};
