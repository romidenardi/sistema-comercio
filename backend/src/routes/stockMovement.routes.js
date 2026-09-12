import { Router } from 'express';
import {
  getMovementsByProduct,
  createStockMovement,
} from '../controllers/stockMovement.controller.js';

const router = Router();

router.get('/product/:productId', getMovementsByProduct);
router.post('/', createStockMovement);

export default router;