import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;