import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login/Login.jsx';
import PrivateRoute from './PrivateRoute.jsx';
import Layout from '../components/layout/Layout.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<div>Bienvenida</div>} />
          {/* acá van a colgar Products, Categories, Customers, Payments */}
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;