import { Order, OrderItem, Product, Customer, Payment, InstallmentPlan, StockMovement, sequelize } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Condiciones fiscales para las que el remito discrimina IVA (Subtotal + IVA + Total).
// El resto muestra un único Total con IVA incluido, sin desglosar.
const FISCAL_CONDITIONS_WITH_VAT_BREAKDOWN = ['Responsable Inscripto'];

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    where: { businessId: req.user.businessId },
    include: [
      { model: Customer },
      { model: Payment, attributes: ['id', 'name'] },
      { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'internalCode'] }] },
    ],
    order: [['date', 'DESC']],
  });
  res.json(orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findOne({
    where: { id, businessId: req.user.businessId },
    include: [
      { model: Customer },
      { model: Payment, attributes: ['id', 'name'] },
      { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'internalCode'] }] },
    ],
  });
  if (!order) {
    const error = new Error('Order not found');
    error.status = 404;
    throw error;
  }
  res.json(order);
});

export const createOrder = asyncHandler(async (req, res) => {
  const { customerId, paymentId, installmentPlanId, items, notes } = req.body;

  if (!items || items.length === 0) {
    const error = new Error('El pedido debe tener al menos un artículo');
    error.status = 400;
    throw error;
  }

  const t = await sequelize.transaction();
  try {
    const customer = await Customer.findOne({
      where: { id: customerId, businessId: req.user.businessId },
      transaction: t,
    });
    if (!customer) {
      const error = new Error('Cliente no encontrado');
      error.status = 404;
      throw error;
    }

    const payment = await Payment.findOne({
      where: { id: paymentId, businessId: req.user.businessId },
      transaction: t,
    });
    if (!payment) {
      const error = new Error('Forma de pago no encontrada');
      error.status = 404;
      throw error;
    }

    let installmentPlan = null;
    if (installmentPlanId) {
      installmentPlan = await InstallmentPlan.findOne({
        where: { id: installmentPlanId, paymentId: payment.id },
        transaction: t,
      });
      if (!installmentPlan) {
        const error = new Error('Plan de cuotas no encontrado');
        error.status = 404;
        throw error;
      }
    }

    const discriminatesVat = FISCAL_CONDITIONS_WITH_VAT_BREAKDOWN.includes(customer.fiscalCondition);

    let subtotal = 0;
    let vatAmount = 0;
    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.productId, businessId: req.user.businessId },
        transaction: t,
      });
      if (!product) {
        const error = new Error(`Producto no encontrado: ${item.productId}`);
        error.status = 404;
        throw error;
      }
      if (product.stock < item.quantity) {
        const error = new Error(`Stock insuficiente para ${product.name} (disponible: ${product.stock})`);
        error.status = 400;
        throw error;
      }

      const itemTotal = item.quantity * item.unitPrice;
      const vatRate = Number(product.vatRate) || 0;
      const itemNet = vatRate > 0 ? itemTotal / (1 + vatRate / 100) : itemTotal;
      const itemVat = itemTotal - itemNet;

      subtotal += itemNet;
      vatAmount += itemVat;
      total += itemTotal;

      validatedItems.push({ product, quantity: item.quantity, unitPrice: item.unitPrice });
    }

    let installmentsCount = null;
    let interestRate = null;
    let installmentAmount = null;
    let totalFinanced = null;

    if (installmentPlan) {
      installmentsCount = installmentPlan.installments;
      interestRate = Number(installmentPlan.interestRate);
      totalFinanced = total * (1 + interestRate / 100);
      installmentAmount = totalFinanced / installmentsCount;
    }

    const order = await Order.create({
      customerId,
      paymentId,
      installmentPlanId: installmentPlan ? installmentPlan.id : null,
      notes,
      total,
      subtotal: discriminatesVat ? subtotal : null,
      vatAmount: discriminatesVat ? vatAmount : null,
      discriminatesVat,
      installmentsCount,
      interestRate,
      installmentAmount,
      totalFinanced,
      businessId: req.user.businessId,
    }, { transaction: t });

    for (const { product, quantity, unitPrice } of validatedItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: product.id,
        quantity,
        unitPrice,
      }, { transaction: t });

      await StockMovement.create({
        productId: product.id,
        type: 'out',
        quantity: -quantity,
        reason: `Remito a cliente ${customer.businessName || customer.firstName}`,
      }, { transaction: t });

      product.stock -= quantity;
      await product.save({ transaction: t });
    }

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        { model: Customer },
        { model: Payment, attributes: ['id', 'name'] },
        { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name'] }] },
      ],
    });
    res.status(201).json(fullOrder);
  } catch (error) {
    await t.rollback();
    throw error;
  }
});