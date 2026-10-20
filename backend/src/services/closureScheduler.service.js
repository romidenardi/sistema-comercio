import cron from 'node-cron';
import pkg from 'sequelize';
import { Business } from '../models/index.js';
import { purgeBusiness } from './businessPurge.service.js';

const { Op } = pkg;

const TIMEZONE = 'America/Argentina/Buenos_Aires';

export const runClosurePurge = async () => {
  if (process.env.DISABLE_AUTO_PURGE === 'true') return;

  const due = await Business.findAll({
    where: { status: 'closing', type: 'client', deleteAt: { [Op.lte]: new Date() } },
    attributes: ['id', 'name'],
  });

  for (const business of due) {
    try {
      await purgeBusiness(business.id);
      console.log(`[baja] Se eliminaron los datos del comercio ${business.id}`);
    } catch (error) {
      console.error(`[baja] No se pudo eliminar el comercio ${business.id}:`, error.message);
    }
  }
};

export const startClosureScheduler = () => {
  cron.schedule(
    '30 3 * * *',
    () => {
      runClosurePurge().catch((error) => console.error('[baja] Error en la tarea diaria:', error));
    },
    { timezone: TIMEZONE }
  );

  setTimeout(() => {
    runClosurePurge().catch((error) => console.error('[baja] Error al iniciar:', error));
  }, 30 * 1000);
};
