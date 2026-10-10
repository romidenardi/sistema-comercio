import cron from 'node-cron';
import { resetAllDemoBusinesses } from '../services/demo.service.js';

export const startDemoResetJob = () => {
  if (process.env.DEMO_RESET_ENABLED === 'false') return;

  cron.schedule(
    '0 3 * * *',
    () => { resetAllDemoBusinesses().catch((error) => console.error('[demo]', error)); },
    { timezone: 'America/Argentina/Buenos_Aires' }
  );
  console.log('[demo] Reinicio nocturno programado: 03:00 (Buenos Aires)');
};