import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

const createRules = [
  body('name').notEmpty().withMessage('El nombre es obligatorio'),
];

const updateRules = [
  body('name').optional().notEmpty().withMessage('El nombre no puede quedar vacío'),
];

router.get('/', getCategories);
router.post('/', createRules, validate, createCategory);
router.put('/:id', updateRules, validate, updateCategory);
router.delete('/:id', deleteCategory);

export default router;