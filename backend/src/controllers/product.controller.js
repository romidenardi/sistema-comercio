import { Product } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll({ where: { businessId: req.user.businessId } });
  res.json(products);
});

export const getProductByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const product = await Product.findOne({ where: { barcode, businessId: req.user.businessId } });
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }
  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({
    ...req.body,
    businessId: req.user.businessId,
  });
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findOne({ where: { id, businessId: req.user.businessId } });
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }
  await product.update(req.body);
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findOne({ where: { id, businessId: req.user.businessId } });
  if (!product) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }
  await product.destroy();
  res.status(204).send();
});