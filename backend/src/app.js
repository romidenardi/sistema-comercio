import express from 'express';
import cors from 'cors';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import stockMovementRoutes from './routes/stockMovement.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/payments', paymentRoutes);

export default app;