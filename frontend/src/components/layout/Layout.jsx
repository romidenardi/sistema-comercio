import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const Layout = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      logout();
    }
  };

  return (
    <div className="app-layout">
      <nav className="navbar">
        <Link to="/">Inicio</Link>
        <Link to="/products">Productos</Link>
        <Link to="/categories">Categorías</Link>
        <Link to="/customers">Clientes</Link>
        <Link to="/payments">Formas de pago</Link>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;