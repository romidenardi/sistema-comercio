import { Payment, InstallmentPlan, sequelize } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.findAll({
    where: { businessId: req.user.businessId },
    include: [{ model: InstallmentPlan, as: 'installmentPlans' }],
    order: [['name', 'ASC']],
  });
  res.json(payments);
});

export const createPayment = asyncHandler(async (req, res) => {
  const { name, installmentPlans } = req.body;

  const t = await sequelize.transaction();
  try {
    const payment = await Payment.create({
      name,
      businessId: req.user.businessId,
    }, { transaction: t });

    if (Array.isArray(installmentPlans)) {
      for (const plan of installmentPlans) {
        if (!plan.installments) continue;
        await InstallmentPlan.create({
          paymentId: payment.id,
          installments: Number(plan.installments),
          interestRate: Number(plan.interestRate) || 0,
        }, { transaction: t });
      }
    }

    await t.commit();

    const fullPayment = await Payment.findByPk(payment.id, {
      include: [{ model: InstallmentPlan, as: 'installmentPlans' }],
    });
    res.status(201).json(fullPayment);
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

export const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { installmentPlans, ...paymentData } = req.body;

  const payment = await Payment.findOne({ where: { id, businessId: req.user.businessId } });
  if (!payment) {
    const error = new Error('Payment not found');
    error.status = 404;
    throw error;
  }

  const t = await sequelize.transaction();
  try {
    await payment.update(paymentData, { transaction: t });

    if (Array.isArray(installmentPlans)) {
      await InstallmentPlan.destroy({ where: { paymentId: id }, transaction: t });
      for (const plan of installmentPlans) {
        if (!plan.installments) continue;
        await InstallmentPlan.create({
          paymentId: id,
          installments: Number(plan.installments),
          interestRate: Number(plan.interestRate) || 0,
        }, { transaction: t });
      }
    }

    await t.commit();

    const fullPayment = await Payment.findByPk(id, {
      include: [{ model: InstallmentPlan, as: 'installmentPlans' }],
    });
    res.json(fullPayment);
  } catch (error) {
    await t.rollback();
    throw error;
  }
});

export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findOne({ where: { id, businessId: req.user.businessId } });
  if (!payment) {
    const error = new Error('Payment not found');
    error.status = 404;
    throw error;
  }
  await InstallmentPlan.destroy({ where: { paymentId: id } });
  await payment.destroy();
  res.status(204).send();
});