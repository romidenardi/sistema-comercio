const FIELD_LABELS = {
  internalCode: 'código interno',
  barcode: 'código de barras',
  name: 'nombre',
  price: 'precio',
  cost: 'costo',
  vatRate: 'alícuota de IVA',
  email: 'email',
  businessName: 'razón social',
  firstName: 'nombre',
  cuit: 'CUIT',
};

const fieldLabel = (path) => FIELD_LABELS[path] || path;

const duplicateMessage = (err) => {
  const detail = `${err.original?.sqlMessage || ''} ${err.parent?.sqlMessage || ''} ${err.errors?.[0]?.path || ''}`;
  if (detail.includes('barcode')) {
    return 'Ese código de barras ya está asignado a otro producto';
  }
  return 'Ya existe un registro con esos datos';
};

export const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: duplicateMessage(err) });
  }

  if (err.name === 'SequelizeValidationError') {
    const details = (err.errors || []).map((e) => e.message);
    const fields = [...new Set((err.errors || []).map((e) => e.path).filter(Boolean))].map(fieldLabel);
    return res.status(400).json({
      message: fields.length
        ? `Revisá estos datos: ${fields.join(', ')}`
        : 'Error de validación',
      errors: details,
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  const isInternal = status >= 500 && process.env.NODE_ENV === 'production';
  res.status(status).json({
    message: isInternal ? 'Error interno del servidor' : err.message || 'Error interno del servidor',
  });
};