import type { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger.js';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code !== undefined && { code: err.code }),
    });
    return;
  }
  logger.error({ err }, 'Unhandled error in route');
  res.status(500).json({ error: 'Internal server error' });
}
