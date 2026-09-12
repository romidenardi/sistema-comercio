import { Router } from 'express';
import { body } from 'express-validator';
import {
  getProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';

const router = Router();

const productValidationRules = [
  body('internalCode').notEmpty().withMessage('El código interno es obligatorio'),
  body('name').notEmpty().withMessage('El nombre es obligatorio'),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('cost').isFloat({ min: 0 }).withMessage('El costo debe ser un número positivo'),
  body('unitType').isIn(['unit', 'weight']).withMessage('unitType debe ser "unit" o "weight"'),
];

router.get('/', getProducts);
router.get('/barcode/:barcode', getProductByBarcode);
router.post('/', productValidationRules, createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;