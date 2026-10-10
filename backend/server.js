import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { sequelize } from './src/models/index.js';

const PORT = process.env.PORT || 3000;

const REQUIRED_ENV = [
  'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT',
  'JWT_SECRET', 'PLATFORM_JWT_SECRET', 'APP_URL',
];

const start = async () => {
  try {
    const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
    if (missing.length > 0) {
      console.error('Faltan variables de entorno:', missing.join(', '));
      process.exit(1);
    }
    if (process.env.JWT_SECRET === process.env.PLATFORM_JWT_SECRET) {
      console.error('JWT_SECRET y PLATFORM_JWT_SECRET deben ser distintos');
      process.exit(1);
    }

    await sequelize.authenticate();
    console.log('Conexión a MySQL exitosa');

    // sync() solo crea tablas nuevas; los cambios de columnas van por SQL (ver /migrations)
    await sequelize.sync();

    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
};

start();