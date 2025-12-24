import swaggerJsdoc from 'swagger-jsdoc';

const baseOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
};

// V1 API Swagger Configuration
const v1Options: swaggerJsdoc.Options = {
  ...baseOptions,
  definition: {
    ...baseOptions.definition,
    info: {
      title: 'User Management System API',
      version: '1.0.0',
      description: 'Multi-tenant User Management System API v1 with authentication, roles, and permissions',
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server - API v1',
      },
      {
        url: 'http://localhost:3000/api/latest',
        description: 'Development server - Latest API (currently v1)',
      },
    ],
  },
  apis: ['./src/presentation/http/routes/v1/*.ts', './src/presentation/http/controllers/*.ts'],
};

export const swaggerSpecV1 = swaggerJsdoc(v1Options);

// Export default for backward compatibility (points to v1)
export const swaggerSpec = swaggerSpecV1;

