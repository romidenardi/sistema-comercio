import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  sendAccessLink,
} from '../controllers/user.controller.js';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.post('/:id/send-link', sendAccessLink);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;