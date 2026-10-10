import { StockMovement, Product, sequelize } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { isPositiveInt, toNumber } from '../utils/numbers.js';

export const getMovementsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { businessId } = req.user;

  const product = await Product.findOne({ where: { id: productId, businessId } });
  if (!product) throw httpError('Product not found', 404);

  const movements = await StockMovement.findAll({
    where: { productId, businessId },
    order: [['date', 'DESC']],
  });
  res.json(movements);
});

export const createStockMovement = asyncHandler(async (req, res) => {
  const { productId, type, quantity, newStock } = req.body;
  const { businessId } = req.user;
  const reason = req.body.reason ? String(req.body.reason).slice(0, 255) : null;

  if (!['in', 'out', 'adjustment'].includes(type)) throw httpError('Tipo de movimiento inválido');

  if (type === 'adjustment') {
    const target = toNumber(newStock);
    if (!Number.isInteger(target) || target < 0) {
      throw httpError('El stock nuevo debe ser un entero mayor o igual a 0');
    }
  } else if (!isPositiveInt(quantity)) {
    throw httpError('La cantidad debe ser un entero mayor a 0');
  }

  const t = await sequelize.transaction();
  try {
    const product = await Product.findOne({
      where: { id: productId, businessId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!product) throw httpError('Product not found', 404);

    let delta;
    if (type === 'in') {
      delta = toNumber(quantity);
    } else if (type === 'out') {
      delta = -toNumber(quantity);
      if (product.stock + delta < 0) throw httpError('Stock insuficiente para este egreso');
    } else {
      delta = toNumber(newStock) - product.stock;
    }

    const movement = await StockMovement.create({
      businessId,
      productId: product.id,
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