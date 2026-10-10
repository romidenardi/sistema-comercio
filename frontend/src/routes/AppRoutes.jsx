import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login/Login.jsx';
import Activate from '../pages/Activate/Activate.jsx';
import Categories from '../pages/Categories/Categories.jsx';
import Payments from '../pages/Payments/Payments.jsx';
import Customers from '../pages/Customers/Customers.jsx';
import Products from '../pages/Products/Products.jsx';
import Suppliers from '../pages/Suppliers/Suppliers.jsx';
import Purchases from '../pages/Purchases/Purchases.jsx';
import Orders from '../pages/Orders/Orders.jsx';
import OrderPrint from '../pages/Orders/OrderPrint.jsx';
import Imports from '../pages/Imports/Imports.jsx';
import Users from '../pages/Users/Users.jsx';
import NotFound from '../pages/NotFound/NotFound.jsx';
import PrivateRoute from './PrivateRoute.jsx';
import Layout from '../components/layout/Layout.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/activar" element={<Activate />} />

      <Route element={<PrivateRoute />}>
        <Route path="/orders/:id/print" element={<OrderPrint />} />

        <Route element={<Layout />}>
          <Route path="/" element={<div>Bienvenida</div>} />

          <Route path="/orders" element={<Orders />} />
          <Route path="/purchases" element={<Purchases />} />

          <Route element={<PrivateRoute allowedRoles={['admin', 'editor']} />}>
            <Route path="/categories" element={<Categories />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/imports" element={<Imports />} />
          </Route>

          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;