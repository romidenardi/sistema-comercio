export const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  // Errores de validación propios de Sequelize (ej: unique, enum inválido, notNull)
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Error de validación',
      errors: err.errors.map((e) => e.message),
    });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Error interno del servidor' });
};