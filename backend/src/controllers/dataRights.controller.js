import { Customer, Order, OrderItem } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { buildWorkbookBuffer, sheetFrom, columnsOf, todayStamp } from '../services/export.service.js';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const CUSTOMER_LABELS = {
  id: 'Id',
  businessName: 'Razón social',
  firstName: 'Nombre',
  lastName: 'Apellido',
  fiscalCondition: 'Condición fiscal',
  cuit: 'CUIT',
  address: 'Domicilio',
  zipCode: 'Código postal',
  city: 'Localidad',
  province: 'Provincia',
  phone: 'Teléfono',
  email: 'Email',
  createdAt: 'Fecha de alta',
  updatedAt: 'Última modificación',
};

const findCustomer = async (req) => {
  const customer = await Customer.findOne({
    where: { id: req.params.id, businessId: req.user.businessId },
  });
  if (!customer) throw httpError('Cliente no encontrado', 404);
  return customer;
};

export const exportCustomerData = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req);
  const businessId = req.user.businessId;

  const orders = await Order.findAll({
    where: { customerId: customer.id, businessId },
    order: [['createdAt', 'ASC']],
    raw: true,
  });
  const orderIds = orders.map((order) => order.id);
  const items = orderIds.length
    ? await OrderItem.findAll({ where: { orderId: orderIds }, raw: true })
    : [];

  const plain = customer.get({ plain: true });
  const dataRows = columnsOf(Customer).map((column) => ({
    Campo: CUSTOMER_LABELS[column] || column,
    Valor: plain[column] instanceof Date
      ? plain[column].toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
      : plain[column] ?? '',
  }));

  const buffer = buildWorkbookBuffer([
    { name: 'Datos del cliente', header: ['Campo', 'Valor'], data: dataRows },
    { name: 'Remitos', ...sheetFrom(Order, orders) },
    { name: 'Detalle de remitos', ...sheetFrom(OrderItem, items) },
  ]);

  console.log(`[derechos] acceso · comercio ${businessId} · cliente ${customer.id} · usuario ${req.user.id}`);

  res.setHeader('Content-Type', XLSX_MIME);
  res.setHeader('Content-Disposition', `attachment; filename="cliente-datos-${todayStamp()}.xlsx"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.send(buffer);
});

export const anonymizeCustomer = asyncHandler(async (req, res) => {
  const customer = await findCustomer(req);

  await customer.update({
    businessName: null,
    firstName: null,
    lastName: 'Cliente anonimizado',
    cuit: null,
    address: null,
    zipCode: null,
    city: null,
    province: null,
    phone: null,
    email: null,
  });

  console.log(`[derechos] supresión · comercio ${req.user.businessId} · cliente ${customer.id} · usuario ${req.user.id}`);

  res.json({ message: 'Los datos personales del cliente fueron anonimizados. Sus remitos se conservan.' });
});
