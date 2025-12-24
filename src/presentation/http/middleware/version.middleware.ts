import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include apiVersion
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

const SUPPORTED_VERSIONS = ['v1'];
const LATEST_VERSION = 'v1';
const VERSION_PATTERN = /^v\d+$/;

/**
 * Middleware to extract and validate API version from URL path or headers
 * Priority: URL path > X-API-Version header > Accept header > Default to latest
 */
export const versionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let version: string | undefined;

  // 1. Try to extract from URL path (e.g., /api/v1/auth/login)
  // The path will be /api/v1/auth/login in the middleware before route matching
  const pathMatch = req.path.match(/\/(v\d+)\//);
  if (pathMatch) {
    version = pathMatch[1].toLowerCase();
  }

  // 2. Try X-API-Version header
  if (!version && req.headers['x-api-version']) {
    const headerVersion = req.headers['x-api-version'] as string;
    if (VERSION_PATTERN.test(headerVersion)) {
      version = headerVersion.toLowerCase();
    }
  }

  // 3. Try Accept header (e.g., application/vnd.api.v1+json)
  if (!version && req.headers.accept) {
    const acceptMatch = req.headers.accept.match(/application\/vnd\.api\.(v\d+)\+json/);
    if (acceptMatch) {
      version = acceptMatch[1].toLowerCase();
    }
  }

  // 4. Default to latest version if no version specified
  if (!version) {
    version = LATEST_VERSION;
  }

  // Validate version format
  if (!VERSION_PATTERN.test(version)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid API version format',
      statusCode: 400,
      errors: [`Version must match pattern: v1, v2, etc. Received: ${version}`],
    });
  }

  // Check if version is supported
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return res.status(404).json({
      success: false,
      message: 'API version not supported',
      statusCode: 404,
      errors: [
        `Version ${version} is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      ],
    });
  }

  // Attach version to request object
  req.apiVersion = version;
  next();
};

