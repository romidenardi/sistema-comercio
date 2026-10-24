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

  // Respaldo de los chequeos de los controladores: la base rechazó borrar algo que tiene historial
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      message: 'No se puede eliminar porque tiene remitos o compras asociados. Podés marcarlo como inactivo.',
    });
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
    const messages = {
      LIMIT_FILE_SIZE: 'El archivo supera los 5 MB. Dividilo en archivos más chicos.',
      LIMIT_FILE_COUNT: 'Subí un solo archivo por vez.',
      LIMIT_UNEXPECTED_FILE: 'Subí un solo archivo por vez.',
    };
    return res.status(400).json({ message: messages[err.code] || 'No se pudo recibir el archivo' });
  }

  const status = err.status || 500;
  const isInternal = status >= 500 && process.env.NODE_ENV === 'production';
  res.status(status).json({
    message: isInternal ? 'Error interno del servidor' : err.message || 'Error interno del servidor',
  });
};