import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'ValidationError',
      message: 'Request validation failed',
      issues: err.flatten(),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.name,
      message: err.message,
      details: err.details ?? null,
    });
    return;
  }

  console.error('Unexpected error', err);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Unexpected error occurred',
  });
};
