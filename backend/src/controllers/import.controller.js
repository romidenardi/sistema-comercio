import { Product, Customer, Supplier, Category } from '../models/index.js';
import { parseSpreadsheet } from '../utils/parseSpreadsheet.js';
import { processImport } from '../services/import.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const normalizeKey = (key) =>
  key
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_\s]+/g, ' ')
    .trim();

const getField = (row, ...possibleNames) => {
  const normalizedRow = {};
  for (const key of Object.keys(row)) {
    normalizedRow[normalizeKey(key)] = row[key];
  }
  for (const name of possibleNames) {
    const value = normalizedRow[normalizeKey(name)];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
};

export const importProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('No se recibió ningún archivo');
    error.status = 400;
    throw error;
  }

  const rows = parseSpreadsheet(req.file.buffer);
  const categories = await Category.findAll({ where: { businessId: req.user.businessId } });

  const results = await processImport(rows, {
    mapRow: (row) => ({
      internalCode: String(getField(row, 'Codigo Interno')).trim(),
      barcode: String(getField(row, 'Codigo de Barras')).trim() || null,
      name: String(getField(row, 'Nombre')).trim(),
      brand: String(getField(row, 'Marca')).trim() || null,
      categoryName: String(getField(row, 'Categoria')).trim(),
      price: Number(getField(row, 'Precio') || 0),
      cost: Number(getField(row, 'Costo') || 0),
      unitType: (String(getField(row, 'Unidad') || 'unidad').trim().toLowerCase() === 'peso') ? 'weight' : 'unit',
    }),
    validateRow: (data) => {
      if (!data.internalCode) return 'Falta el código interno';
      if (!data.name) return 'Falta el nombre';
      if (isNaN(data.price) || data.price < 0) return 'Precio inválido';
      if (isNaN(data.cost) || data.cost < 0) return 'Costo inválido';
      return null;
    },
    createFn: async (data) => {
      const category = categories.find((c) => c.name.toLowerCase() === data.categoryName.toLowerCase());
      await Product.create({
        internalCode: data.internalCode,
        barcode: data.barcode,
        name: data.name,
        brand: data.brand,
        price: data.price,
        cost: data.cost,
        unitType: data.unitType,
        categoryId: category ? category.id : null,
        businessId: req.user.businessId,
      });
    },
  });

  res.json(results);
});

export const importCustomers = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('No se recibió ningún archivo');
    error.status = 400;
    throw error;
  }

  const rows = parseSpreadsheet(req.file.buffer);

  const results = await processImport(rows, {
    mapRow: (row) => ({
      businessName: String(getField(row, 'Razon Social')).trim() || null,
      firstName: String(getField(row, 'Nombre')).trim() || null,
      lastName: String(getField(row, 'Apellido')).trim() || null,
      fiscalCondition: String(getField(row, 'Condicion Fiscal')).trim(),
      cuit: String(getField(row, 'CUIT')).trim() || null,
      city: String(getField(row, 'Localidad')).trim() || null,
      province: String(getField(row, 'Provincia')).trim() || null,
      phone: String(getField(row, 'Telefono')).trim() || null,
      email: String(getField(row, 'Email')).trim() || null,
    }),
    validateRow: (data) => {
      if (!data.businessName && !data.firstName) return 'Falta razón social o nombre';
      if (!data.fiscalCondition) return 'Falta la condición fiscal';
      return null;
    },
    createFn: async (data) => {
      await Customer.create({ ...data, businessId: req.user.businessId });
    },
  });

  res.json(results);
});

export const importSuppliers = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error('No se recibió ningún archivo');
    error.status = 400;
    throw error;
  }

  const rows = parseSpreadsheet(req.file.buffer);

  const results = await processImport(rows, {
    mapRow: (row) => ({
      name: String(getField(row, 'Nombre')).trim(),
      cuit: String(getField(row, 'CUIT')).trim() || null,
      contactPerson: String(getField(row, 'Contacto')).trim() || null,
      phone: String(getField(row, 'Telefono')).trim() || null,
      email: String(getField(row, 'Email')).trim() || null,
      city: String(getField(row, 'Localidad')).trim() || null,
      province: String(getField(row, 'Provincia')).trim() || null,
    }),
    validateRow: (data) => {
      if (!data.name) return 'Falta el nombre';
      return null;
    },
    createFn: async (data) => {
      await Supplier.create({ ...data, businessId: req.user.businessId });
    },
  });

  res.json(results);
});