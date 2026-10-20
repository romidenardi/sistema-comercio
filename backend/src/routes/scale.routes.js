import { Router } from 'express';
import { getScaleConfig, updateScaleConfig } from '../controllers/scale.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', getScaleConfig);
router.put('/', requireRole('admin', 'editor'), updateScaleConfig);

export default router;
