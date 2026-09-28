import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const Layout = () => {
  const { logout, role } = useAuth();

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      logout();
    }
  };

  const canManageData = role === 'admin' || role === 'editor';
  const isAdmin = role === 'admin';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Sistema comercio</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>Inicio</NavLink>
          {canManageData && <NavLink to="/products">Productos</NavLink>}
          {canManageData && <NavLink to="/categories">Categorías</NavLink>}
          {canManageData && <NavLink to="/payments">Formas de pago</NavLink>}
          {canManageData && <NavLink to="/customers">Clientes</NavLink>}
          <NavLink to="/orders">Remitos</NavLink>
          {canManageData && <NavLink to="/suppliers">Proveedores</NavLink>}
          <NavLink to="/purchases">Compras</NavLink>
          {canManageData && <NavLink to="/imports">Importar</NavLink>}
          {isAdmin && <NavLink to="/users">Usuarios</NavLink>}
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