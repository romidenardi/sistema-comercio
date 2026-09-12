import { Payment } from '../models/index.js';

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }
    const payment = await Payment.create({
      name,
      businessId: process.env.BUSINESS_ID_DEFAULT,
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Error creating payment', error: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    await payment.update(req.body);
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Error updating payment', error: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    await payment.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment', error: error.message });
  }
};