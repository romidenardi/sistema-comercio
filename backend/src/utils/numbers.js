export const toNumber = (v) =>
  typeof v === 'number' || (typeof v === 'string' && v.trim() !== '') ? Number(v) : NaN;

export const toNumberOrZero = (v) => (v === undefined || v === null || v === '' ? 0 : toNumber(v));

export const isPositiveInt = (v) => {
  const n = toNumber(v);
  return Number.isInteger(n) && n > 0;
};

export const isNonNegative = (v) => {
  const n = toNumber(v);
  return Number.isFinite(n) && n >= 0;
};

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;