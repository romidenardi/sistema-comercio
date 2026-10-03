import sequelize from '../config/database.js';
import Business from './business.model.js';
import Category from './category.model.js';
import Product from './product.model.js';
import StockMovement from './stockMovement.model.js';
import Payment from './payment.model.js';
import InstallmentPlan from './installmentPlan.model.js';
import User from './user.model.js';
import Customer from './customer.model.js';
import Supplier from './supplier.model.js';
import Purchase from './purchase.model.js';
import PurchaseItem from './purchaseItem.model.js';
import Order from './order.model.js';
import OrderItem from './orderItem.model.js';

Business.hasMany(Category, { foreignKey: 'businessId' });
Category.belongsTo(Business, { foreignKey: 'businessId' });

Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parentId' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });

Business.hasMany(Product, { foreignKey: 'businessId' });
Product.belongsTo(Business, { foreignKey: 'businessId' });

Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

Product.hasMany(StockMovement, { foreignKey: 'productId' });
StockMovement.belongsTo(Product, { foreignKey: 'productId' });

Business.hasMany(Payment, { foreignKey: 'businessId' });
Payment.belongsTo(Business, { foreignKey: 'businessId' });

Payment.hasMany(InstallmentPlan, { as: 'installmentPlans', foreignKey: 'paymentId' });
InstallmentPlan.belongsTo(Payment, { foreignKey: 'paymentId' });

Business.hasMany(User, { foreignKey: 'businessId' });
User.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Customer, { foreignKey: 'businessId' });
Customer.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Supplier, { foreignKey: 'businessId' });
Supplier.belongsTo(Business, { foreignKey: 'businessId' });

Business.hasMany(Purchase, { foreignKey: 'businessId' });
Purchase.belongsTo(Business, { foreignKey: 'businessId' });

Supplier.hasMany(Purchase, { foreignKey: 'supplierId' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplierId' });

Purchase.hasMany(PurchaseItem, { as: 'items', foreignKey: 'purchaseId' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId' });

Product.hasMany(PurchaseItem, { foreignKey: 'productId' });
PurchaseItem.belongsTo(Product, { foreignKey: 'productId' });

Business.hasMany(Order, { foreignKey: 'businessId' });
Order.belongsTo(Business, { foreignKey: 'businessId' });

Customer.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });

Payment.hasMany(Order, { foreignKey: 'paymentId' });
Order.belongsTo(Payment, { foreignKey: 'paymentId' });

InstallmentPlan.hasMany(Order, { foreignKey: 'installmentPlanId' });
Order.belongsTo(InstallmentPlan, { foreignKey: 'installmentPlanId' });

Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

export {
  sequelize, Business, Category, Product, StockMovement, Payment, InstallmentPlan,
  User, Customer, Supplier, Purchase, PurchaseItem, Order, OrderItem,
};