import { Router } from 'express';
import { body } from 'express-validator';
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from '../controllers/payment.controller.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

const createRules = [
  body('name').notEmpty().withMessage('El nombre es obligatorio'),
];

router.get('/', getPayments);
router.post('/', createRules, validate, createPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;