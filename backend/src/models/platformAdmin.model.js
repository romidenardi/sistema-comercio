import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/database.js';

const PlatformAdmin = sequelize.define('PlatformAdmin', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: false, field: 'password_hash' },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'platform_admins',
});

export default PlatformAdmin;