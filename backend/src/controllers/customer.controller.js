import { Customer, Order } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { pick } from '../utils/pick.js';

// Campos que se pueden cargar o editar desde la API (nunca businessId ni id)
const CUSTOMER_FIELDS = [
  'businessName', 'firstName', 'lastName', 'fiscalCondition', 'cuit',
  'address', 'zipCode', 'city', 'province', 'phone', 'email',
];

const displayName = (c) => c.businessName || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'El cliente';

const findOwnCustomer = async (id, businessId) => {
  const customer = await Customer.findOne({ where: { id, businessId } });
  if (!customer) throw httpError('Cliente no encontrado', 404);
  return customer;
};

export const getCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.findAll({ where: { businessId: req.user.businessId } });
  res.json(customers);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create({
    ...pick(req.body, CUSTOMER_FIELDS),
    businessId: req.user.businessId,
  });
  res.status(201).json(customer);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await findOwnCustomer(req.params.id, req.user.businessId);
  await customer.update(pick(req.body, CUSTOMER_FIELDS));
  res.json(customer);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const { businessId } = req.user;
  const customer = await findOwnCustomer(req.params.id, businessId);

  // Un cliente con remitos no se borra: se perdería el historial de ventas
  const orders = await Order.count({ where: { customerId: customer.id, businessId } });
  if (orders > 0) {
    throw httpError(
      `${displayName(customer)} tiene ${orders} ${orders === 1 ? 'remito' : 'remitos'} y no se puede eliminar, `
      + 'porque se perdería el historial de ventas. Si te pidió que borres sus datos, un administrador puede usar "Anonimizar".',
      409
    );
  }

  await customer.destroy();
  res.status(204).send();
});
