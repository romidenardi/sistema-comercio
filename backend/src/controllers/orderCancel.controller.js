import {
  Order, OrderItem, Product, Customer, Payment, StockMovement, sequelize,
} from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { round3 } from '../utils/numbers.js';

const arDate = (date) =>
  new Date(date).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

const orderIncludes = [
  { model: Customer },
  { model: Payment, attributes: ['id', 'name'] },
  {
    model: OrderItem,
    as: 'items',
    include: [{ model: Product, attributes: ['id', 'name', 'internalCode', 'unitType'] }],
  },
];

export const cancelOrder = asyncHandler(async (req, res) => {
  const { businessId, id: userId } = req.user;
  const reason = String(req.body?.reason || '').trim().slice(0, 255) || null;

  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, businessId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) throw httpError('Remito no encontrado', 404);
    if (order.status === 'cancelled') throw httpError('El remito ya está anulado', 409);

    const items = await OrderItem.findAll({ where: { orderId: order.id }, transaction: t });
    const customer = await Customer.findOne({
      where: { id: order.customerId, businessId },
      transaction: t,
    });
    const customerName = customer
      ? customer.businessName || [customer.firstName, customer.lastName].filter(Boolean).join(' ')
      : 'cliente';

    const quantityByProduct = new Map();
    const addBack = (productId, quantity) => {
      quantityByProduct.set(productId, round3((quantityByProduct.get(productId) || 0) + quantity));
    };
    for (const item of items) {
      if (Array.isArray(item.components) && item.components.length) {
        for (const component of item.components) {
          addBack(component.productId, Number(item.quantity) * Number(component.quantity));
        }
      } else {
        addBack(item.productId, Number(item.quantity));
      }
    }

    for (const [productId, quantity] of quantityByProduct) {
      const product = await Product.findOne({
        where: { id: productId, businessId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!product) throw httpError('Un producto del remito ya no existe: no se puede anular', 409);

      await StockMovement.create({
        businessId,
        productId,
        type: 'in',
        quantity,
        reason: `Anulación de remito del ${arDate(order.date)} a ${customerName}`,
      }, { transaction: t });

      product.stock = round3(product.stock + quantity);
      await product.save({ transaction: t });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    order.cancelledById = userId;
    await order.save({ transaction: t });

    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }

  const fullOrder = await Order.findOne({
    where: { id: req.params.id, businessId },
    include: orderIncludes,
  });
  res.json(fullOrder);
});
