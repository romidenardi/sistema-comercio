import { Product, ComboItem } from '../models/index.js';
import { round2 } from '../utils/numbers.js';

const num = (value) => Number(value) || 0;

export const computeCombo = (combo, components) => {
  const listPrice = components.reduce((sum, c) => sum + num(c.product.price) * c.quantity, 0);
  const cost = components.reduce((sum, c) => sum + num(c.product.cost) * c.quantity, 0);

  const hasSpecial = combo.specialPrice !== null && combo.specialPrice !== undefined && combo.specialPrice !== '';
  const price = hasSpecial ? num(combo.specialPrice) : listPrice;

  const stock = components.length
    ? Math.max(0, Math.min(...components.map((c) => Math.floor(num(c.product.stock) / c.quantity))))
    : 0;

  return { listPrice: round2(listPrice), cost: round2(cost), price: round2(price), stock };
};

export const loadComboComponents = async (comboIds, businessId, transaction) => {
  const result = new Map();
  if (!comboIds.length) return result;

  const items = await ComboItem.findAll({ where: { comboId: comboIds }, transaction });
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = productIds.length
    ? await Product.findAll({ where: { id: productIds, businessId }, transaction })
    : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) continue;
    const list = result.get(item.comboId) || [];
    list.push({ productId: item.productId, quantity: Number(item.quantity), product });
    result.set(item.comboId, list);
  }
  return result;
};

export const withComboData = async (products, businessId) => {
  const plain = products.map((p) => (typeof p.toJSON === 'function' ? p.toJSON() : p));
  const comboIds = plain.filter((p) => p.isCombo).map((p) => p.id);
  if (!comboIds.length) return plain;

  const componentsByCombo = await loadComboComponents(comboIds, businessId);

  return plain.map((p) => {
    if (!p.isCombo) return p;
    const components = componentsByCombo.get(p.id) || [];
    const calc = computeCombo(p, components);
    return {
      ...p,
      price: calc.price,
      cost: calc.cost,
      stock: calc.stock,
      listPrice: calc.listPrice,
      components: components.map((c) => ({
        productId: c.productId,
        name: c.product.name,
        internalCode: c.product.internalCode,
        quantity: c.quantity,
        price: num(c.product.price),
        cost: num(c.product.cost),
        stock: num(c.product.stock),
        vatRate: num(c.product.vatRate),
        otherTaxes: num(c.product.otherTaxes),
      })),
    };
  });
};
