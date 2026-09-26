export const processImport = async (rows, { mapRow, validateRow, createFn }) => {
  const results = { created: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // +2: fila 1 es el encabezado, y las filas de Excel arrancan en 1
    try {
      const data = mapRow(rows[i]);
      const validationError = validateRow(data);
      if (validationError) {
        results.errors.push({ row: rowNumber, message: validationError });
        continue;
      }
      await createFn(data);
      results.created++;
    } catch (error) {
      results.errors.push({ row: rowNumber, message: error.message });
    }
  }

  return results;
};