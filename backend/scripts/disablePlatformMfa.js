import dotenv from 'dotenv';
dotenv.config();

import { sequelize, PlatformAdmin } from '../src/models/index.js';

// Desactiva el segundo factor de un superadmin que perdió el celular y los códigos de recuperación.
// En el próximo ingreso, después de la contraseña, se le pide configurarlo de nuevo con un QR nuevo.
// Uso (apuntando a la base del entorno, igual que createPlatformAdmin.js):
//   PLATFORM_ADMIN_EMAIL=mail@dominio.com node scripts/disablePlatformMfa.js
const email = (process.env.PLATFORM_ADMIN_EMAIL || '').trim().toLowerCase();

if (!email) {
  console.error('Definí PLATFORM_ADMIN_EMAIL con el email del superadmin.');
  process.exit(1);
}

try {
  await sequelize.authenticate();
  const admin = await PlatformAdmin.findOne({ where: { email } });
  if (!admin) {
    console.error('No existe un superadmin con ese email:', email);
    process.exitCode = 1;
  } else {
    await admin.update({
      totpEnabled: false,
      totpSecret: null,
      totpPendingSecret: null,
      totpLastStep: null,
      recoveryCodes: null,
    });
    console.log('Segundo factor desactivado para', email, '- en el próximo ingreso se configura de nuevo.');
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
