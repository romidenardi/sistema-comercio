import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const ROLE_LABELS = {
  admin: 'Administrador',
  editor: 'Editor',
  operador: 'Operador',
};

const Layout = () => {
  const { logout, role, user, isDemo } = useAuth();

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

        {user && (
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-role">{ROLE_LABELS[role] || role}</span>
          </div>
        )}

        <nav className="sidebar-nav">
          <NavLink to="/" end>Inicio</NavLink>
          {canManageData && <NavLink to="/products">Productos</NavLink>}
          {canManageData && <NavLink to="/categories">Categorías</NavLink>}
          {canManageData && <NavLink to="/payments">Formas de pago</NavLink>}
          {canManageData && <NavLink to="/customers">Clientes</NavLink>}
          <NavLink to="/orders">Remitos</NavLink>
          {canManageData && <NavLink to="/suppliers">Proveedores</NavLink>}
          <NavLink to="/purchases">Compras</NavLink>
          {canManageData && !isDemo && <NavLink to="/imports">Importar</NavLink>}
          {isAdmin && !isDemo && <NavLink to="/users">Usuarios</NavLink>}
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>Cerrar sesión</button>
      </aside>
      <main className="app-main">
        {isDemo && (
          <div className="demo-banner" role="status">
            <strong>Cuenta de demostración.</strong> No cargues datos reales: los pueden ver otros
            visitantes y todo se reinicia cada noche.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;