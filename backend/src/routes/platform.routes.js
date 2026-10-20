import { Router } from 'express';
import {
  platformLogin,
  listBusinesses,
  createBusiness,
  setBusinessStatus,
  startClosure,
  cancelClosure,
  reinviteUser,
  resetDemo,
} from '../controllers/platform.controller.js';
import { platformAuthMiddleware } from '../middlewares/platformAuth.middleware.js';

const router = Router();

router.post('/login', platformLogin);

router.use(platformAuthMiddleware);
router.get('/businesses', listBusinesses);
router.post('/businesses', createBusiness);
router.patch('/businesses/:id/status', setBusinessStatus);
router.post('/businesses/:id/closure', startClosure);
router.delete('/businesses/:id/closure', cancelClosure);
router.post('/businesses/:id/reinvite', reinviteUser);
router.post('/businesses/:id/reset-demo', resetDemo);

export default router;
