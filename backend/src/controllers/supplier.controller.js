import { Supplier } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.findAll({ where: { businessId: req.user.businessId } });
  res.json(suppliers);
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create({
    ...req.body,
    businessId: req.user.businessId,
  });
  res.status(201).json(supplier);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supplier = await Supplier.findOne({ where: { id, businessId: req.user.businessId } });
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.status = 404;
    throw error;
  }
  await supplier.update(req.body);
  res.json(supplier);
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supplier = await Supplier.findOne({ where: { id, businessId: req.user.businessId } });
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.status = 404;
    throw error;
  }
  await supplier.destroy();
  res.status(204).send();
});