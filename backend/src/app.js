import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import platformRoutes from './routes/platform.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import stockMovementRoutes from './routes/stockMovement.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import customerRoutes from './routes/customer.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import orderRoutes from './routes/order.routes.js';
import importRoutes from './routes/import.routes.js';
import userRoutes from './routes/user.routes.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
import { requireRole } from './middlewares/role.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const app = express();

app.set('trust proxy', 1); // detrás del proxy de Railway

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false }));
app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
});
app.use(['/api/auth/login', '/api/auth/activate', '/api/platform/login'], authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/platform', platformRoutes);

app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/stock-movements', authMiddleware, stockMovementRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/suppliers', authMiddleware, supplierRoutes);
app.use('/api/purchases', authMiddleware, purchaseRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/imports', authMiddleware, importRoutes);
app.use('/api/users', authMiddleware, requireRole('admin'), userRoutes);

app.use(errorMiddleware);

export default app;