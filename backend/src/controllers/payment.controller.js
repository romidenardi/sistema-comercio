import { Payment } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.findAll({ where: { businessId: req.user.businessId } });
  res.json(payments);
});

export const createPayment = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const payment = await Payment.create({
    name,
    businessId: req.user.businessId,
  });
  res.status(201).json(payment);
});

export const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findOne({ where: { id, businessId: req.user.businessId } });
  if (!payment) {
    const error = new Error('Payment not found');
    error.status = 404;
    throw error;
  }
  await payment.update(req.body);
  res.json(payment);
});

export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findOne({ where: { id, businessId: req.user.businessId } });
  if (!payment) {
    const error = new Error('Payment not found');
    error.status = 404;
    throw error;
  }
  await payment.destroy();
  res.status(204).send();
});