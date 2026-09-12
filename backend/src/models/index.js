import sequelize from '../config/database.js';
import Business from './business.model.js';
import Category from './category.model.js';

// Business → Categories
Business.hasMany(Category, { foreignKey: 'businessId' });
Category.belongsTo(Business, { foreignKey: 'businessId' });

// Category → Subcategories (autorreferencia)
Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parentId' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });

export { sequelize, Business, Category };