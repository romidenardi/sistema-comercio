import { Router } from 'express';
import { requireRole } from '../middlewares/role.middleware.js';
import { exportCustomerData, anonymizeCustomer } from '../controllers/dataRights.controller.js';

const router = Router();

router.use(requireRole('admin'));
router.get('/customers/:id/export', exportCustomerData);
router.post('/customers/:id/anonymize', anonymizeCustomer);

export default router;
