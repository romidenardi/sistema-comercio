import { Purchase, PurchaseItem, Product, Supplier, StockMovement, sequelize } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { isPositiveInt, isNonNegative, toNumber, round2 } from '../utils/numbers.js';

const purchaseIncludes = [
  { model: Supplier, attributes: ['id', 'name'] },
  { model: PurchaseItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'internalCode'] }] },
];

export const getPurchases = asyncHandler(async (req, res) => {
  const purchases = await Purchase.findAll({
    where: { businessId: req.user.businessId },
    include: purchaseIncludes,
    order: [['date', 'DESC']],
  });
  res.json(purchases);
});

export const createPurchase = asyncHandler(async (req, res) => {
  const { supplierId, invoiceNumber, date, items } = req.body;
  const { businessId } = req.user;

  if (!Array.isArray(items) || items.length === 0) {
    throw httpError('La compra debe tener al menos un artículo');
  }

  const rows = items.map((item, index) => {
    const n = index + 1;
    if (!item || !item.productId) throw httpError(`Artículo ${n}: falta el producto`);
    if (!isPositiveInt(item.quantity)) throw httpError(`Artículo ${n}: la cantidad debe ser un entero mayor a 0`);
    if (!isNonNegative(item.unitCost)) throw httpError(`Artículo ${n}: el costo no es válido`);
    return {
      productId: item.productId,
      quantity: toNumber(item.quantity),
      unitCost: toNumber(item.unitCost),
    };
  });

  let purchaseDate = new Date();
  if (date) {
    purchaseDate = new Date(date);
    if (Number.isNaN(purchaseDate.getTime())) throw httpError('La fecha no es válida');
  }

  const t = await sequelize.transaction();
  let purchaseId;
  try {
    const supplier = await Supplier.findOne({ where: { id: supplierId, businessId }, transaction: t });
    if (!supplier) throw httpError('Proveedor no encontrado', 404);

    // Un solo registro por producto, aunque se repita en varias filas
    const byProduct = new Map();
    let total = 0;
    for (const row of rows) {
      let entry = byProduct.get(row.productId);
      if (!entry) {
        const product = await Product.findOne({
          where: { id: row.productId, businessId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!product) throw httpError(`Producto no encontrado: ${row.productId}`, 404);
        entry = { product, quantity: 0, lastCost: row.unitCost };
        byProduct.set(row.productId, entry);
      }
      entry.quantity += row.quantity;
      entry.lastCost = row.unitCost; // el costo del producto queda con el de la última fila
      total += row.quantity * row.unitCost;
    }

    const purchase = await Purchase.create({
      supplierId: supplier.id,
      invoiceNumber,
      date: purchaseDate,
      total: round2(total),
      businessId,
    }, { transaction: t });
    purchaseId = purchase.id;

    for (const row of rows) {
      await PurchaseItem.create({
        purchaseId: purchase.id,
        productId: row.productId,
        quantity: row.quantity,
        unitCost: row.unitCost,
      }, { transaction: t });
    }

    for (const { product, quantity, lastCost } of byProduct.values()) {
      await StockMovement.create({
        businessId,
        productId: product.id,
        type: 'in',
        quantity,
        reason: `Compra a proveedor ${supplier.name}`,
      }, { transaction: t });

      product.stock += quantity;
      product.cost = lastCost;
      await product.save({ transaction: t });
    }

    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }

  const fullPurchase = await Purchase.findOne({
    where: { id: purchaseId, businessId },
    include: purchaseIncludes,
  });
  res.status(201).json(fullPurchase);
});