import { Router } from 'express';
import { login, activateAccount } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/activate', activateAccount);

export default router;