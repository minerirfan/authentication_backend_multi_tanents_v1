/**
 * Structured Logger Service
 *
 * Provides centralized logging with correlation IDs, request tracking,
 * and structured output for production monitoring.
 */

import winston from 'winston';
import { Request } from 'express';
import util from 'util';

// Extend Express Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      id?: string;
      correlationId?: string;
      user?: {
        id: string;
        tenantId?: string;
        [key: string]: any;
      };
    }
  }
}

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

// Log context interface
export interface LogContext {
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  requestId?: string;
  [key: string]: any;
}

// Log metadata interface
export interface LogMetadata {
  timestamp?: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
  [key: string]: any;
}

/**
 * Logger class providing structured logging capabilities
 */
export class Logger {
  private static instance: winston.Logger;
  private static correlationIdKey = 'correlation-id';
  private static requestIdKey = 'request-id';

  /**
   * Initialize the logger with configuration
   */
  static initialize(): void {
    if (this.instance) {
      return;
    }

    const logLevel = process.env.LOG_LEVEL || 'info';
    const logFormat = process.env.LOG_FORMAT || 'json';

    // Define formats
    const formats = [
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
    ];

    // Add format based on LOG_FORMAT
    if (logFormat === 'json') {
      formats.push(winston.format.json());
    } else {
      formats.push(
        winston.format.printf((info: any) => {
          const { level, message, timestamp, correlationId, requestId, service, environment, ...rest } = info;
          const ids = correlationId ? `[${correlationId}]` : requestId ? `[${requestId}]` : '';
          return `${timestamp} ${level}: ${ids} ${message}`;
        })
      );
    }

    // Custom console format for better readability
    const consoleFormat = winston.format.printf((info: any) => {
      const { level, message, timestamp, correlationId, requestId, service, environment, version, method, url, statusCode, duration, ip, userAgent, error, ...rest } = info;
      
      // Color symbols for different log levels
      const symbols = {
        error: '✖',
        warn: '⚠',
        info: 'ℹ',
        http: '➤',
        debug: '◉',
      };
      
      const symbol = symbols[level as keyof typeof symbols] || '•';
      const ids = correlationId ? `[${correlationId}]` : requestId ? `[${requestId}]` : '';
      
      let output = `${timestamp} ${level} ${symbol} ${ids} ${message}`;
      
      // Add request info if available
      if (method && url) {
        output += `\n  └─ ${method} ${url}`;
        if (statusCode) {
          const statusColor = statusCode >= 500 ? 'red' : statusCode >= 400 ? 'yellow' : 'green';
          output += ` → ${statusCode}`;
        }
        if (duration) {
          output += ` (${duration}ms)`;
        }
        if (ip) {
          output += ` [${ip}]`;
        }
      }
      
      // Add error details if available
      if (error) {
        if (error.message) {
          output += `\n  └─ Error: ${error.message}`;
        }
        if (error.stack && process.env.NODE_ENV === 'development') {
          output += `\n  └─ Stack: ${error.stack.split('\n').slice(1, 3).join('\n       ')}`;
        }
      }
      
      // Add service info
      if (service && environment) {
        output += `\n  └─ ${service} (${environment})`;
      }
      
      return output;
    });

    this.instance = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(...formats),
      defaultMeta: {
        service: process.env.SERVICE_NAME || 'auth-service',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
      },
      transports: [
        // Console transport with custom format
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            consoleFormat
          ),
        }),
      ],
    });

    // Add file transports in production
    if (process.env.NODE_ENV === 'production') {
      this.instance.add(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        })
      );

      this.instance.add(
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
        })
      );
    }

    this.info('Logger initialized', { level: logLevel, format: logFormat });
  }

  /**
   * Get the winston logger instance
   */
  private static getInstance(): winston.Logger {
    if (!this.instance) {
      this.initialize();
    }
    return this.instance;
  }

  /**
   * Extract correlation ID from request
   */
  static getCorrelationId(req?: Request): string | undefined {
    if (!req) return undefined;
    return (
      req.headers[this.correlationIdKey] as string ||
      req.headers[this.requestIdKey] as string ||
      req.id
    );
  }

  /**
   * Extract user context from request
   */
  static getUserContext(req?: Request): LogContext {
    if (!req) return {};
    const context: LogContext = {};
    if (req.user) {
      context.userId = req.user.id;
      context.tenantId = req.user.tenantId;
    }
    const correlationId = this.getCorrelationId(req);
    if (correlationId) {
      context.correlationId = correlationId;
    }
    return context;
  }

  /**
   * Log error message
   */
  static error(message: string, error?: Error | any, context?: LogContext): void {
    const meta: any = { context };
    if (error) {
      if (error instanceof Error) {
        meta.error = {
          message: error.message,
          stack: error.stack,
          name: error.name,
        };
      } else {
        meta.error = error;
      }
    }
    this.getInstance().error(message, meta);
  }

  /**
   * Log warning message
   */
  static warn(message: string, context?: LogContext): void {
    this.getInstance().warn(message, { context });
  }

  /**
   * Log info message
   */
  static info(message: string, context?: LogContext): void {
    this.getInstance().info(message, { context });
  }

  /**
   * Log HTTP request
   */
  static http(message: string, context?: LogContext & {
    method?: string;
    url?: string;
    statusCode?: number;
    duration?: number;
    ip?: string;
  }): void {
    this.getInstance().http(message, { context });
  }

  /**
   * Log debug message
   */
  static debug(message: string, context?: LogContext): void {
    this.getInstance().debug(message, { context });
  }

  /**
   * Create a child logger with additional context
   */
  static child(context: LogContext): winston.Logger {
    return this.getInstance().child({ context });
  }

  /**
   * Log with custom level
   */
  static log(level: LogLevel, message: string, context?: LogContext): void {
    this.getInstance().log(level, message, { context });
  }

  /**
   * Measure and log function execution time
   */
  static async measure<T>(
    message: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.debug(`${message} completed`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`${message} failed`, error, { ...context, duration });
      throw error;
    }
  }

  /**
   * Synchronous measure function
   */
  static measureSync<T>(
    message: string,
    fn: () => T,
    context?: LogContext
  ): T {
    const startTime = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      this.debug(`${message} completed`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`${message} failed`, error, { ...context, duration });
      throw error;
    }
  }

  /**
   * Log structured data
   */
  static logStructured(data: LogMetadata): void {
    this.getInstance().log(data.level, data.message, {
      context: data.context,
      error: data.error,
      duration: data.duration,
      ...data,
    });
  }

  /**
   * Flush all logs
   */
  static async flush(): Promise<void> {
    const logger = this.getInstance();
    await new Promise<void>((resolve) => {
      logger.on('finish', () => resolve());
      logger.end();
    });
  }
}

/**
 * Request logging middleware factory
 */
export function createRequestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const correlationId = Logger.getCorrelationId(req) || generateCorrelationId();
    
    // Attach correlation ID to request
    req.correlationId = correlationId;
    req.id = correlationId;

    // Log incoming request
    Logger.http('Incoming request', {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      correlationId,
    });

    // Capture response
    const originalSend = res.send;
    res.send = function (body: any) {
      const duration = Date.now() - startTime;
      
      Logger.http('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        correlationId,
      });

      originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Generate a unique correlation ID
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Error logging middleware factory
 */
export function createErrorLoggingMiddleware() {
  return (err: any, req: any, res: any, next: any) => {
    const context = Logger.getUserContext(req);
    
    Logger.error('Request error', err, {
      ...context,
      method: req.method,
      url: req.url,
      statusCode: err.status || 500,
    });

    next(err);
  };
}

// Initialize logger on import
Logger.initialize();
