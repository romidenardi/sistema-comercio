export const numericGetter = (field) =>
  function getNumeric() {
    const value = this.getDataValue(field);
    return value === undefined || value === null ? value : Number(value);
  };
