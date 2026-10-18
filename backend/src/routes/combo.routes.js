import { Router } from 'express';
import { createCombo, updateCombo, deleteCombo } from '../controllers/combo.controller.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

router.post('/', requireRole('admin', 'editor'), createCombo);
router.put('/:id', requireRole('admin', 'editor'), updateCombo);
router.delete('/:id', requireRole('admin', 'editor'), deleteCombo);

export default router;
