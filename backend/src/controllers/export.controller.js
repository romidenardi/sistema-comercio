import { Business } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { buildBusinessExport } from '../services/export.service.js';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const exportStatus = asyncHandler(async (req, res) => {
  const business = await Business.findByPk(req.user.businessId, {
    attributes: ['name', 'status', 'deleteAt'],
  });
  if (!business) throw httpError('Comercio no encontrado', 404);

  res.json({
    name: business.name,
    status: business.status,
    deleteAt: business.status === 'closing' ? business.deleteAt : null,
  });
});

export const exportBusinessData = asyncHandler(async (req, res) => {
  const { buffer, filename } = await buildBusinessExport(req.user.businessId);

  console.log(`[export] comercio ${req.user.businessId} · usuario ${req.user.id}`);

  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.send(buffer);
});
