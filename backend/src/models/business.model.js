import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/database.js';

const Business = sequelize.define('Business', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cuit: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'businesses',
});

export default Business;