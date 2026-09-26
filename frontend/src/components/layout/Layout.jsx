import { Outlet, NavLink } from 'react-router-dom';
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
      <aside className="sidebar">
        <div className="sidebar-brand">Sistema comercio</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>Inicio</NavLink>
          <NavLink to="/products">Productos</NavLink>
          <NavLink to="/categories">Categorías</NavLink>
          <NavLink to="/payments">Formas de pago</NavLink>
          <NavLink to="/customers">Clientes</NavLink>
          <NavLink to="/orders">Remitos</NavLink>
          <NavLink to="/suppliers">Proveedores</NavLink>
          <NavLink to="/purchases">Compras</NavLink>          
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>Cerrar sesión</button>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;