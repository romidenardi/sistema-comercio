import {
  Order, OrderItem, Product, Customer, Payment, InstallmentPlan, StockMovement, sequelize,
} from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { isPositiveInt, isNonNegative, toNumber, toNumberOrZero, round2 } from '../utils/numbers.js';

const FISCAL_CONDITIONS_WITH_VAT_BREAKDOWN = ['Responsable Inscripto'];
const ROLES_THAT_CAN_ADD_STOCK = ['admin', 'editor'];

const orderIncludes = [
  { model: Customer },
  { model: Payment, attributes: ['id', 'name'] },
  { model: OrderItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'internalCode'] }] },
];

export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    where: { businessId: req.user.businessId },
    include: orderIncludes,
    order: [['date', 'DESC']],
  });
  res.json(orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    where: { id: req.params.id, businessId: req.user.businessId },
    include: orderIncludes,
  });
  if (!order) throw httpError('Order not found', 404);
  res.json(order);
});

export const createOrder = asyncHandler(async (req, res) => {
  const { customerId, paymentId, installmentPlanId, items, notes } = req.body;
  const { businessId, role } = req.user;

  // ---- Validación de entrada ----
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError('El pedido debe tener al menos un artículo');
  }

  const rows = items.map((item, index) => {
    const n = index + 1;
    if (!item || !item.productId) throw httpError(`Artículo ${n}: falta el producto`);
    if (!isPositiveInt(item.quantity)) throw httpError(`Artículo ${n}: la cantidad debe ser un entero mayor a 0`);
    if (!isNonNegative(item.unitPrice)) throw httpError(`Artículo ${n}: el precio no es válido`);
    return {
      productId: item.productId,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      addStock: item.addStock === true,
    };
  });

  const discountPercent = toNumberOrZero(req.body.discountPercent);
  const discountAmount = toNumberOrZero(req.body.discountAmount);
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw httpError('El porcentaje de descuento debe estar entre 0 y 100');
  }
  if (!Number.isFinite(discountAmount) || discountAmount < 0) {
    throw httpError('El descuento por monto no es válido');
  }

  const t = await sequelize.transaction();
  let orderId;
  try {
    const customer = await Customer.findOne({ where: { id: customerId, businessId }, transaction: t });
    if (!customer) throw httpError('Cliente no encontrado', 404);

    const payment = await Payment.findOne({ where: { id: paymentId, businessId }, transaction: t });
    if (!payment) throw httpError('Forma de pago no encontrada', 404);

    let installmentPlan = null;
    if (installmentPlanId) {
      installmentPlan = await InstallmentPlan.findOne({
        where: { id: installmentPlanId, paymentId: payment.id, active: true },
        transaction: t,
      });
      if (!installmentPlan) throw httpError('Plan de cuotas no encontrado', 404);
    }

    // ---- Agrupar por producto: un solo registro por producto, aunque se repita en filas ----
    const requested = new Map();
    const addStockFor = new Set();
    for (const row of rows) {
      requested.set(row.productId, (requested.get(row.productId) || 0) + row.quantity);
      if (row.addStock) addStockFor.add(row.productId);
    }

    const stockPlan = new Map();
    for (const [productId, qty] of requested) {
      const product = await Product.findOne({
        where: { id: productId, businessId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!product) throw httpError(`Producto no encontrado: ${productId}`, 404);

      const shortfall = Math.max(qty - product.stock, 0);
      if (shortfall > 0) {
        if (!addStockFor.has(productId)) {
          throw httpError(`Stock insuficiente para ${product.name} (disponible: ${product.stock}, pedido: ${qty})`);
        }
        if (!ROLES_THAT_CAN_ADD_STOCK.includes(role)) {
          throw httpError(
            `No tenés permisos para agregar stock a ${product.name}. Pedile a un administrador o editor que lo cargue.`,
            403
          );
        }
      }
      stockPlan.set(productId, { product, qty, shortfall });
    }

    // ---- Totales, IVA y descuentos ----
    const discriminatesVat = FISCAL_CONDITIONS_WITH_VAT_BREAKDOWN.includes(customer.fiscalCondition);

    let grossSubtotal = 0;
    let grossVat = 0;
    let grossTotal = 0;
    for (const row of rows) {
      const { product } = stockPlan.get(row.productId);
      const itemTotal = row.quantity * row.unitPrice;
      const vatRate = Number(product.vatRate) || 0;
      const itemNet = vatRate > 0 ? itemTotal / (1 + vatRate / 100) : itemTotal;
      grossSubtotal += itemNet;
      grossVat += itemTotal - itemNet;
      grossTotal += itemTotal;
    }

    const totalDiscount = grossTotal * (discountPercent / 100) + discountAmount;
    if (totalDiscount > grossTotal + 0.005) {
      throw httpError('El descuento no puede ser mayor al total del remito');
    }

    const total = round2(grossTotal - totalDiscount);
    const scale = grossTotal > 0 ? total / grossTotal : 1;
    const subtotal = discriminatesVat ? round2(grossSubtotal * scale) : null;
    const vatAmount = discriminatesVat ? round2(grossVat * scale) : null;

    // ---- Cuotas ----
    let installmentsCount = null;
    let interestRate = null;
    let installmentAmount = null;
    let totalFinanced = null;
    if (installmentPlan) {
      installmentsCount = installmentPlan.installments;
      interestRate = Number(installmentPlan.interestRate);
      totalFinanced = round2(total * (1 + interestRate / 100));
      installmentAmount = round2(totalFinanced / installmentsCount);
    }

    // ---- Persistencia ----
    const order = await Order.create({
      customerId: customer.id,
      paymentId: payment.id,
      installmentPlanId: installmentPlan ? installmentPlan.id : null,
      notes,
      grossTotal: round2(grossTotal),
      discountPercent,
      discountAmount,
      total,
      subtotal,
      vatAmount,
      discriminatesVat,
      installmentsCount,
      interestRate,
      installmentAmount,
      totalFinanced,
      businessId,
    }, { transaction: t });
    orderId = order.id;

    for (const row of rows) {
      await OrderItem.create({
        orderId: order.id,
        productId: row.productId,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
      }, { transaction: t });
    }

    const customerName = customer.businessName || customer.firstName;
    for (const { product, qty, shortfall } of stockPlan.values()) {
      if (shortfall > 0) {
        await StockMovement.create({
          businessId,
          productId: product.id,
          type: 'in',
          quantity: shortfall,
          reason: `Ajuste desde remito a ${customerName}: faltaban ${shortfall} unidades`,
        }, { transaction: t });
      }

      await StockMovement.create({
        businessId,
        productId: product.id,
        type: 'out',
        quantity: -qty,
        reason: `Remito a cliente ${customerName}`,
      }, { transaction: t });

      product.stock = product.stock + shortfall - qty;
      await product.save({ transaction: t });
    }

    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }

  const fullOrder = await Order.findOne({
    where: { id: orderId, businessId },
    include: orderIncludes,
  });
  res.status(201).json(fullOrder);
});