import { StockMovement, Product, sequelize } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMovementsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findOne({ where: { id: productId, businessId: req.user.businessId } });
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  const movements = await StockMovement.findAll({
    where: { productId },
    order: [['date', 'DESC']],
  });
  res.json(movements);
});

export const createStockMovement = asyncHandler(async (req, res) => {
  const { productId, type, quantity, reason, newStock } = req.body;

  const t = await sequelize.transaction();
  try {
    const product = await Product.findOne({
      where: { id: productId, businessId: req.user.businessId },
      transaction: t,
    });
    if (!product) {
      const error = new Error('Product not found');
      error.status = 404;
      throw error;
    }

    let delta;

    if (type === 'in') {
      delta = Math.abs(quantity);
    } else if (type === 'out') {
      delta = -Math.abs(quantity);
      if (product.stock + delta < 0) {
        const error = new Error('Stock insuficiente para este egreso');
        error.status = 400;
        throw error;
      }
    } else if (type === 'adjustment') {
      delta = newStock - product.stock;
    } else {
      const error = new Error('Tipo de movimiento inválido');
      error.status = 400;
      throw error;
    }

    const movement = await StockMovement.create({
      productId,
      type,
      quantity: delta,
      reason,
    }, { transaction: t });

    product.stock += delta;
    await product.save({ transaction: t });

    await t.commit();
    res.status(201).json({ movement, newStock: product.stock });
  } catch (error) {
    await t.rollback();
    throw error;
  }
});