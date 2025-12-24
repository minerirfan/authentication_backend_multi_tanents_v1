export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    errors: string[] = [],
    isOperational = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors: string[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string, errors: string[] = []): ApiError {
    return new ApiError(409, message, errors);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, [], false);
  }
}