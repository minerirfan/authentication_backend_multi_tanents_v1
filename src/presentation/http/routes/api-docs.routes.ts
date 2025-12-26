import { Router, Request, Response } from 'express';

export function createApiDocsRoutes(): Router {
  const router = Router();

  router.get('/', (req: Request, res: Response) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Tenant User Management System API Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px solid #667eea;
        }
        
        h1 {
            color: #2d3748;
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .subtitle {
            color: #718096;
            font-size: 1.1em;
            margin-bottom: 20px;
        }
        
        .meta-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            margin-top: 20px;
        }
        
        .meta-item {
            background: #f7fafc;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 0.9em;
            color: #4a5568;
            border: 1px solid #e2e8f0;
        }
        
        .meta-item strong {
            color: #667eea;
        }
        
        .links {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .links a {
            color: white;
            text-decoration: none;
            margin: 0 15px;
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            display: inline-block;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .links a:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        h2 {
            color: #2d3748;
            font-size: 1.8em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        h3 {
            color: #4a5568;
            font-size: 1.3em;
            margin: 25px 0 15px 0;
            font-weight: 600;
        }
        
        .endpoint {
            background: #f7fafc;
            padding: 25px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 5px solid #667eea;
            transition: all 0.3s ease;
        }
        
        .endpoint:hover {
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
            transform: translateX(5px);
        }
        
        .endpoint-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .method {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 6px;
            color: white;
            font-weight: 700;
            font-size: 0.85em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            min-width: 70px;
            text-align: center;
        }
        
        .get { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); }
        .post { background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); }
        .put { background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%); color: white; }
        .delete { background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); }
        
        .path {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: #edf2f7;
            padding: 6px 12px;
            border-radius: 4px;
            color: #2d3748;
            font-size: 0.9em;
            font-weight: 500;
        }
        
        .auth-badge {
            background: #fed7d7;
            color: #c53030;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: 600;
            border: 1px solid #fc8181;
        }
        
        .auth-badge.admin {
            background: #feebc8;
            color: #c05621;
            border-color: #f6ad55;
        }
        
        .auth-badge.super-admin {
            background: #e9d8fd;
            color: #805ad5;
            border-color: #b794f4;
        }
        
        .endpoint-description {
            color: #4a5568;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        
        .details {
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin-top: 15px;
        }
        
        .detail-section {
            margin-bottom: 20px;
        }
        
        .detail-section:last-child {
            margin-bottom: 0;
        }
        
        .detail-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 10px;
            font-size: 0.95em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .code-block {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.85em;
            line-height: 1.6;
        }
        
        .code-block .key {
            color: #63b3ed;
        }
        
        .code-block .string {
            color: #68d391;
        }
        
        .code-block .number {
            color: #f6ad55;
        }
        
        .code-block .boolean {
            color: #fc8181;
        }
        
        .code-block .comment {
            color: #a0aec0;
            font-style: italic;
        }
        
        .param-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .param-table th {
            background: #edf2f7;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            color: #2d3748;
            border-bottom: 2px solid #cbd5e0;
        }
        
        .param-table td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #4a5568;
        }
        
        .param-table tr:hover {
            background: #f7fafc;
        }
        
        .required {
            color: #e53e3e;
            font-weight: 600;
        }
        
        .optional {
            color: #718096;
            font-style: italic;
        }
        
        .security {
            background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
            padding: 25px;
            border-radius: 8px;
            border: 2px solid #68d391;
            margin-bottom: 30px;
        }
        
        .security h3 {
            color: #22543d;
            margin-top: 0;
        }
        
        .security ul {
            margin-left: 20px;
            margin-top: 10px;
        }
        
        .security li {
            margin-bottom: 8px;
            color: #2f855a;
        }
        
        .rate-limit {
            background: linear-gradient(135deg, #bee3f8 0%, #90cdf4 100%);
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #4299e1;
            margin-bottom: 20px;
        }
        
        .rate-limit h4 {
            color: #2c5282;
            margin-bottom: 10px;
        }
        
        .rate-limit p {
            color: #2b6cb0;
            margin: 5px 0;
        }
        
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .feature-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #48bb78;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .feature-item .icon {
            font-size: 1.2em;
        }
        
        .feature-item span {
            color: #2d3748;
            font-weight: 500;
        }
        
        .response-codes {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        
        .response-code {
            padding: 5px 12px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .response-code.success {
            background: #c6f6d5;
            color: #22543d;
        }
        
        .response-code.error {
            background: #fed7d7;
            color: #c53030;
        }
        
        .response-code.warning {
            background: #feebc8;
            color: #c05621;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            color: #718096;
        }
        
        .footer strong {
            color: #667eea;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            
            h1 {
                font-size: 1.8em;
            }
            
            .endpoint-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .meta-info {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Multi-Tenant User Management System API</h1>
            <p class="subtitle">Enterprise-grade authentication and authorization system with comprehensive security features</p>
            <div class="meta-info">
                <div class="meta-item"><strong>Version:</strong> 1.0.0</div>
                <div class="meta-item"><strong>Base URL:</strong> ${baseUrl}</div>
                <div class="meta-item"><strong>Environment:</strong> Production Ready</div>
            </div>
        </div>
        
        <div class="links">
            <strong>📚 Quick Links:</strong>
            <a href="${baseUrl}/api-docs/v1" target="_blank">Swagger UI (v1)</a>
            <a href="${baseUrl}/api-docs/latest" target="_blank">Swagger UI (Latest)</a>
        </div>

        <div class="section">
            <h2>🔐 Authentication Endpoints</h2>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/auth/onboard</span>
                </div>
                <p class="endpoint-description">Initial system setup with super admin user. This endpoint should be called once during initial deployment.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"email"</span>: <span class="string">"superadmin@example.com"</span>,
  <span class="key">"password"</span>: <span class="string">"SecurePass123!"</span>,
  <span class="key">"firstName"</span>: <span class="string">"John"</span>,
  <span class="key">"lastName"</span>: <span class="string">"Doe"</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (201 Created)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"System onboarded successfully"</span>
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/auth/register</span>
                </div>
                <p class="endpoint-description">Register a new tenant with admin user. Creates tenant organization and initial admin account.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"tenantName"</span>: <span class="string">"Acme Corporation"</span>,
  <span class="key">"tenantSlug"</span>: <span class="string">"acme-corp"</span>,
  <span class="key">"email"</span>: <span class="string">"admin@acme.com"</span>,
  <span class="key">"password"</span>: <span class="string">"SecurePass123!"</span>,
  <span class="key">"adminFirstName"</span>: <span class="string">"Jane"</span>,
  <span class="key">"adminLastName"</span>: <span class="string">"Smith"</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (201 Created)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Tenant registered successfully"</span>
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/auth/login</span>
                </div>
                <p class="endpoint-description">User login with email and password. Returns JWT access and refresh tokens.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"email"</span>: <span class="string">"user@example.com"</span>,
  <span class="key">"password"</span>: <span class="string">"SecurePass123!"</span>,
  <span class="key">"tenantSlug"</span>: <span class="string">"acme-corp"</span> <span class="comment">// Optional for super admin</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Login successful"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"accessToken"</span>: <span class="string">"eyJhbGciOiJIUzI1NiIs..."</span>,
    <span class="key">"refreshToken"</span>: <span class="string">"eyJhbGciOiJIUzI1NiIs..."</span>,
    <span class="key">"user"</span>: {
      <span class="key">"id"</span>: <span class="string">"user-123"</span>,
      <span class="key">"email"</span>: <span class="string">"user@example.com"</span>,
      <span class="key">"firstName"</span>: <span class="string">"John"</span>,
      <span class="key">"lastName"</span>: <span class="string">"Doe"</span>,
      <span class="key">"tenantId"</span>: <span class="string">"tenant-456"</span>,
      <span class="key">"roles"</span>: [<span class="string">"Admin"</span>],
      <span class="key">"permissions"</span>: [<span class="string">"users:read"</span>, <span class="string">"users:write"</span>]
    }
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/auth/logout</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">User logout. Invalidates the refresh token.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"refreshToken"</span>: <span class="string">"eyJhbGciOiJIUzI1NiIs..."</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Logout successful"</span>
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/auth/refresh</span>
                </div>
                <p class="endpoint-description">Refresh access token using refresh token.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"refreshToken"</span>: <span class="string">"eyJhbGciOiJIUzI1NiIs..."</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Token refreshed successfully"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"accessToken"</span>: <span class="string">"eyJhbGciOiJIUzI1NiIs..."</span>,
    <span class="key">"refreshToken"</span>: <span class="string">"eyJhbGciOiJIUzI1NiIs..."</span>
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/auth/forgot-password</span>
                </div>
                <p class="endpoint-description">Request password reset. Sends reset token to user's email.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"email"</span>: <span class="string">"user@example.com"</span>,
  <span class="key">"tenantSlug"</span>: <span class="string">"acme-corp"</span> <span class="comment">// Optional</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Password reset email sent if email exists"</span>
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/auth/reset-password</span>
                </div>
                <p class="endpoint-description">Reset password using the token received via email.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"token"</span>: <span class="string">"reset-token-abc123"</span>,
  <span class="key">"password"</span>: <span class="string">"NewSecurePass123!"</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Password reset successfully"</span>
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/auth/validate</span>
                </div>
                <p class="endpoint-description">Validate JWT token. Checks if token is valid and not expired.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"token"</span>: <span class="string">"eyJhbGciOiJIUzI1NiIs..."</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Token is valid"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"valid"</span>: <span class="boolean">true</span>,
    <span class="key">"expired"</span>: <span class="boolean">false</span>,
    <span class="key">"userId"</span>: <span class="string">"user-123"</span>
  }
}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>👥 User Management</h2>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/users/me</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Get current authenticated user's profile information.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Current user retrieved successfully"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"id"</span>: <span class="string">"user-123"</span>,
    <span class="key">"email"</span>: <span class="string">"user@example.com"</span>,
    <span class="key">"firstName"</span>: <span class="string">"John"</span>,
    <span class="key">"lastName"</span>: <span class="string">"Doe"</span>,
    <span class="key">"tenantId"</span>: <span class="string">"tenant-456"</span>,
    <span class="key">"roles"</span>: [{
      <span class="key">"id"</span>: <span class="string">"role-1"</span>,
      <span class="key">"name"</span>: <span class="string">"Admin"</span>,
      <span class="key">"description"</span>: <span class="string">"Administrator role"</span>
    }],
    <span class="key">"createdAt"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>,
    <span class="key">"updatedAt"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/users</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Get all users with pagination support. Super admins can view users across all tenants.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📋 Query Parameters</div>
                        <table class="param-table">
                            <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                            </tr>
                            <tr>
                                <td>page</td>
                                <td>integer</td>
                                <td class="optional">No</td>
                                <td>Page number (default: 1)</td>
                            </tr>
                            <tr>
                                <td>limit</td>
                                <td>integer</td>
                                <td class="optional">No</td>
                                <td>Items per page (default: 10)</td>
                            </tr>
                            <tr>
                                <td>tenantId</td>
                                <td>string</td>
                                <td class="optional">No</td>
                                <td>Tenant ID (super admin only)</td>
                            </tr>
                        </table>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Users retrieved successfully"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"users"</span>: [...],
    <span class="key">"pagination"</span>: {
      <span class="key">"page"</span>: <span class="number">1</span>,
      <span class="key">"limit"</span>: <span class="number">10</span>,
      <span class="key">"total"</span>: <span class="number">25</span>,
      <span class="key">"totalPages"</span>: <span class="number">3</span>
    }
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/users/:id</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Get user by ID.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📋 Path Parameters</div>
                        <table class="param-table">
                            <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                            </tr>
                            <tr>
                                <td>id</td>
                                <td>string</td>
                                <td class="required">Yes</td>
                                <td>User ID</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/users</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Create new user with specified roles.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"email"</span>: <span class="string">"newuser@example.com"</span>,
  <span class="key">"password"</span>: <span class="string">"SecurePass123!"</span>,
  <span class="key">"firstName"</span>: <span class="string">"Jane"</span>,
  <span class="key">"lastName"</span>: <span class="string">"Smith"</span>,
  <span class="key">"roleIds"</span>: [<span class="string">"role-1"</span>, <span class="string">"role-2"</span>],
  <span class="key">"tenantId"</span>: <span class="string">"tenant-456"</span> <span class="comment">// Super admin only</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (201 Created)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"User created successfully"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"id"</span>: <span class="string">"user-456"</span>,
    <span class="key">"email"</span>: <span class="string">"newuser@example.com"</span>,
    ...
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method put">PUT</span>
                    <span class="path">/api/v1/users/:id</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Update user information.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"email"</span>: <span class="string">"updated@example.com"</span>,
  <span class="key">"firstName"</span>: <span class="string">"Jane"</span>,
  <span class="key">"lastName"</span>: <span class="string">"Doe"</span>,
  <span class="key">"password"</span>: <span class="string">"NewSecurePass123!"</span>,
  <span class="key">"roleIds"</span>: [<span class="string">"role-1"</span>]
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"User updated successfully"</span>,
  <span class="key">"results"</span>: { ... }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method delete">DELETE</span>
                    <span class="path">/api/v1/users/:id</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Delete user by ID.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"User deleted successfully"</span>
}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🔑 Permissions & Roles</h2>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/user/permissions</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Get current user's permissions based on their assigned roles. Admin users receive all permissions.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"User permissions retrieved successfully"</span>,
  <span class="key">"results"</span>: [
    {
      <span class="key">"id"</span>: <span class="string">"perm-1"</span>,
      <span class="key">"name"</span>: <span class="string">"users:read"</span>,
      <span class="key">"resource"</span>: <span class="string">"users"</span>,
      <span class="key">"action"</span>: <span class="string">"read"</span>,
      <span class="key">"description"</span>: <span class="string">"Read user data"</span>
    },
    {
      <span class="key">"id"</span>: <span class="string">"perm-2"</span>,
      <span class="key">"name"</span>: <span class="string">"users:write"</span>,
      <span class="key">"resource"</span>: <span class="string">"users"</span>,
      <span class="key">"action"</span>: <span class="string">"write"</span>,
      <span class="key">"description"</span>: <span class="string">"Write user data"</span>
    }
  ]
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/permissions</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Get all permissions. Super admins can view permissions across all tenants.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📋 Query Parameters</div>
                        <table class="param-table">
                            <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                            </tr>
                            <tr>
                                <td>tenantId</td>
                                <td>string</td>
                                <td class="optional">No</td>
                                <td>Tenant ID (super admin only)</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/permissions</span>
                    <span class="auth-badge admin">🔒 Admin Only</span>
                </div>
                <p class="endpoint-description">Create new permission. Requires admin privileges.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"name"</span>: <span class="string">"reports:read"</span>,
  <span class="key">"resource"</span>: <span class="string">"reports"</span>,
  <span class="key">"action"</span>: <span class="string">"read"</span>,
  <span class="key">"description"</span>: <span class="string">"Read report data"</span>,
  <span class="key">"tenantId"</span>: <span class="string">"tenant-456"</span> <span class="comment">// Super admin only</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (201 Created)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Permission created successfully"</span>,
  <span class="key">"results"</span>: { ... }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method put">PUT</span>
                    <span class="path">/api/v1/permissions/:id</span>
                    <span class="auth-badge admin">🔒 Admin Only</span>
                </div>
                <p class="endpoint-description">Update permission details.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"name"</span>: <span class="string">"reports:read"</span>,
  <span class="key">"resource"</span>: <span class="string">"reports"</span>,
  <span class="key">"action"</span>: <span class="string">"read"</span>,
  <span class="key">"description"</span>: <span class="string">"Updated description"</span>
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method delete">DELETE</span>
                    <span class="path">/api/v1/permissions/:id</span>
                    <span class="auth-badge admin">🔒 Admin Only</span>
                </div>
                <p class="endpoint-description">Delete permission by ID.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Permission deleted successfully"</span>
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/roles</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Get all roles with pagination support.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📋 Query Parameters</div>
                        <table class="param-table">
                            <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                            </tr>
                            <tr>
                                <td>page</td>
                                <td>integer</td>
                                <td class="optional">No</td>
                                <td>Page number (default: 1)</td>
                            </tr>
                            <tr>
                                <td>limit</td>
                                <td>integer</td>
                                <td class="optional">No</td>
                                <td>Items per page (default: 10)</td>
                            </tr>
                            <tr>
                                <td>tenantId</td>
                                <td>string</td>
                                <td class="optional">No</td>
                                <td>Tenant ID (super admin only)</td>
                            </tr>
                        </table>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Roles retrieved successfully"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"roles"</span>: [
      {
        <span class="key">"id"</span>: <span class="string">"role-1"</span>,
        <span class="key">"name"</span>: <span class="string">"Admin"</span>,
        <span class="key">"description"</span>: <span class="string">"Administrator role"</span>,
        <span class="key">"tenantId"</span>: <span class="string">"tenant-456"</span>,
        <span class="key">"permissions"</span>: [
          {
            <span class="key">"id"</span>: <span class="string">"perm-1"</span>,
            <span class="key">"name"</span>: <span class="string">"users:read"</span>,
            <span class="key">"resource"</span>: <span class="string">"users"</span>,
            <span class="key">"action"</span>: <span class="string">"read"</span>
          }
        ],
        <span class="key">"createdAt"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>,
        <span class="key">"updatedAt"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>
      }
    ],
    <span class="key">"pagination"</span>: {
      <span class="key">"page"</span>: <span class="number">1</span>,
      <span class="key">"limit"</span>: <span class="number">10</span>,
      <span class="key">"total"</span>: <span class="number">5</span>,
      <span class="key">"totalPages"</span>: <span class="number">1</span>
    }
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/roles/:id</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Get role by ID with associated permissions.</p>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/roles</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Create new role with assigned permissions.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"name"</span>: <span class="string">"Manager"</span>,
  <span class="key">"description"</span>: <span class="string">"Manager role with limited permissions"</span>,
  <span class="key">"permissionIds"</span>: [<span class="string">"perm-1"</span>, <span class="string">"perm-2"</span>],
  <span class="key">"tenantId"</span>: <span class="string">"tenant-456"</span> <span class="comment">// Super admin only</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (201 Created)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Role created successfully"</span>,
  <span class="key">"results"</span>: { ... }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method put">PUT</span>
                    <span class="path">/api/v1/roles/:id</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Update role details and permissions.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"name"</span>: <span class="string">"Senior Manager"</span>,
  <span class="key">"description"</span>: <span class="string">"Updated description"</span>,
  <span class="key">"permissionIds"</span>: [<span class="string">"perm-1"</span>, <span class="string">"perm-2"</span>, <span class="string">"perm-3"</span>]
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method delete">DELETE</span>
                    <span class="path">/api/v1/roles/:id</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Delete role by ID.</p>
            </div>
        </div>

        <div class="section">
            <h2>👤 User Profiles</h2>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/user-profiles/:userId</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Get user profile by user ID.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📋 Path Parameters</div>
                        <table class="param-table">
                            <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                            </tr>
                            <tr>
                                <td>userId</td>
                                <td>string</td>
                                <td class="required">Yes</td>
                                <td>User ID</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/user-profiles/:userId</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Create user profile for a user.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"userId"</span>: <span class="string">"user-123"</span>,
  <span class="key">"phoneNumber"</span>: <span class="string">"+1234567890"</span>,
  <span class="key">"address"</span>: <span class="string">"123 Main St"</span>,
  <span class="key">"city"</span>: <span class="string">"New York"</span>,
  <span class="key">"country"</span>: <span class="string">"USA"</span>,
  <span class="key">"avatarUrl"</span>: <span class="string">"https://example.com/avatar.jpg"</span>
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method put">PUT</span>
                    <span class="path">/api/v1/user-profiles/:userId</span>
                    <span class="auth-badge">🔒 Auth Required</span>
                </div>
                <p class="endpoint-description">Update user profile information.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"phoneNumber"</span>: <span class="string">"+0987654321"</span>,
  <span class="key">"address"</span>: <span class="string">"456 Oak Ave"</span>,
  <span class="key">"city"</span>: <span class="string">"Los Angeles"</span>,
  <span class="key">"country"</span>: <span class="string">"USA"</span>
}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🏢 Tenant Management</h2>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/tenants</span>
                    <span class="auth-badge super-admin">🔒 Super Admin Only</span>
                </div>
                <p class="endpoint-description">Get all tenants with pagination. Super admin exclusive endpoint.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📋 Query Parameters</div>
                        <table class="param-table">
                            <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                            </tr>
                            <tr>
                                <td>page</td>
                                <td>integer</td>
                                <td class="optional">No</td>
                                <td>Page number (default: 1)</td>
                            </tr>
                            <tr>
                                <td>limit</td>
                                <td>integer</td>
                                <td class="optional">No</td>
                                <td>Items per page (default: 10)</td>
                            </tr>
                        </table>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Tenants retrieved successfully"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"tenants"</span>: [
      {
        <span class="key">"id"</span>: <span class="string">"tenant-456"</span>,
        <span class="key">"name"</span>: <span class="string">"Acme Corporation"</span>,
        <span class="key">"slug"</span>: <span class="string">"acme-corp"</span>,
        <span class="key">"isActive"</span>: <span class="boolean">true</span>,
        <span class="key">"createdAt"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>,
        <span class="key">"updatedAt"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>
      }
    ],
    <span class="key">"pagination"</span>: {
      <span class="key">"page"</span>: <span class="number">1</span>,
      <span class="key">"limit"</span>: <span class="number">10</span>,
      <span class="key">"total"</span>: <span class="number">15</span>,
      <span class="key">"totalPages"</span>: <span class="number">2</span>
    }
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/v1/tenants</span>
                    <span class="auth-badge super-admin">🔒 Super Admin Only</span>
                </div>
                <p class="endpoint-description">Create new tenant with admin user. Super admin exclusive endpoint.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"name"</span>: <span class="string">"New Company LLC"</span>,
  <span class="key">"slug"</span>: <span class="string">"new-company"</span>,
  <span class="key">"adminEmail"</span>: <span class="string">"admin@newcompany.com"</span>,
  <span class="key">"adminPassword"</span>: <span class="string">"SecurePass123!"</span>,
  <span class="key">"adminFirstName"</span>: <span class="string">"Admin"</span>,
  <span class="key">"adminLastName"</span>: <span class="string">"User"</span>
}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (201 Created)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Tenant created successfully"</span>,
  <span class="key">"results"</span>: { ... }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method put">PUT</span>
                    <span class="path">/api/v1/tenants/:id</span>
                    <span class="auth-badge super-admin">🔒 Super Admin Only</span>
                </div>
                <p class="endpoint-description">Update tenant information.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📝 Request Body</div>
                        <div class="code-block">
{
  <span class="key">"name"</span>: <span class="string">"Updated Company Name"</span>,
  <span class="key">"slug"</span>: <span class="string">"updated-company"</span>
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method delete">DELETE</span>
                    <span class="path">/api/v1/tenants/:id</span>
                    <span class="auth-badge super-admin">🔒 Super Admin Only</span>
                </div>
                <p class="endpoint-description">Delete tenant by ID. This action is irreversible.</p>
            </div>
        </div>

        <div class="section">
            <h2>❤️ Health & Monitoring</h2>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/health</span>
                </div>
                <p class="endpoint-description">Basic health check endpoint. Returns service status and uptime.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Service is healthy"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"status"</span>: <span class="string">"ok"</span>,
    <span class="key">"timestamp"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>,
    <span class="key">"uptime"</span>: <span class="number">12345.678</span>
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/health/detailed</span>
                </div>
                <p class="endpoint-description">Detailed health check with database, memory, and environment status.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"All systems operational"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"status"</span>: <span class="string">"ok"</span>,
    <span class="key">"timestamp"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>,
    <span class="key">"uptime"</span>: <span class="number">12345.678</span>,
    <span class="key">"version"</span>: <span class="string">"1.0.0"</span>,
    <span class="key">"environment"</span>: <span class="string">"production"</span>,
    <span class="key">"checks"</span>: {
      <span class="key">"database"</span>: {
        <span class="key">"status"</span>: <span class="string">"ok"</span>,
        <span class="key">"responseTime"</span>: <span class="number">5</span>
      },
      <span class="key">"memory"</span>: {
        <span class="key">"status"</span>: <span class="string">"ok"</span>,
        <span class="key">"usage"</span>: {
          <span class="key">"rss"</span>: <span class="number">123456789</span>,
          <span class="key">"heapTotal"</span>: <span class="number">98765432</span>,
          <span class="key">"heapUsed"</span>: <span class="number">54321098</span>,
          <span class="key">"external"</span>: <span class="number">1234567</span>
        }
      },
      <span class="key">"environment"</span>: {
        <span class="key">"status"</span>: <span class="string">"ok"</span>,
        <span class="key">"variables"</span>: [<span class="string">"All required variables present"</span>]
      }
    }
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/health/live</span>
                </div>
                <p class="endpoint-description">Kubernetes liveness probe. Returns 200 if the process is running.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Service is alive"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"status"</span>: <span class="string">"alive"</span>,
    <span class="key">"timestamp"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/health/ready</span>
                </div>
                <p class="endpoint-description">Kubernetes readiness probe. Returns 200 if all dependencies are ready.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">✅ Response (200 OK)</div>
                        <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Readiness check completed"</span>,
  <span class="key">"results"</span>: {
    <span class="key">"status"</span>: <span class="string">"ready"</span>,
    <span class="key">"timestamp"</span>: <span class="string">"2024-01-01T00:00:00.000Z"</span>,
    <span class="key">"checks"</span>: {
      <span class="key">"database"</span>: <span class="string">"ok"</span>,
      <span class="key">"redis"</span>: <span class="string">"ok"</span>
    }
  }
}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/health/summary</span>
                </div>
                <p class="endpoint-description">Simplified health summary for quick monitoring.</p>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/v1/health/:check</span>
                </div>
                <p class="endpoint-description">Get specific health check. Supported checks: database, redis, memory, disk, cpu.</p>
                <div class="details">
                    <div class="detail-section">
                        <div class="detail-title">📋 Path Parameters</div>
                        <table class="param-table">
                            <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th>Description</th>
                            </tr>
                            <tr>
                                <td>check</td>
                                <td>string</td>
                                <td class="required">Yes</td>
                                <td>Check name (database, redis, memory, disk, cpu)</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🔒 Security Features</h2>
            <div class="security">
                <h3>Authentication</h3>
                <p><strong>Type:</strong> JWT Bearer Token</p>
                <p><strong>Token Expiration:</strong> Access token (15 minutes), Refresh token (7 days)</p>
                
                <div class="rate-limit">
                    <h4>⚡ Rate Limiting</h4>
                    <p><strong>Authentication Endpoints:</strong> 5 requests per 15 minutes</p>
                    <p><strong>General Endpoints:</strong> 100 requests per 15 minutes</p>
                    <p><strong>Strict Endpoints:</strong> 20 requests per 15 minutes</p>
                </div>
                
                <h3>Password Requirements</h3>
                <ul>
                    <li>Minimum 8 characters</li>
                    <li>At least one uppercase letter (A-Z)</li>
                    <li>At least one lowercase letter (a-z)</li>
                    <li>At least one number (0-9)</li>
                    <li>At least one special character (!@#$%^&*)</li>
                </ul>
                
                <h3>Security Headers</h3>
                <ul>
                    <li>Content Security Policy (CSP)</li>
                    <li>HTTP Strict Transport Security (HSTS)</li>
                    <li>X-Frame-Options: DENY</li>
                    <li>X-Content-Type-Options: nosniff</li>
                    <li>X-XSS-Protection: 1; mode=block</li>
                </ul>
                
                <h3>Enterprise Security Features</h3>
                <div class="feature-list">
                    <div class="feature-item"><span class="icon">✅</span><span>Multi-tenant isolation</span></div>
                    <div class="feature-item"><span class="icon">✅</span><span>Role-based access control (RBAC)</span></div>
                    <div class="feature-item"><span class="icon">✅</span><span>Comprehensive audit logging</span></div>
                    <div class="feature-item"><span class="icon">✅</span><span>Password reset functionality</span></div>
                    <div class="feature-item"><span class="icon">✅</span><span>Input validation & sanitization</span></div>
                    <div class="feature-item"><span class="icon">✅</span><span>SQL injection protection</span></div>
                    <div class="feature-item"><span class="icon">✅</span><span>XSS prevention</span></div>
                    <div class="feature-item"><span class="icon">✅</span><span>CSRF protection</span></div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Response Format</h2>
            <p>All API responses follow a consistent format:</p>
            <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">true</span>,
  <span class="key">"message"</span>: <span class="string">"Operation description"</span>,
  <span class="key">"results"</span>: { <span class="comment">// or array for list endpoints</span>
    <span class="comment">// Response data</span>
  }
}
            </div>
            <br>
            <p>Error responses follow this format:</p>
            <div class="code-block">
{
  <span class="key">"success"</span>: <span class="boolean">false</span>,
  <span class="key">"message"</span>: <span class="string">"Error description"</span>,
  <span class="key">"errors"</span>: [<span class="string">"Specific error details"</span>]
}
            </div>
        </div>

        <div class="section">
            <h2>🔗 Authentication Headers</h2>
            <p>Include the JWT token in the Authorization header for protected endpoints:</p>
            <div class="code-block">
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            </div>
        </div>

        <div class="section">
            <h2>📝 Common Error Codes</h2>
            <table class="param-table">
                <tr>
                    <th>Status Code</th>
                    <th>Description</th>
                </tr>
                <tr>
                    <td>200</td>
                    <td>Success</td>
                </tr>
                <tr>
                    <td>201</td>
                    <td>Created</td>
                </tr>
                <tr>
                    <td>400</td>
                    <td>Bad Request - Invalid input</td>
                </tr>
                <tr>
                    <td>401</td>
                    <td>Unauthorized - Invalid or missing token</td>
                </tr>
                <tr>
                    <td>403</td>
                    <td>Forbidden - Insufficient permissions</td>
                </tr>
                <tr>
                    <td>404</td>
                    <td>Not Found - Resource doesn't exist</td>
                </tr>
                <tr>
                    <td>429</td>
                    <td>Too Many Requests - Rate limit exceeded</td>
                </tr>
                <tr>
                    <td>500</td>
                    <td>Internal Server Error</td>
                </tr>
                <tr>
                    <td>503</td>
                    <td>Service Unavailable - Health check failed</td>
                </tr>
            </table>
        </div>
        
        <div class="footer">
            <p><strong>Enterprise-grade security</strong> • <strong>Production-ready</strong> • <strong>0 vulnerabilities</strong></p>
            <p style="margin-top: 10px;">© 2024 Multi-Tenant User Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
    
    res.send(html);
  });

  return router;
}
