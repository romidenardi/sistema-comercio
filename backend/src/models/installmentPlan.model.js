import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/database.js';

const InstallmentPlan = sequelize.define('InstallmentPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  paymentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'payment_id',
  },
  installments: {
    type: DataTypes.INTEGER,
    allowNull: false, // cantidad de cuotas, ej: 3, 6, 12
  },
  interestRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'interest_rate', // porcentaje de interés, ej: 15.5
  },
    active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'installment_plans',
});

export default InstallmentPlan;