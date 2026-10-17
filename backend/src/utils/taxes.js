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
