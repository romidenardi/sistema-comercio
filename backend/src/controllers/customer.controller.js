import { Customer } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.findAll({ where: { businessId: req.user.businessId } });
  res.json(customers);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create({
    ...req.body,
    businessId: req.user.businessId,
  });
  res.status(201).json(customer);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findOne({ where: { id, businessId: req.user.businessId } });
  if (!customer) {
    const error = new Error('Customer not found');
    error.status = 404;
    throw error;
  }
  await customer.update(req.body);
  res.json(customer);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findOne({ where: { id, businessId: req.user.businessId } });
  if (!customer) {
    const error = new Error('Customer not found');
    error.status = 404;
    throw error;
  }
  await customer.destroy();
  res.status(204).send();
});