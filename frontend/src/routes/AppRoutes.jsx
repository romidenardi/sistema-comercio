import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login/Login.jsx';
import Categories from '../pages/Categories/Categories.jsx';
import Payments from '../pages/Payments/Payments.jsx';
import Customers from '../pages/Customers/Customers.jsx';
import Products from '../pages/Products/Products.jsx';
import PrivateRoute from './PrivateRoute.jsx';
import Layout from '../components/layout/Layout.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<div>Bienvenida</div>} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/products" element={<Products />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;