import { Purchase, PurchaseItem, Product, Supplier, StockMovement, sequelize } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.findAll({
    where: { businessId: req.user.businessId },
    include: [
      { model: Supplier, attributes: ['id', 'name'] },
      { model: PurchaseItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'internalCode'] }] },
    ],
    order: [['date', 'DESC']],
  });
  res.json(purchases);
});

export const createPurchase = asyncHandler(async (req, res) => {
  const { supplierId, invoiceNumber, date, items } = req.body;

  if (!items || items.length === 0) {
    const error = new Error('La compra debe tener al menos un artículo');
    error.status = 400;
    throw error;
  }

  const t = await sequelize.transaction();
  try {
    const supplier = await Supplier.findOne({
      where: { id: supplierId, businessId: req.user.businessId },
      transaction: t,
    });
    if (!supplier) {
      const error = new Error('Proveedor no encontrado');
      error.status = 404;
      throw error;
    }

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
      total += item.quantity * item.unitCost;
      validatedItems.push({ product, quantity: item.quantity, unitCost: item.unitCost });
    }

    const purchase = await Purchase.create({
      supplierId,
      invoiceNumber,
      date: date || new Date(),
      total,
      businessId: req.user.businessId,
    }, { transaction: t });

    for (const { product, quantity, unitCost } of validatedItems) {
      await PurchaseItem.create({
        purchaseId: purchase.id,
        productId: product.id,
        quantity,
        unitCost,
      }, { transaction: t });

      await StockMovement.create({
        productId: product.id,
        type: 'in',
        quantity,
        reason: `Compra a proveedor ${supplier.name}`,
      }, { transaction: t });

      product.stock += quantity;
      product.cost = unitCost; // actualiza el costo con el de la última compra
      await product.save({ transaction: t });
    }

    await t.commit();

    const fullPurchase = await Purchase.findByPk(purchase.id, {
      include: [
        { model: Supplier, attributes: ['id', 'name'] },
        { model: PurchaseItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name'] }] },
      ],
    });
    res.status(201).json(fullPurchase);
  } catch (error) {
    await t.rollback();
    throw error;
  }
});