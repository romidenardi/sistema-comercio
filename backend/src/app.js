import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import stockMovementRoutes from './routes/stockMovement.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { authMiddleware } from './middlewares/auth.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes); // sin protección: acá es donde se consigue el token

app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/stock-movements', authMiddleware, stockMovementRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);

export default app;