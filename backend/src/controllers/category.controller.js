import { Category } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({
    where: { businessId: req.user.businessId },
    include: [{ model: Category, as: 'subcategories' }],
  });
  res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, parentId } = req.body;
  const category = await Category.create({
    name,
    parentId: parentId || null,
    businessId: req.user.businessId,
  });
  res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findOne({ where: { id, businessId: req.user.businessId } });
  if (!category) {
    const error = new Error('Category not found');
    error.status = 404;
    throw error;
  }
  await category.update(req.body);
  res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findOne({ where: { id, businessId: req.user.businessId } });
  if (!category) {
    const error = new Error('Category not found');
    error.status = 404;
    throw error;
  }
  await category.destroy();
  res.status(204).send();
});