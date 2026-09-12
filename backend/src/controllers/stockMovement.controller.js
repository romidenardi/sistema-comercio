import { StockMovement, Product, sequelize } from '../models/index.js';

export const getMovementsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const movements = await StockMovement.findAll({
      where: { productId },
      order: [['date', 'DESC']],
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock movements', error: error.message });
  }
};

export const createStockMovement = async (req, res) => {
  const { productId, type, quantity, reason, newStock } = req.body;

  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    let delta;

    if (type === 'in') {
      delta = Math.abs(quantity);
    } else if (type === 'out') {
      delta = -Math.abs(quantity);
      if (product.stock + delta < 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Stock insuficiente para este egreso' });
      }
    } else if (type === 'adjustment') {
      // acá quantity no se usa: se manda el stock real contado, y calculamos la diferencia
      delta = newStock - product.stock;
    } else {
      await t.rollback();
      return res.status(400).json({ message: 'Tipo de movimiento inválido' });
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
    res.status(400).json({ message: 'Error creating stock movement', error: error.message });
  }
};