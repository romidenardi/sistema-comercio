import { Router } from 'express';
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from '../controllers/payment.controller.js';

const router = Router();

router.get('/', getPayments);
router.post('/', createPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;