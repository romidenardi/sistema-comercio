import { Router } from 'express';
import { body } from 'express-validator';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

const createRules = [
  body('fiscalCondition').notEmpty().withMessage('La condición fiscal es obligatoria'),
  body().custom((_, { req }) => {
    if (!req.body.businessName && !req.body.firstName) {
      throw new Error('Debe completar razón social o nombre y apellido');
    }
    return true;
  }),
];

router.get('/', getCustomers);
router.post('/', createRules, validate, createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;