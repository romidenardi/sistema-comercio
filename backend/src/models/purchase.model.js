import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/database.js';

const Purchase = sequelize.define('Purchase', {
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
  supplierId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'supplier_id',
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'invoice_number',
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'purchases',
});

export default Purchase;