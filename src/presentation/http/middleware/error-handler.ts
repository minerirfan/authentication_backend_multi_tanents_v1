import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../responses/response-formatter';
import {
  DomainException,
  ValidationException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BusinessRuleException,
  BadRequestException,
  InternalServerException,
} from '../../../domain/exceptions/domain-exceptions';
import { Prisma } from '@prisma/client';

export class ErrorHandler {
  static handle(
    err: Error | DomainException | Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response {
    // Enhanced error logging with security considerations
    const errorLog = {
      timestamp: new Date().toISOString(),
      name: err.name,
      message: err.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.userId || 'anonymous',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    };
    
    // Don't log sensitive information in production
    if (process.env.NODE_ENV === 'production') {
      delete errorLog.stack;
      // Sanitize error message to avoid information disclosure
      if (errorLog.message.includes('password') || errorLog.message.includes('token')) {
        errorLog.message = 'Authentication error';
      }
    }
    
    console.error('[ERROR]', JSON.stringify(errorLog));

    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return ErrorHandler.handlePrismaError(err, res);
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
      return ErrorHandler.handlePrismaValidationError(err, res);
    }

    // Handle Domain Exceptions
    if (err instanceof DomainException) {
      return ResponseFormatter.error(
        res,
        err.message,
        err.statusCode,
        err.errors || [err.message],
        process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined
      );
    }

    // Handle specific exception types
    if (err instanceof ValidationException) {
      return ResponseFormatter.error(
        res,
        err.message,
        400,
        err.errors || [err.message],
        process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined
      );
    }

    if (err instanceof NotFoundException) {
      return ResponseFormatter.error(
        res,
        err.message,
        404,
        [err.message],
        process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined
      );
    }

    if (err instanceof UnauthorizedException) {
      return ResponseFormatter.error(
        res,
        err.message,
        401,
        [err.message],
        process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined
      );
    }

    if (err instanceof ForbiddenException) {
      return ResponseFormatter.error(
        res,
        err.message,
        403,
        [err.message],
        process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined
      );
    }

    if (err instanceof ConflictException) {
      return ResponseFormatter.error(
        res,
        err.message,
        409,
        [err.message],
        process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined
      );
    }

    if (err instanceof BusinessRuleException) {
      return ResponseFormatter.error(
        res,
        err.message,
        422,
        [err.message],
        process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined
      );
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return ResponseFormatter.error(
        res,
        err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token',
        err.name === 'TokenExpiredError' ? 401 : 401,
        [err.message],
        process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined
      );
    }

    // Handle validation errors from express-validator
    if ((err as any).errors && Array.isArray((err as any).errors)) {
      return ResponseFormatter.error(
        res,
        'Validation failed',
        400,
        (err as any).errors.map((e: any) => e.msg || e.message),
        process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined
      );
    }

    // Handle generic errors
    const statusCode = (err as any).statusCode || (err as any).status || 500;
    const message = err.message || 'Internal Server Error';
    const errors = (err as any).errors || [message];
    const stackTrace = process.env.NODE_ENV === 'development' ? err.stack?.split('\n') : undefined;

    // Don't expose internal errors in production
    const finalMessage = statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : message;

    return ResponseFormatter.error(res, finalMessage, statusCode, errors, stackTrace);
  }

  private static handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
    res: Response
  ): Response {
    const stackTrace = process.env.NODE_ENV === 'development' ? error.stack?.split('\n') : undefined;

    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || [];
        const field = target.length > 0 ? target[0] : 'field';
        return ResponseFormatter.error(
          res,
          `${field} already exists`,
          409,
          [`A record with this ${field} already exists`],
          stackTrace
        );

      case 'P2025':
        // Record not found
        return ResponseFormatter.error(
          res,
          'Record not found',
          404,
          ['The requested record does not exist'],
          stackTrace
        );

      case 'P2003':
        // Foreign key constraint violation
        return ResponseFormatter.error(
          res,
          'Related record not found',
          400,
          ['Cannot perform operation: related record does not exist'],
          stackTrace
        );

      case 'P2014':
        // Required relation violation
        return ResponseFormatter.error(
          res,
          'Required relation violation',
          400,
          ['Cannot perform operation: required relation is missing'],
          stackTrace
        );

      case 'P2000':
        // Value too long
        return ResponseFormatter.error(
          res,
          'Value too long',
          400,
          ['The provided value exceeds the maximum length'],
          stackTrace
        );

      case 'P2001':
        // Record does not exist
        return ResponseFormatter.error(
          res,
          'Record does not exist',
          404,
          ['The requested record does not exist'],
          stackTrace
        );

      case 'P2011':
        // Null constraint violation
        return ResponseFormatter.error(
          res,
          'Null constraint violation',
          400,
          ['A required field cannot be null'],
          stackTrace
        );

      case 'P2012':
        // Missing required value
        return ResponseFormatter.error(
          res,
          'Missing required value',
          400,
          ['A required field is missing'],
          stackTrace
        );

      case 'P2015':
        // Related record not found
        return ResponseFormatter.error(
          res,
          'Related record not found',
          404,
          ['The related record does not exist'],
          stackTrace
        );

      case 'P2018':
        // Required connected records not found
        return ResponseFormatter.error(
          res,
          'Required connected records not found',
          400,
          ['Required connected records are missing'],
          stackTrace
        );

      case 'P2019':
        // Input error
        return ResponseFormatter.error(
          res,
          'Input error',
          400,
          ['Invalid input provided'],
          stackTrace
        );

      case 'P2021':
        // Table does not exist
        return ResponseFormatter.error(
          res,
          'Database table does not exist',
          500,
          ['Database configuration error'],
          stackTrace
        );

      case 'P2022':
        // Column does not exist
        return ResponseFormatter.error(
          res,
          'Database column does not exist',
          500,
          ['Database configuration error'],
          stackTrace
        );

      case 'P2023':
        // Inconsistent column data
        return ResponseFormatter.error(
          res,
          'Database data inconsistency',
          500,
          ['Database data integrity error'],
          stackTrace
        );

      default:
        // Unknown Prisma error
        return ResponseFormatter.error(
          res,
          'Database operation failed',
          500,
          [error.message || 'An error occurred while processing the request'],
          stackTrace
        );
    }
  }

  private static handlePrismaValidationError(
    error: Prisma.PrismaClientValidationError,
    res: Response
  ): Response {
    const stackTrace = process.env.NODE_ENV === 'development' ? error.stack?.split('\n') : undefined;
    
    // Parse the error message to extract meaningful information
    const parsedError = ErrorHandler.parsePrismaValidationError(error.message);
    
    return ResponseFormatter.error(
      res,
      parsedError.message,
      400,
      parsedError.errors,
      stackTrace
    );
  }

  private static parsePrismaValidationError(errorMessage: string): {
    message: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let mainMessage = 'Validation error';

    // Pattern 1: Invalid value for argument `fieldName`: description. Expected TYPE.
    // Example: "Invalid value for argument `dateOfBirth`: premature end of input. Expected ISO-8601 DateTime."
    const invalidValuePattern = /Invalid value for argument `([^`]+)`:\s*([^.]+)\.\s*Expected\s+([^.]+)\./;
    const invalidValueMatch = errorMessage.match(invalidValuePattern);
    
    if (invalidValueMatch) {
      const [, fieldName, issue, expectedType] = invalidValueMatch;
      const formattedFieldName = ErrorHandler.formatFieldName(fieldName);
      
      // Handle specific error types
      if (issue.includes('premature end of input') || issue.includes('invalid format')) {
        if (expectedType.includes('DateTime') || expectedType.includes('Date')) {
          mainMessage = 'Invalid date format';
          errors.push(
            `The ${formattedFieldName} field must be in ISO-8601 DateTime format (e.g., 2025-11-20T00:00:00.000Z or 2025-11-20T00:00:00Z)`
          );
        } else {
          mainMessage = `Invalid ${formattedFieldName} format`;
          errors.push(
            `The ${formattedFieldName} field has an invalid format. Expected: ${expectedType}`
          );
        }
      } else {
        mainMessage = `Invalid ${formattedFieldName} value`;
        errors.push(
          `The ${formattedFieldName} field is invalid: ${issue}. Expected format: ${expectedType}`
        );
      }
    } else {
      // Pattern 2: Missing required argument or other validation errors
      const missingArgPattern = /Missing required argument `(\w+)`/;
      const missingArgMatch = errorMessage.match(missingArgPattern);
      
      if (missingArgMatch) {
        const [, fieldName] = missingArgMatch;
        const formattedFieldName = ErrorHandler.formatFieldName(fieldName);
        mainMessage = 'Missing required field';
        errors.push(`The ${formattedFieldName} field is required`);
      } else {
        // Generic validation error - try to extract field name from common patterns
        const fieldPattern = /`(\w+)`/;
        const fieldMatch = errorMessage.match(fieldPattern);
        
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const formattedFieldName = ErrorHandler.formatFieldName(fieldName);
          mainMessage = `Invalid ${formattedFieldName} value`;
          errors.push(`The ${formattedFieldName} field contains an invalid value`);
        } else {
          // Fallback to a more user-friendly version of the error
          mainMessage = 'Validation error';
          errors.push(ErrorHandler.sanitizeErrorMessage(errorMessage));
        }
      }
    }

    return { message: mainMessage, errors };
  }

  private static formatFieldName(fieldName: string): string {
    // Convert camelCase to Title Case with spaces
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private static sanitizeErrorMessage(errorMessage: string): string {
    // Remove file paths and line numbers for cleaner error messages
    return errorMessage
      .replace(/in\s+[^\n]+\.ts:\d+:\d+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
