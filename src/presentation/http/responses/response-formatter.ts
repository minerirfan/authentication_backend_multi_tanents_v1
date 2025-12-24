import { Response } from 'express';
import { ApiResponse } from '../../../shared/types';

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
    return res.status(statusCode).json(response);
  }
}

