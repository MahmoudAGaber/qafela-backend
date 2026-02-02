import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/user/register-user.use-case';
import { AuthenticateUserUseCase } from '../../application/use-cases/user/authenticate-user.use-case';
import { GetUserUseCase } from '../../application/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case';
import { registerSchema, loginSchema } from '../../modules/user/user.schema';
import { ResponseBuilder, ResponseCode } from '../../application/common/base-response';
import { processDailyLogin } from '../../modules/levels/daily-login.service';
import mongoose from 'mongoose';
import { UpdateUserDto } from '../../application/dtos/user.dto';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
  user?: { _id: any; id?: string };
}

export class UserController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private authenticateUserUseCase: AuthenticateUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private updateUserUseCase: UpdateUserUseCase
  ) {}

  async register(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        const response = ResponseBuilder.error(
          'Invalid input data',
          ResponseCode.BAD_REQUEST,
          parsed.error.issues
        );
        return res.status(response.code).json(response);
      }

      try {
        const result = await this.registerUserUseCase.execute(parsed.data);
        const response = ResponseBuilder.success(
          result,
          'User registered successfully',
          ResponseCode.CREATED
        );
        return res.status(response.code).json(response);
      } catch (e: any) {
        let message = 'Registration failed';
        let code = ResponseCode.INTERNAL_ERROR;

        if (e?.message === 'USERNAME_TAKEN') {
          message = 'Username is already taken';
          code = ResponseCode.CONFLICT;
        } else if (e?.message === 'EMAIL_TAKEN') {
          message = 'Email is already registered';
          code = ResponseCode.CONFLICT;
        } else if (e?.message === 'PHONE_TAKEN') {
          message = 'Phone number is already registered';
          code = ResponseCode.CONFLICT;
        }

        const response = ResponseBuilder.error(message, code);
        return res.status(response.code).json(response);
      }
    } catch (e) {
      const response = ResponseBuilder.failure('Registration failed', ResponseCode.INTERNAL_ERROR);
      return res.status(response.code).json(response);
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        const response = ResponseBuilder.error(
          'Invalid input data',
          ResponseCode.BAD_REQUEST,
          parsed.error.issues
        );
        return res.status(response.code).json(response);
      }

      try {
        const result = await this.authenticateUserUseCase.execute(parsed.data);
        const response = ResponseBuilder.success(result, 'Login successful');
        return res.status(response.code).json(response);
      } catch (e: any) {
        let message = 'Login failed';
        let code = ResponseCode.BAD_REQUEST;

        if (e?.message === 'INVALID_CREDENTIALS') {
          message = 'Invalid username/email or password';
        }

        const response = ResponseBuilder.error(message, code);
        return res.status(response.code).json(response);
      }
    } catch (e) {
      const response = ResponseBuilder.failure('Login failed', ResponseCode.INTERNAL_ERROR);
      return res.status(response.code).json(response);
    }
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const uid = req.user?.id || req.user?._id?.toString();
    if (!uid) {
      const response = ResponseBuilder.error('Unauthorized', ResponseCode.UNAUTHORIZED);
      return res.status(response.code).json(response);
    }

    const user = await this.getUserUseCase.execute(uid);
    if (!user) {
      const response = ResponseBuilder.error('User not found', ResponseCode.NOT_FOUND);
      return res.status(response.code).json(response);
    }

    const response = ResponseBuilder.success(user, 'User retrieved successfully');
    return res.status(response.code).json(response);
  }

  async dailyLogin(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const uid = req.user?.id || req.user?._id?.toString();
    if (!uid) {
      const response = ResponseBuilder.error('Unauthorized', ResponseCode.UNAUTHORIZED);
      return res.status(response.code).json(response);
    }

    try {
      const userId = new mongoose.Types.ObjectId(uid);
      const result = await processDailyLogin(userId);

      const response = ResponseBuilder.success(
        {
          streakUpdated: result.streakUpdated,
          xpAwarded: result.xpAwarded,
          currentStreak: result.currentStreak,
        },
        result.streakUpdated
          ? `Daily login recorded! ${result.xpAwarded} XP awarded.`
          : 'Already logged in today.'
      );
      return res.status(response.code).json(response);
    } catch (error: any) {
      const response = ResponseBuilder.failure(
        error.message || 'Failed to process daily login',
        ResponseCode.INTERNAL_ERROR
      );
      return res.status(response.code).json(response);
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const uid = req.user?.id || req.user?._id?.toString();
    if (!uid) {
      const response = ResponseBuilder.error('Unauthorized', ResponseCode.UNAUTHORIZED);
      return res.status(response.code).json(response);
    }

    try {
      // Validate input schema
      const updateSchema = z.object({
        username: z.string().min(3).max(24).optional(),
        fullName: z.string().min(3).max(50).optional(),
        email: z.string().email().optional(),
        avatarUrl: z.string().nullable().optional(), // Allow null or string, not require URL format
      });

      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        const response = ResponseBuilder.error(
          'Invalid input data',
          ResponseCode.BAD_REQUEST,
          parsed.error.issues
        );
        return res.status(response.code).json(response);
      }

      try {
        const result = await this.updateUserUseCase.execute(uid, parsed.data as UpdateUserDto);
        
        if (!result) {
          const response = ResponseBuilder.error('User not found', ResponseCode.NOT_FOUND);
          return res.status(response.code).json(response);
        }

        const response = ResponseBuilder.success(result, 'Profile updated successfully');
        return res.status(response.code).json(response);
      } catch (e: any) {
        let message = 'Update failed';
        let code = ResponseCode.INTERNAL_ERROR;

        if (e?.message === 'USERNAME_TAKEN') {
          message = 'Username is already taken';
          code = ResponseCode.CONFLICT;
        } else if (e?.message === 'EMAIL_TAKEN') {
          message = 'Email is already registered';
          code = ResponseCode.CONFLICT;
        }

        const response = ResponseBuilder.error(message, code);
        return res.status(response.code).json(response);
      }
    } catch (e) {
      const response = ResponseBuilder.failure('Update failed', ResponseCode.INTERNAL_ERROR);
      return res.status(response.code).json(response);
    }
  }
}

