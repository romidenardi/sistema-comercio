import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  businessId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'business_id',
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'payment_id',
  },
  installmentPlanId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'installment_plan_id',
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  grossTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true, // suma de los ítems antes de aplicar descuentos
    field: 'gross_total',
  },
  discountPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'discount_percent',
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'discount_amount', // descuento fijo tipo bono
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0, // total final, ya con descuentos aplicados
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true, // solo tiene valor cuando discriminatesVat es true
  },
  vatAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'vat_amount',
  },
  discriminatesVat: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'discriminates_vat',
  },
  installmentsCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'installments_count',
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'interest_rate',
  },
  installmentAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'installment_amount',
  },
  totalFinanced: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'total_financed',
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'orders',
});

export default Order;