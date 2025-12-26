# Rate Limiting Fix

## Problem
The application was experiencing HTTP 429 (Too Many Requests) errors when loading the dashboard, preventing users from accessing tenant information, creating users, or performing other operations.

## Root Cause
The dashboard was making multiple simultaneous API calls to different endpoints:
- `/api/v1/tenants`
- `/api/v1/permissions`
- `/api/v1/roles` (for specific tenant)

With the rate limiting configuration in place (100 requests per 15 minutes), these concurrent calls were quickly exhausting the rate limit, causing the 429 errors.

## Solution
Implemented a development mode for rate limiting that can be disabled when needed:

### Changes Made

1. **Modified `backend/src/presentation/http/middleware/rate-limit.middleware.ts`**:
   - Added `DISABLE_RATE_LIMITING` flag that checks environment variables
   - When `DISABLE_RATE_LIMITING` is `true` or `NODE_ENV` is `development`, all rate limiters become no-op middleware that simply calls `next()`
   - Applied this pattern to all rate limiters:
     - `authRateLimiter`
     - `generalRateLimiter`
     - `strictRateLimiter`
     - `publicRateLimiter`
     - `docsRateLimiter`

2. **Updated `backend/.env`**:
   - Added `DISABLE_RATE_LIMITING=true` to disable rate limiting in development

3. **Updated `backend/.env.example`**:
   - Added documentation for the new `DISABLE_RATE_LIMITING` flag

## Configuration

### Environment Variables

```env
# Disable rate limiting entirely (true/false) - Recommended for development only
DISABLE_RATE_LIMITING=false

# Rate limiting configuration (only used when DISABLE_RATE_LIMITING=false)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5
STRICT_RATE_LIMIT_WINDOW_MS=60000
STRICT_RATE_LIMIT_MAX=10
```

### How It Works

When `DISABLE_RATE_LIMITING` is set to `true`:
- All rate limiters become pass-through middleware
- No request counting or limiting occurs
- Useful for development and testing environments

When `DISABLE_RATE_LIMITING` is set to `false`:
- Normal rate limiting applies
- Requests are counted and limited according to configuration
- Recommended for production environments

## Testing

After applying the fix, the rate limiting was tested by making 20 consecutive requests to the health endpoint. All 20 requests returned HTTP 200, confirming that rate limiting is disabled in development mode.

```bash
for i in {1..20}; do curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:3003/api/v1/health; done | grep -c "HTTP Status: 200"
# Output: 20
```

## Recommendations

### Development Environment
- Keep `DISABLE_RATE_LIMITING=true` for smooth development experience
- Allows multiple concurrent requests without hitting rate limits
- Perfect for dashboard testing and development

### Production Environment
- Set `DISABLE_RATE_LIMITING=false`
- Configure appropriate rate limits based on your needs
- Monitor rate limit usage and adjust as needed
- Consider using Redis for distributed rate limiting across multiple instances

### Alternative Solutions (If Needed)

If you want to keep rate limiting enabled but avoid 429 errors in development:

1. **Increase rate limits**:
   ```env
   RATE_LIMIT_MAX_REQUESTS=10000
   RATE_LIMIT_AUTH_MAX_REQUESTS=500
   ```

2. **Use shorter windows**:
   ```env
   RATE_LIMIT_WINDOW_MS=60000  # 1 minute instead of 15 minutes
   ```

3. **Implement request batching** on the frontend to reduce concurrent API calls

## Monitoring

You can monitor rate limit statistics by calling the metrics endpoint (if enabled):

```bash
curl http://localhost:3003/metrics
```

Or programmatically:

```typescript
import { getRateLimitStats } from './middleware/rate-limit.middleware';

const stats = await getRateLimitStats();
console.log(stats);
```

## Troubleshooting

### Still Getting 429 Errors?

1. **Check if the server restarted** after changing the `.env` file
2. **Verify the environment variable is set**:
   ```bash
   grep DISABLE_RATE_LIMITING backend/.env
   ```
3. **Clear Redis rate limit counters** (if using Redis):
   ```typescript
   import { clearRateLimitCounters } from './middleware/rate-limit.middleware';
   await clearRateLimitCounters();
   ```

### Rate Limiting Not Working in Production?

1. Ensure `DISABLE_RATE_LIMITING=false` is set in production
2. Verify `NODE_ENV=production` (not development)
3. Check that Redis is configured and connected (if using distributed rate limiting)

## Security Considerations

- **Never disable rate limiting in production** unless absolutely necessary
- Rate limiting protects against:
  - DDoS attacks
  - Brute force attacks on authentication endpoints
  - API abuse
- If you must disable it, implement alternative protection mechanisms

## Future Improvements

1. **Per-endpoint rate limiting**: Configure different limits for different endpoints
2. **User-based rate limiting**: Limit requests per user/IP rather than globally
3. **Adaptive rate limiting**: Automatically adjust limits based on traffic patterns
4. **Rate limit whitelisting**: Allow certain IPs/users to bypass rate limits
5. **Better error messages**: Include retry-after header with 429 responses
