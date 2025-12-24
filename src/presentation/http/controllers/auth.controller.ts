import { Request, Response, NextFunction } from 'express';
import { container } from '../../../infrastructure/di/container';
import { ResponseFormatter } from '../responses/response-formatter';
import { DomainException } from '../../../domain/exceptions/domain-exceptions';
import { OnboardUseCase } from '../../../application/use-cases/auth/onboard.use-case';
import { RegisterUseCase } from '../../../application/use-cases/auth/register.use-case';
import { LoginUseCase } from '../../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '../../../application/use-cases/auth/logout.use-case';
import { ValidateTokenUseCase } from '../../../application/use-cases/auth/validate-token.use-case';
import { ForgotPasswordUseCase } from '../../../application/use-cases/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../../application/use-cases/auth/reset-password.use-case';

export class AuthController {
  private onboardUseCase: OnboardUseCase;
  private registerUseCase: RegisterUseCase;
  private loginUseCase: LoginUseCase;
  private refreshTokenUseCase: RefreshTokenUseCase;
  private logoutUseCase: LogoutUseCase;
  private validateTokenUseCase: ValidateTokenUseCase;
  private forgotPasswordUseCase: ForgotPasswordUseCase;
  private resetPasswordUseCase: ResetPasswordUseCase;

  constructor() {
    this.onboardUseCase = container.get<OnboardUseCase>('OnboardUseCase');
    this.registerUseCase = container.get<RegisterUseCase>('RegisterUseCase');
    this.loginUseCase = container.get<LoginUseCase>('LoginUseCase');
    this.refreshTokenUseCase = container.get<RefreshTokenUseCase>('RefreshTokenUseCase');
    this.logoutUseCase = container.get<LogoutUseCase>('LogoutUseCase');
    this.validateTokenUseCase = container.get<ValidateTokenUseCase>('ValidateTokenUseCase');
    this.forgotPasswordUseCase = container.get<ForgotPasswordUseCase>('ForgotPasswordUseCase');
    this.resetPasswordUseCase = container.get<ResetPasswordUseCase>('ResetPasswordUseCase');
  }

  /**
   * @swagger
   * /api/v1/auth/onboard:
   *   post:
   *     summary: Onboard system with super admin
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *     responses:
   *       201:
   *         description: System onboarded successfully
   *       400:
   *         description: Bad request
   */
  async onboard(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await this.onboardUseCase.execute(req.body);
      return ResponseFormatter.success(res, null, 'System onboarded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     summary: Register new tenant
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - tenantName
   *               - tenantSlug
   *               - adminEmail
   *               - adminPassword
   *               - adminFirstName
   *               - adminLastName
   *             properties:
   *               tenantName:
   *                 type: string
   *               tenantSlug:
   *                 type: string
   *               adminEmail:
   *                 type: string
   *                 format: email
   *               adminPassword:
   *                 type: string
   *                 minLength: 8
   *               adminFirstName:
   *                 type: string
   *               adminLastName:
   *                 type: string
   *     responses:
   *       201:
   *         description: Tenant registered successfully
   *       400:
   *         description: Bad request
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await this.registerUseCase.execute(req.body);
      return ResponseFormatter.success(res, null, 'Tenant registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: User login
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               tenantSlug:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                 refreshToken:
   *                   type: string
   *                 user:
   *                   type: object
   *       401:
   *         description: Invalid credentials
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await this.loginUseCase.execute(req.body);
      return ResponseFormatter.success(res, result, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       401:
   *         description: Invalid refresh token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await this.refreshTokenUseCase.execute(req.body);
      return ResponseFormatter.success(res, result, 'Token refreshed successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/logout:
   *   post:
   *     summary: User logout
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: Logout successful
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await this.logoutUseCase.execute(req.body);
      return ResponseFormatter.success(res, null, 'Logout successful', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/validate:
   *   post:
   *     summary: Validate JWT token
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               token:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token is valid
   *       401:
   *         description: Token is invalid or expired
   */
  async validateToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authHeader = req.headers.authorization;
      let token = '';

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.body?.token) {
        token = req.body.token;
      } else {
        return ResponseFormatter.error(
          res,
          'Token is required',
          400,
          ['Token must be provided in Authorization header (Bearer token) or request body']
        );
      }

      const result = await this.validateTokenUseCase.execute(token);
      
      if (result.valid) {
        return ResponseFormatter.success(res, result, result.message || 'Token is valid', 200);
      } else {
        return ResponseFormatter.error(
          res,
          result.message || 'Token validation failed',
          result.expired ? 401 : 400,
          [result.message || 'Token is invalid']
        );
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/forgot-password:
   *   post:
   *     summary: Request password reset
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               tenantSlug:
   *                 type: string
   *     responses:
   *       200:
   *         description: Password reset email sent (if email exists)
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await this.forgotPasswordUseCase.execute(req.body);
      return ResponseFormatter.success(res, null, result.message, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/reset-password:
   *   post:
   *     summary: Reset password with token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *               - password
   *             properties:
   *               token:
   *                 type: string
   *               password:
   *                 type: string
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password reset successfully
   *       400:
   *         description: Invalid or expired token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await this.resetPasswordUseCase.execute(req.body);
      return ResponseFormatter.success(res, null, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}

