import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { rateLimit } from '../../middlewares/rateLimit';
import { UserController } from '../controllers/user.controller';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { RegisterUserUseCase } from '../../application/use-cases/user/register-user.use-case';
import { AuthenticateUserUseCase } from '../../application/use-cases/user/authenticate-user.use-case';
import { GetUserUseCase } from '../../application/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case';
import { avatarUpload, getFileUrl } from '../../infrastructure/utils/file-upload';

const router = Router();

// Dependency injection - In production, use a DI container
const userRepository = new UserRepository();
const registerUserUseCase = new RegisterUserUseCase(userRepository);
const authenticateUserUseCase = new AuthenticateUserUseCase(userRepository);
const getUserUseCase = new GetUserUseCase(userRepository);
const updateUserUseCase = new UpdateUserUseCase(userRepository);
const userController = new UserController(
  registerUserUseCase,
  authenticateUserUseCase,
  getUserUseCase,
  updateUserUseCase
);

const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });

// Register route with avatar upload
router.post('/register', authLimiter, avatarUpload.single('avatar'), async (req, res) => {
  // Handle file upload and add avatarUrl to body
  if ((req as any).file) {
    req.body.avatarUrl = getFileUrl((req as any).file.filename);
  }
  return userController.register(req, res);
});

// Login route
router.post('/login', authLimiter, (req, res) => userController.login(req, res));

// Get current user
router.get('/me', auth, (req, res) => userController.me(req, res));

// Daily login (awards XP for streak)
router.post('/daily-login', auth, (req, res) => userController.dailyLogin(req, res));

// Update user profile (with avatar upload support)
router.put('/me', auth, avatarUpload.single('avatar'), async (req, res) => {
  // Handle file upload and add avatarUrl to body
  if ((req as any).file) {
    req.body.avatarUrl = getFileUrl((req as any).file.filename);
  }
  return userController.update(req, res);
});

export default router;

