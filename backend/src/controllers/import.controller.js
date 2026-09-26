import { Product, Customer, Supplier, Category } from '../models/index.js';
import { parseSpreadsheet } from '../utils/parseSpreadsheet.js';
import { processImport } from '../services/import.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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
      internalCode: String(row['Codigo Interno'] || row['codigo_interno'] || '').trim(),
      barcode: String(row['Codigo de Barras'] || row['codigo_barras'] || '').trim() || null,
      name: String(row['Nombre'] || row['nombre'] || '').trim(),
      brand: String(row['Marca'] || row['marca'] || '').trim() || null,
      categoryName: String(row['Categoria'] || row['categoria'] || '').trim(),
      price: Number(row['Precio'] || row['precio'] || 0),
      cost: Number(row['Costo'] || row['costo'] || 0),
      unitType: (String(row['Unidad'] || row['unidad'] || 'unit').trim() === 'peso') ? 'weight' : 'unit',
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
      businessName: String(row['Razon Social'] || row['razon_social'] || '').trim() || null,
      firstName: String(row['Nombre'] || row['nombre'] || '').trim() || null,
      lastName: String(row['Apellido'] || row['apellido'] || '').trim() || null,
      fiscalCondition: String(row['Condicion Fiscal'] || row['condicion_fiscal'] || '').trim(),
      cuit: String(row['CUIT'] || row['cuit'] || '').trim() || null,
      city: String(row['Localidad'] || row['localidad'] || '').trim() || null,
      province: String(row['Provincia'] || row['provincia'] || '').trim() || null,
      phone: String(row['Telefono'] || row['telefono'] || '').trim() || null,
      email: String(row['Email'] || row['email'] || '').trim() || null,
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
      name: String(row['Nombre'] || row['nombre'] || '').trim(),
      cuit: String(row['CUIT'] || row['cuit'] || '').trim() || null,
      contactPerson: String(row['Contacto'] || row['contacto'] || '').trim() || null,
      phone: String(row['Telefono'] || row['telefono'] || '').trim() || null,
      email: String(row['Email'] || row['email'] || '').trim() || null,
      city: String(row['Localidad'] || row['localidad'] || '').trim() || null,
      province: String(row['Provincia'] || row['provincia'] || '').trim() || null,
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