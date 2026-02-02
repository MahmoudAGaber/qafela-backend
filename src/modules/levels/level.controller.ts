import { Request, Response } from 'express';
import { getAllLevels, getLevelByNumber } from './level.service';
import { ResponseBuilder, ResponseCode } from '../../application/common/base-response';

class LevelController {
  async getAllLevels(req: Request, res: Response): Promise<Response> {
    try {
      const levels = await getAllLevels();
      const response = ResponseBuilder.success(levels, 'Levels retrieved successfully');
      return res.status(response.code).json(response);
    } catch (error: any) {
      const response = ResponseBuilder.failure(
        error.message || 'Failed to retrieve levels',
        ResponseCode.INTERNAL_ERROR
      );
      return res.status(response.code).json(response);
    }
  }

  async getLevelByNumber(req: Request, res: Response): Promise<Response> {
    try {
      const levelNumber = parseInt(req.params.levelNumber);
      if (isNaN(levelNumber)) {
        const response = ResponseBuilder.error('Invalid level number', ResponseCode.BAD_REQUEST);
        return res.status(response.code).json(response);
      }

      const level = await getLevelByNumber(levelNumber);
      if (!level) {
        const response = ResponseBuilder.error('Level not found', ResponseCode.NOT_FOUND);
        return res.status(response.code).json(response);
      }

      const response = ResponseBuilder.success(level, 'Level retrieved successfully');
      return res.status(response.code).json(response);
    } catch (error: any) {
      const response = ResponseBuilder.failure(
        error.message || 'Failed to retrieve level',
        ResponseCode.INTERNAL_ERROR
      );
      return res.status(response.code).json(response);
    }
  }
}

export const levelController = new LevelController();


