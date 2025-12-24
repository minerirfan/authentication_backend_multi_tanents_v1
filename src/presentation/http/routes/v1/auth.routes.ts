import { Router } from 'express';
import { AuthController } from '../../controllers/auth.controller';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { authRateLimiter } from '../../middleware/rate-limit.middleware';
import {
  onboardValidator,
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../../validators/auth.validator';

export function createAuthRoutes(): Router {
  const router = Router();
  const authController = new AuthController();

  router.post(
    '/onboard',
    authRateLimiter,
    ValidationMiddleware.validate(onboardValidator),
    authController.onboard.bind(authController)
  );

  router.post(
    '/register',
    authRateLimiter,
    ValidationMiddleware.validate(registerValidator),
    authController.register.bind(authController)
  );

  router.post(
    '/login',
    authRateLimiter,
    ValidationMiddleware.validate(loginValidator),
    authController.login.bind(authController)
  );

  router.post(
    '/refresh',
    authRateLimiter,
    ValidationMiddleware.validate(refreshTokenValidator),
    authController.refreshToken.bind(authController)
  );

  router.post(
    '/logout',
    authRateLimiter,
    ValidationMiddleware.validate(refreshTokenValidator),
    authController.logout.bind(authController)
  );

  router.post('/validate', authRateLimiter, authController.validateToken.bind(authController));

  router.post(
    '/forgot-password',
    authRateLimiter,
    ValidationMiddleware.validate(forgotPasswordValidator),
    authController.forgotPassword.bind(authController)
  );

  router.post(
    '/reset-password',
    authRateLimiter,
    ValidationMiddleware.validate(resetPasswordValidator),
    authController.resetPassword.bind(authController)
  );

  return router;
}

