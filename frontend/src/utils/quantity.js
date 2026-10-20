// Cantidades: los productos por peso admiten hasta 3 decimales (kg); los de unidad, enteros.

export const round3 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 1000) / 1000;

export const isWeight = (unitType) => unitType === 'weight';

export const formatQuantity = (value, unitType) => {
  const n = Number(value) || 0;
  if (isWeight(unitType)) {
    return `${n.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
  }
  return n.toLocaleString('es-AR', { maximumFractionDigits: 3 });
};

export const formatSignedQuantity = (value, unitType) => {
  const n = Number(value) || 0;
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${formatQuantity(Math.abs(n), unitType)}`;
};

export const quantityStep = (unitType) => (isWeight(unitType) ? '0.001' : '1');
export const quantityMin = (unitType) => (isWeight(unitType) ? 0.001 : 1);
export const quantityUnitLabel = (unitType) => (isWeight(unitType) ? 'kg' : 'unidades');

export const toKg = (quantity, qtyUnit) => {
  const n = Number(quantity) || 0;
  return qtyUnit === 'g' ? round3(n / 1000) : n;
};

export const PRICE_BASES = [
  { value: '1000', label: 'kg' },
  { value: '500', label: '500 g' },
  { value: '250', label: '250 g' },
  { value: '100', label: '100 g' },
  { value: '1', label: '1 g' },
];

export const toPricePerKg = (price, base) => {
  const value = Number(price);
  const grams = Number(base) || 1000;
  if (!Number.isFinite(value)) return value;
  return Math.round(value * (1000 / grams) * 100) / 100;
};

export const perKg = (unitType) => (isWeight(unitType) ? ' /kg' : '');
