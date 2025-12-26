/**
 * Metrics Service
 *
 * Provides Prometheus metrics collection for HTTP requests,
 * database queries, cache operations, and business metrics.
 */

import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * Metrics Service class
 */
export class MetricsService {
  private static instance: MetricsService;
  private register: Registry;

  // HTTP Request Metrics
  private httpRequestCounter!: Counter<string>;
  private httpRequestDuration!: Histogram<string>;
  private httpRequestInProgress!: Gauge<string>;

  // Database Metrics
  private dbQueryCounter!: Counter<string>;
  private dbQueryDuration!: Histogram<string>;
  private dbConnections!: Gauge<string>;

  // Cache Metrics
  private cacheOperationCounter!: Counter<string>;
  private cacheHitRate!: Gauge<string>;

  // Business Metrics
  private userRegistrationCounter!: Counter<string>;
  private loginCounter!: Counter<string>;
  private passwordResetCounter!: Counter<string>;
  private tokenRefreshCounter!: Counter<string>;

  // Error Metrics
  private errorCounter!: Counter<string>;

  private constructor() {
    this.register = new Registry();

    // Collect default Node.js metrics
    collectDefaultMetrics({ register: this.register });

    // Initialize metrics
    this.initializeHttpMetrics();
    this.initializeDatabaseMetrics();
    this.initializeCacheMetrics();
    this.initializeBusinessMetrics();
    this.initializeErrorMetrics();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MetricsService {
    if (!this.instance) {
      this.instance = new MetricsService();
    }
    return this.instance;
  }

  /**
   * Initialize HTTP request metrics
   */
  private initializeHttpMetrics(): void {
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'statusCode'],
      registers: [this.register],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'statusCode'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.httpRequestInProgress = new Gauge({
      name: 'http_requests_in_progress',
      help: 'Number of HTTP requests currently in progress',
      labelNames: ['method', 'route'],
      registers: [this.register],
    });
  }

  /**
   * Initialize database metrics
   */
  private initializeDatabaseMetrics(): void {
    this.dbQueryCounter = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'model', 'status'],
      registers: [this.register],
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'model', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.register],
    });

    this.dbConnections = new Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
      registers: [this.register],
    });
  }

  /**
   * Initialize cache metrics
   */
  private initializeCacheMetrics(): void {
    this.cacheOperationCounter = new Counter({
      name: 'cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'status'],
      registers: [this.register],
    });

    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      registers: [this.register],
    });
  }

  /**
   * Initialize business metrics
   */
  private initializeBusinessMetrics(): void {
    this.userRegistrationCounter = new Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['action', 'status'],
      registers: [this.register],
    });

    this.loginCounter = new Counter({
      name: 'logins_total',
      help: 'Total number of login attempts',
      labelNames: ['action', 'status'],
      registers: [this.register],
    });

    this.passwordResetCounter = new Counter({
      name: 'password_resets_total',
      help: 'Total number of password reset attempts',
      labelNames: ['action', 'status'],
      registers: [this.register],
    });

    this.tokenRefreshCounter = new Counter({
      name: 'token_refreshes_total',
      help: 'Total number of token refresh attempts',
      labelNames: ['action', 'status'],
      registers: [this.register],
    });
  }

  /**
   * Initialize error metrics
   */
  private initializeErrorMetrics(): void {
    this.errorCounter = new Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'statusCode'],
      registers: [this.register],
    });
  }

  /**
   * Record HTTP request
   */
  recordHttpRequest(method: string, route: string, statusCode: string, duration: number): void {
    this.httpRequestCounter.inc({ method, route, statusCode });
    this.httpRequestDuration.observe({ method, route, statusCode }, duration);
    this.httpRequestInProgress.dec({ method, route });
  }

  /**
   * Start HTTP request timer
   */
  startHttpRequestTimer(method: string, route: string): (statusCode: string) => void {
    this.httpRequestInProgress.inc({ method, route });
    const end = this.httpRequestDuration.startTimer({ method, route });
    return (statusCode: string) => {
      const duration = end();
      this.httpRequestCounter.inc({ method, route, statusCode });
      this.httpRequestInProgress.dec({ method, route });
    };
  }

  /**
   * Record database query
   */
  recordDbQuery(operation: string, model: string, status: string, duration: number): void {
    this.dbQueryCounter.inc({ operation, model, status });
    this.dbQueryDuration.observe({ operation, model, status }, duration);
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(operation: string, status: string): void {
    this.cacheOperationCounter.inc({ operation, status });
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(hitRate: number): void {
    this.cacheHitRate.set(hitRate);
  }

  /**
   * Record user registration
   */
  recordUserRegistration(status: 'success' | 'failure'): void {
    this.userRegistrationCounter.inc({ action: 'register', status });
  }

  /**
   * Record login attempt
   */
  recordLogin(status: 'success' | 'failure'): void {
    this.loginCounter.inc({ action: 'login', status });
  }

  /**
   * Record password reset
   */
  recordPasswordReset(status: 'success' | 'failure'): void {
    this.passwordResetCounter.inc({ action: 'reset', status });
  }

  /**
   * Record token refresh
   */
  recordTokenRefresh(status: 'success' | 'failure'): void {
    this.tokenRefreshCounter.inc({ action: 'refresh', status });
  }

  /**
   * Record error
   */
  recordError(type: string, statusCode: string): void {
    this.errorCounter.inc({ type, statusCode });
  }

  /**
   * Update database connections count
   */
  updateDbConnections(count: number): void {
    this.dbConnections.set(count);
  }

  /**
   * Get metrics as Prometheus format
   */
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  /**
   * Get metrics registry
   */
  getRegister(): Registry {
    return this.register;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  async resetMetrics(): Promise<void> {
    await this.register.resetMetrics();
  }
}

// Export singleton instance
export const metricsService = MetricsService.getInstance();
