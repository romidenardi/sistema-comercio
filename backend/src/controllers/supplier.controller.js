import { Supplier, Purchase } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pick } from '../utils/pick.js';

// Campos que se pueden cargar o editar desde la API (nunca businessId ni id)
const SUPPLIER_FIELDS = [
  'name', 'cuit', 'contactPerson', 'phone', 'email', 'address', 'city', 'province', 'active',
];

const findOwnSupplier = async (id, businessId) => {
  const supplier = await Supplier.findOne({ where: { id, businessId } });
  if (!supplier) throw httpError('Proveedor no encontrado', 404);
  return supplier;
};

const cleanActive = (data) => {
  if ('active' in data) data.active = data.active === true || data.active === 'true';
  return data;
};

export const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.findAll({ where: { businessId: req.user.businessId } });
  res.json(suppliers);
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create({
    ...cleanActive(pick(req.body, SUPPLIER_FIELDS)),
    businessId: req.user.businessId,
  });
  res.status(201).json(supplier);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await findOwnSupplier(req.params.id, req.user.businessId);
  await supplier.update(cleanActive(pick(req.body, SUPPLIER_FIELDS)));
  res.json(supplier);
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const supplier = await findOwnSupplier(req.params.id, businessId);

  // Un proveedor con compras no se borra: se perdería el historial de compras
  const purchases = await Purchase.count({ where: { supplierId: supplier.id, businessId } });
  if (purchases > 0) {
    throw httpError(
      `${supplier.name} tiene ${purchases} ${purchases === 1 ? 'compra registrada' : 'compras registradas'} y no se puede eliminar. `
      + 'Si ya no le comprás, editalo y marcalo como inactivo.',
      409
    );
  }

  await supplier.destroy();
  res.status(204).send();
});
