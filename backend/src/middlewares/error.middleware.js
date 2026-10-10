export const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Error de validación',
      errors: err.errors.map((e) => e.message),
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