import { Router } from 'express';
import { body } from 'express-validator';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = Router();

const createRules = [
  body('name').notEmpty().withMessage('El nombre es obligatorio'),
];

router.get('/', getSuppliers);
router.post('/', requireRole('admin', 'editor'), createRules, validate, createSupplier);
router.put('/:id', requireRole('admin', 'editor'), updateSupplier);
router.delete('/:id', requireRole('admin', 'editor'), deleteSupplier);

export default router;