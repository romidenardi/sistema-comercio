import { Router } from 'express';
import { upload } from '../config/multer.js';
import { importProducts, importCustomers, importSuppliers } from '../controllers/import.controller.js';

const router = Router();

router.post('/products', upload.single('file'), importProducts);
router.post('/customers', upload.single('file'), importCustomers);
router.post('/suppliers', upload.single('file'), importSuppliers);

export default router;