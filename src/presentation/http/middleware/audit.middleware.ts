import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';

export class AuditMiddleware {
  static logAction(action: string) {
    return (req: RequestWithUser, res: Response, next: NextFunction) => {
      const auditLog = {
        userId: req.user?.userId || 'anonymous',
        tenantId: req.user?.tenantId || null,
        action,
        resource: req.route?.path || req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9),
      };

      // Log to console (replace with proper logging service in production)
      console.log('[AUDIT]', JSON.stringify(auditLog));

      // Store original end function
      const originalEnd = res.end;
      
      // Override end function to log response
      res.end = function(chunk?: any, encoding?: any) {
        const responseLog = {
          ...auditLog,
          statusCode: res.statusCode,
          success: res.statusCode < 400,
          responseTime: Date.now() - new Date(auditLog.timestamp).getTime(),
        };
        
        console.log('[AUDIT_RESPONSE]', JSON.stringify(responseLog));
        
        // Call original end function
        originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }
}