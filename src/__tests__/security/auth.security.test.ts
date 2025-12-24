import request from 'supertest';
import app from '../../app';

describe('Authentication Security Tests', () => {
  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send(loginData);
      }

      // The 6th attempt should be rate limited
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Too many');
    });
  });

  describe('Input Validation', () => {
    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Weak password
          firstName: 'Test',
          lastName: 'User',
          tenantName: 'Test Tenant',
          tenantSlug: 'test-tenant'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain(
        expect.stringMatching(/password.*uppercase.*lowercase.*number.*special/i)
      );
    });

    it('should sanitize email input', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '  TEST@EXAMPLE.COM  ', // Should be normalized
          password: 'ValidPassword123!'
        });

      // Should not fail due to email format (will fail due to user not existing)
      expect(response.status).not.toBe(400);
    });
  });

  describe('JWT Security', () => {
    it('should reject malformed JWT tokens', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(response.status).toBe(401);
    });
  });

  describe('Information Disclosure', () => {
    it('should not reveal user existence in forgot password', async () => {
      const response1 = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response1.status).toBe(200);
      expect(response1.body.message).toContain('If the email exists');
    });
  });
});