import sequelize from '../config/database.js';
import Business from './business.model.js';
import Category from './category.model.js';
import Product from './product.model.js';
import StockMovement from './stockMovement.model.js';

Business.hasMany(Category, { foreignKey: 'businessId' });
Category.belongsTo(Business, { foreignKey: 'businessId' });

Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parentId' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });

Business.hasMany(Product, { foreignKey: 'businessId' });
Product.belongsTo(Business, { foreignKey: 'businessId' });

Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

// Product → StockMovements
Product.hasMany(StockMovement, { foreignKey: 'productId' });
StockMovement.belongsTo(Product, { foreignKey: 'productId' });

export { sequelize, Business, Category, Product, StockMovement };