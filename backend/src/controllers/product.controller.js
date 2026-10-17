import pkg from 'sequelize';
import { Product } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';

const { Op } = pkg;

const cleanBarcode = (value) => {
  if (value === undefined) return undefined;
  const code = String(value ?? '').trim();
  return code || null;
};

const assertBarcodeFree = async (businessId, barcode, exceptId) => {
  if (!barcode) return;
  const where = { businessId, barcode };
  if (exceptId) where.id = { [Op.ne]: exceptId };
  const existing = await Product.findOne({ where });
  if (existing) {
    throw httpError(`El código de barras ya está asignado a "${existing.name}"`, 409);
  }
};

const rethrowDuplicate = (err) => {
  if (err?.name === 'SequelizeUniqueConstraintError') {
    throw httpError('Ese código de barras ya está asignado a otro producto', 409);
  }
  throw err;
};

const ALLOWED_VAT_RATES = [0, 10.5, 21];

const normalizeTaxes = (data, currentVat) => {
  if ('vatRate' in data && data.vatRate !== undefined && data.vatRate !== null && data.vatRate !== '') {
    const rate = Number(data.vatRate);
    const unchanged = currentVat !== undefined && Number(currentVat) === rate;
    if (!Number.isFinite(rate) || (!ALLOWED_VAT_RATES.includes(rate) && !unchanged)) {
      throw httpError('El IVA debe ser 21%, 10,5% o 0%');
    }
    data.vatRate = rate;
  }

  if ('otherTaxes' in data) {
    if (data.otherTaxes === '' || data.otherTaxes === null || data.otherTaxes === undefined) {
      data.otherTaxes = null;
    } else {
      const internal = Number(data.otherTaxes);
      if (!Number.isFinite(internal) || internal < 0 || internal > 100) {
        throw httpError('Los impuestos internos deben ser un porcentaje entre 0 y 100');
      }
      data.otherTaxes = internal;
    }
  }
  return data;
};

const findOwnProduct = async (id, businessId) => {
  const product = await Product.findOne({ where: { id, businessId } });
  if (!product) throw httpError('Producto no encontrado', 404);
  return product;
};

export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({ where: { businessId: req.user.businessId } });
  res.json(products);
});

export const getProductByBarcode = asyncHandler(async (req, res) => {
  const barcode = cleanBarcode(req.params.barcode);
  const product = barcode
    ? await Product.findOne({ where: { barcode, businessId: req.user.businessId } })
    : null;
  if (!product) throw httpError('Producto no encontrado', 404);
  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const barcode = cleanBarcode(req.body.barcode) ?? null;
  await assertBarcodeFree(businessId, barcode);

  const data = normalizeTaxes({ ...req.body });

  let product;
  try {
    product = await Product.create({ ...data, barcode, businessId });
  } catch (err) {
    rethrowDuplicate(err);
  }
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const product = await findOwnProduct(req.params.id, businessId);

  // Nunca se permite cambiar el comercio ni el id desde el pedido
  const { businessId: _ignoredBusiness, id: _ignoredId, ...data } = req.body;

  normalizeTaxes(data, product.vatRate);

  if ('barcode' in data) {
    data.barcode = cleanBarcode(data.barcode) ?? null;
    await assertBarcodeFree(businessId, data.barcode, product.id);
  }

  try {
    await product.update(data);
  } catch (err) {
    rethrowDuplicate(err);
  }
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await findOwnProduct(req.params.id, req.user.businessId);
  await product.destroy();
  res.status(204).send();
});
