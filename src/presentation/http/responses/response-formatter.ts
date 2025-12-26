import { Response } from 'express';
import { ApiResponse } from '../../../shared/types';
import { CsrfMiddleware } from '../middleware/csrf.middleware';

export class ResponseFormatter {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      statusCode,
      results: data,
    };
    
    // Include CSRF token in response headers
    const csrfToken = res.locals.csrfToken;
    if (csrfToken) {
      res.setHeader('X-CSRF-Token', csrfToken);
    }
    
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: string[],
    stackTrace?: string[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      statusCode,
      errors,
      stackTrace: process.env.NODE_ENV === 'development' ? stackTrace : undefined,
    };
    
    // Include CSRF token in response headers even for errors
    const csrfToken = res.locals.csrfToken;
    if (csrfToken) {
      res.setHeader('X-CSRF-Token', csrfToken);
    }
    
    return res.status(statusCode).json(response);
  }

  /**
   * Get CSRF token from response locals
   */
  static getCsrfToken(res: Response): string | undefined {
    return res.locals.csrfToken;
  }
}

