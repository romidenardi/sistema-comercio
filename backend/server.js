import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { sequelize, Business } from './src/models/index.js';

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL exitosa');

    await sequelize.sync();

    const existing = await Business.findOne();
    if (!existing) {
      const newBusiness = await Business.create({ name: 'Mi comercio', cuit: '20000000000' });
      console.log('Business creado. Copiá este id a BUSINESS_ID_DEFAULT en tu .env:', newBusiness.id);
    }

    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  } catch (error) {
    console.error('Error al iniciar:', error);
  }
};

start();