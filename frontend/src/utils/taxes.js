export const VAT_OPTIONS = [
  { value: '21', label: '21%' },
  { value: '10.5', label: '10,5%' },
  { value: '0', label: '0%' },
];

export const formatRate = (rate) => `${String(Number(rate)).replace('.', ',')}%`;

export const vatToFormValue = (rate) =>
  (rate === undefined || rate === null || rate === '' ? '21' : String(Number(rate)));

export const toPercentOrNull = (value) =>
  (value === '' || value === null || value === undefined ? null : Number(value));

export const splitPrice = (total, vatRate, internalRate) => {
  const vat = Number(vatRate) || 0;
  const internal = Number(internalRate) || 0;
  const divisor = 1 + (vat + internal) / 100;
  const net = divisor > 1 ? total / divisor : total;
  return {
    net,
    vat: (net * vat) / 100,
    internal: (net * internal) / 100,
  };
};