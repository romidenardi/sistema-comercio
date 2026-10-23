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
  // Identificador del envío desde el frontend, para no crear dos veces el mismo (ver utils/requestId.js)
  requestId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'request_id',
  },
}, {
  tableName: 'purchases',
  indexes: [
    { unique: true, fields: ['business_id', 'request_id'], name: 'uq_purchases_business_request' },
  ],
});

export default Purchase;