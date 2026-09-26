import { Router } from 'express';
import { body } from 'express-validator';
import { getPurchases, createPurchase } from '../controllers/purchase.controller.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

const createRules = [
  body('supplierId').notEmpty().withMessage('El proveedor es obligatorio'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un artículo'),
];

router.get('/', getPurchases);
router.post('/', createRules, validate, createPurchase);

export default router;