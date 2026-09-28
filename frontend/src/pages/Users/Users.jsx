import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResource } from '../../hooks/useResource.js';
import { useAuth } from '../../context/AuthContext.jsx';
import * as usersApi from '../../api/users.api.js';
import Spinner from '../../components/common/Spinner.jsx';

const api = {
  getAll: usersApi.getUsers,
  create: usersApi.createUser,
  update: usersApi.updateUser,
  remove: usersApi.deleteUser,
};

const ROLES = [
  { value: 'admin', label: 'Administrador (todo, incluye gestionar usuarios)' },
  { value: 'editor', label: 'Editor (todo, sin gestionar usuarios)' },
  { value: 'operador', label: 'Operador (solo Compras y Remitos)' },
];

const Users = () => {
  const { items: users, loading, create, update, remove } = useResource(api);
  const { user: currentUser } = useAuth();
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { role: 'operador' },
  });
  const editForm = useForm();

  const onCreate = async (formData) => {
    const result = await create({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
    if (result.success) reset({ role: 'operador' });
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      active: String(user.active),
      password: '',
    });
  };

  const onUpdate = async (formData) => {
    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      active: formData.active === 'true',
    };
    if (formData.password) {
      payload.password = formData.password;
    }
    const result = await update(editingId, payload);
    if (result.success) setEditingId(null);
  };

  const onDelete = (id) => {
    if (confirm('¿Eliminar este usuario? No va a poder volver a iniciar sesión.')) remove(id);
  };

  const roleLabel = (role) => ROLES.find((r) => r.value === role)?.label.split(' (')[0] || role;

  if (loading) return <Spinner label="Cargando usuarios..." />;

  return (
    <div className="users-page">
      <h1>Usuarios</h1>

      <form onSubmit={handleSubmit(onCreate)} className="user-form">
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            placeholder="Ej: María Gómez"
            {...register('name', { required: 'El nombre es obligatorio' })}
          />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Ej: maria@micomercio.com"
            {...register('email', { required: 'El email es obligatorio' })}
          />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            {...register('password', { required: 'La contraseña es obligatoria', minLength: 6 })}
          />
          {errors.password && <span className="error">La contraseña debe tener al menos 6 caracteres</span>}
        </div>

        <div className="field field-full">
          <label htmlFor="role">Rol</label>
          <select id="role" {...register('role', { required: true })}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <button type="submit">Agregar usuario</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
                <tr key={user.id}>
                  {editingId === user.id ? (
                    <td colSpan={5} className="edit-cell">
                      <form onSubmit={editForm.handleSubmit(onUpdate)} className="inline-edit-form">
                        <div className="field">
                          <label htmlFor={`edit-name-${user.id}`}>Nombre</label>
                          <input id={`edit-name-${user.id}`} {...editForm.register('name', { required: true })} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-email-${user.id}`}>Email</label>
                          <input id={`edit-email-${user.id}`} type="email" {...editForm.register('email', { required: true })} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-password-${user.id}`}>Nueva contraseña (opcional)</label>
                          <input
                            id={`edit-password-${user.id}`}
                            type="password"
                            placeholder="Dejar vacío para no cambiarla"
                            {...editForm.register('password', { minLength: 6 })}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-role-${user.id}`}>Rol</label>
                          <select id={`edit-role-${user.id}`} disabled={isSelf} {...editForm.register('role')}>
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-active-${user.id}`}>Estado</label>
                          <select id={`edit-active-${user.id}`} disabled={isSelf} {...editForm.register('active')}>
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        </div>
                        <div className="inline-edit-actions">
                          <button type="submit">Guardar</button>
                          <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                        </div>
                        {isSelf && (
                          <span className="error">No podés cambiar tu propio rol ni desactivarte.</span>
                        )}
                      </form>
                    </td>
                  ) : (
                    <>
                      <td data-label="Nombre">{user.name}{isSelf && ' (vos)'}</td>
                      <td data-label="Email">{user.email}</td>
                      <td data-label="Rol">{roleLabel(user.role)}</td>
                      <td data-label="Estado">{user.active ? 'Activo' : 'Inactivo'}</td>
                      <td data-label="Acciones">
                        <button onClick={() => startEdit(user)}>Editar</button>
                        {!isSelf && (
                          <button onClick={() => onDelete(user.id)}>Eliminar</button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;