import { Business } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolveScaleConfig, normalizeScaleConfig } from '../utils/scaleConfig.js';

export const getScaleConfig = asyncHandler(async (req, res) => {
  const business = await Business.findByPk(req.user.businessId, { attributes: ['id', 'scaleConfig'] });
  res.json(resolveScaleConfig(business?.scaleConfig));
});

export const updateScaleConfig = asyncHandler(async (req, res) => {
  const config = normalizeScaleConfig(req.body);
  await Business.update({ scaleConfig: config }, { where: { id: req.user.businessId } });
  res.json(config);
});
