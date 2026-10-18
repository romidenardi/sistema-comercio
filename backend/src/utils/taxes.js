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

export const splitLineParts = (itemTotal, components) => {
  let weights = components.map((c) => (Number(c.price) || 0) * (Number(c.quantity) || 0));
  let totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    weights = components.map((c) => Number(c.quantity) || 1);
    totalWeight = weights.reduce((sum, w) => sum + w, 0);
  }
  return components.map((c, index) => {
    const total = totalWeight > 0 ? (itemTotal * weights[index]) / totalWeight : 0;
    return {
      vatRate: Number(c.vatRate) || 0,
      internalRate: Number(c.otherTaxes) || 0,
      total,
      ...splitPrice(total, c.vatRate, c.otherTaxes),
    };
  });
};
