import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  status: number
  validationErrors?: { field: string; message: string }[]

  constructor(message: string, status: number = 500, validationErrors?: { field: string; message: string }[]) {
    super(message)
    this.status = status
    this.validationErrors = validationErrors
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[API Error]', err)

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.message,
      validation_errors: err.validationErrors,
    })
    return
  }

  if (err instanceof ZodError) {
    const validationErrors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
    res.status(400).json({
      error: 'Validation failed',
      validation_errors: validationErrors,
    })
    return
  }

  res.status(500).json({
    error: 'Internal server error',
  })
}
