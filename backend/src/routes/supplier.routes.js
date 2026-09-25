import { Router } from 'express';
import { body } from 'express-validator';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

const createRules = [
  body('name').notEmpty().withMessage('El nombre es obligatorio'),
];

router.get('/', getSuppliers);
router.post('/', createRules, validate, createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;