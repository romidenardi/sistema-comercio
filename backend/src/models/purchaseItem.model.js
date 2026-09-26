import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/database.js';

const PurchaseItem = sequelize.define('PurchaseItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  purchaseId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'purchase_id',
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_cost',
  },
}, {
  tableName: 'purchase_items',
});

export default PurchaseItem;