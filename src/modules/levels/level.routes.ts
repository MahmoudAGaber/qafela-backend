import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { levelController } from './level.controller';

const router = Router();

// Get all levels (public endpoint)
router.get('/', levelController.getAllLevels);

// Get level by number (public endpoint)
router.get('/:levelNumber', levelController.getLevelByNumber);

export default router;



