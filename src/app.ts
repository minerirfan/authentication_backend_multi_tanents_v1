import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './infrastructure/config/database';
import { ErrorHandler } from './presentation/http/middleware/error-handler';
import { versionMiddleware } from './presentation/http/middleware/version.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpecV1 } from './presentation/http/swagger/swagger.config';
import { initializeContainer } from './infrastructure/di/container';
import { eventBus } from './infrastructure/events/event-bus';
import { UserCreatedHandler } from './infrastructure/events/handlers/user-created.handler';
import { TenantCreatedHandler } from './infrastructure/events/handlers/tenant-created.handler';
import { Logger, createRequestLoggingMiddleware, createErrorLoggingMiddleware } from './infrastructure/logging/logger';
import { createMetricsRoutes } from './presentation/http/routes/metrics.routes';

dotenv.config();

// Initialize Logger
Logger.initialize();

// Initialize Dependency Injection Container FIRST (before any route imports)
initializeContainer();

// Register Domain Event Handlers
const userCreatedHandler = new UserCreatedHandler();
const tenantCreatedHandler = new TenantCreatedHandler();
eventBus.subscribe('UserCreated', (event) => userCreatedHandler.handle(event as any));
eventBus.subscribe('TenantCreated', (event) => tenantCreatedHandler.handle(event as any));

// Import and create routes AFTER container initialization
import { createV1Routes } from './presentation/http/routes/v1';
const v1Routes = createV1Routes();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

// Request logging middleware
app.use(createRequestLoggingMiddleware());

// Morgan for additional logging (optional)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
import { createApiDocsRoutes } from './presentation/http/routes/api-docs.routes';
app.use('/api-docs', createApiDocsRoutes());

// Swagger Documentation - Versioned
app.use('/api-docs/v1', swaggerUi.serve, swaggerUi.setup(swaggerSpecV1));
app.use('/api-docs/latest', swaggerUi.serve, swaggerUi.setup(swaggerSpecV1));

// API Routes - Versioned
app.use('/api/v1', versionMiddleware, v1Routes);
app.use('/api/latest', versionMiddleware, v1Routes);

// Metrics routes
app.use(createMetricsRoutes());

// Error logging middleware
app.use(createErrorLoggingMiddleware());

// Error handling
app.use(ErrorHandler.handle);

// Graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function gracefulShutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully...`);
  
  // Stop accepting new connections
  const server = (app as any)._server;
  if (server) {
    server.close(async () => {
      console.log('Server closed');
      
      // Close database connection
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$disconnect();
        console.log('Database disconnected');
      } catch (error) {
        console.error('Error disconnecting database:', error);
      }
      
      // Flush logs (only if file transports exist)
      try {
        if (process.env.NODE_ENV === 'production') {
          await Logger.flush();
        }
      } catch (error) {
        // Ignore flush errors during shutdown
      }
      
      console.log('Graceful shutdown complete');
      process.exit(0);
    });
    
    // Force shutdown after timeout
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  }
}

// Start server
async function startServer() {
  try {
    await connectDatabase();
    const server = app.listen(PORT, () => {
      Logger.info(`Server is running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
      });
    });
    
    // Store server reference for graceful shutdown
    (app as any)._server = server;
  } catch (error) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();

export default app;

