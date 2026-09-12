import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
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
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'category_id',
  },
  internalCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'internal_code',
  },
  barcode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  unitType: {
    type: DataTypes.ENUM('unit', 'weight'),
    allowNull: false,
    defaultValue: 'unit',
    field: 'unit_type',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  promoPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'promo_price',
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fiscalActivity: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'fiscal_activity',
  },
  vatRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 21.00,
    field: 'vat_rate',
  },
  otherTaxes: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'other_taxes',
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'products',
});

export default Product; 