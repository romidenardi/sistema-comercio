import { Router } from 'express';
import { body } from 'express-validator';
import { getOrders, getOrder, createOrder } from '../controllers/order.controller.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

const createRules = [
  body('customerId').notEmpty().withMessage('El cliente es obligatorio'),
  body('paymentId').notEmpty().withMessage('La forma de pago es obligatoria'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un artículo'),
];

router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createRules, validate, createOrder);

export default router;