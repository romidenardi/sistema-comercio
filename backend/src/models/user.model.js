import pkg from 'sequelize';
const { DataTypes } = pkg;
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  businessId: { type: DataTypes.UUID, allowNull: false, field: 'business_id' },
  name: { type: DataTypes.STRING, allowNull: false },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  // null mientras la cuenta espera ser activada con el link de invitación
  passwordHash: { type: DataTypes.STRING, allowNull: true, field: 'password_hash' },
  inviteTokenHash: { type: DataTypes.STRING(64), allowNull: true, field: 'invite_token_hash' },
  inviteExpiresAt: { type: DataTypes.DATE, allowNull: true, field: 'invite_expires_at' },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: 'last_login_at' },
  // Aceptación de términos y privacidad (evidencia)
  termsVersion: { type: DataTypes.STRING(40), allowNull: true, field: 'terms_version' },
  termsAcceptedAt: { type: DataTypes.DATE, allowNull: true, field: 'terms_accepted_at' },
  termsAcceptedIp: { type: DataTypes.STRING(64), allowNull: true, field: 'terms_accepted_ip' },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'operador'),
    allowNull: false,
    defaultValue: 'operador',
  },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'users',
});

export default User;