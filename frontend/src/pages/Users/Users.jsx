import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResource } from '../../hooks/useResource.js';
import { useAuth } from '../../context/AuthContext.jsx';
import * as usersApi from '../../api/users.api.js';
import Spinner from '../../components/common/Spinner.jsx';
import { validatePassword, validateOptionalPassword } from '../../utils/password.js';
import { RequiredMark, RequiredLegend } from '../../components/common/Required.jsx';

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

const DEFAULT_CREATE = { role: 'operador', mode: 'password' };

const buildNotice = (mail, email, prefix) => {
  if (mail?.sent) {
    return { type: 'ok', text: `${prefix} Enviamos el mail a ${email}.` };
  }
  if (mail?.link) {
    return {
      type: 'warn',
      text: `${prefix} No pudimos enviar el mail a ${email}. Copiá este link y pasáselo por otro medio:`,
      link: mail.link,
    };
  }
  return {
    type: 'warn',
    text: `${prefix} No se pudo enviar el aviso por mail a ${email}.`,
  };
};

const Notice = ({ notice, onClose }) => {
  if (!notice) return null;
  return (
    <div className={`users-notice users-notice-${notice.type}`} role="status">
      <p>{notice.text}</p>
      {notice.link && (
        <input
          readOnly
          value={notice.link}
          onFocus={(e) => e.target.select()}
          aria-label="Link para copiar"
        />
      )}
      <button type="button" onClick={onClose}>Cerrar</button>
    </div>
  );
};

const UsersContent = ({ notice, setNotice, reload }) => {
  const { items: users, loading, update, remove } = useResource(api);
  const { user: currentUser } = useAuth();
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: DEFAULT_CREATE,
  });
  const editForm = useForm();
  const mode = watch('mode');

  const onCreate = async (formData) => {
    setNotice(null);
    const invite = formData.mode === 'invite';
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        ...(invite ? { sendInvite: true } : { password: formData.password }),
      };
      const { data } = await usersApi.createUser(payload);
      reset(DEFAULT_CREATE);
      setNotice(buildNotice(data.mail, formData.email, 'Usuario creado.'));
      reload();
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo crear el usuario',
      });
    }
  };

  const onSendLink = async (user) => {
    const message = user.pendingActivation
      ? `¿Reenviar la invitación a ${user.email}?`
      : `¿Enviar a ${user.email} un link para que elija una contraseña nueva?`;
    if (!confirm(message)) return;

    setNotice(null);
    try {
      const { data } = await usersApi.sendAccessLink(user.id);
      setNotice(buildNotice(data.mail, data.email, 'Listo.'));
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo generar el link',
      });
    }
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
    if (confirm('¿Eliminar este usuario? La acción no se puede deshacer.')) remove(id);
  };

  const roleLabel = (role) => ROLES.find((r) => r.value === role)?.label.split(' (')[0] || role;

  if (loading) return <Spinner label="Cargando usuarios..." />;

  return (
    <div className="users-page">
      <h1>Usuarios</h1>

      <Notice notice={notice} onClose={() => setNotice(null)} />

      <form onSubmit={handleSubmit(onCreate)} className="user-form">
        <div className="field">
          <label htmlFor="name">Nombre<RequiredMark /></label>
          <input
            id="name"
            placeholder="Ej: María Gómez"
            {...register('name', { required: 'El nombre es obligatorio' })}
          />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">Email<RequiredMark /></label>
          <input
            id="email"
            type="email"
            placeholder="Ej: maria@micomercio.com"
            {...register('email', { required: 'El email es obligatorio' })}
          />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="field field-full">
          <label htmlFor="role">Rol<RequiredMark /></label>
          <select id="role" {...register('role', { required: true })}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="field field-full">
          <label htmlFor="mode">¿Cómo va a ingresar?</label>
          <select id="mode" {...register('mode')}>
            <option value="password">Yo le asigno una contraseña</option>
            <option value="invite">Enviarle una invitación por email para que elija la suya</option>
          </select>
        </div>

        {mode === 'password' && (
          <div className="field">
            <label htmlFor="password">Contraseña<RequiredMark /></label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              {...register('password', {
                required: 'La contraseña es obligatoria',
                validate: validatePassword,
              })}
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>
        )}

        <button type="submit">
          {mode === 'invite' ? 'Crear y enviar invitación' : 'Agregar usuario'}
        </button>
        <RequiredLegend />
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
              const statusLabel = !user.active
                ? 'Inactivo'
                : user.pendingActivation
                  ? 'Pendiente de activación'
                  : 'Activo';
              return (
                <tr key={user.id}>
                  {editingId === user.id ? (
                    <td colSpan={5} className="edit-cell">
                      <form onSubmit={editForm.handleSubmit(onUpdate)} className="inline-edit-form">
                        <div className="field">
                          <label htmlFor={`edit-name-${user.id}`}>Nombre<RequiredMark /></label>
                          <input id={`edit-name-${user.id}`} {...editForm.register('name', { required: true })} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-email-${user.id}`}>Email<RequiredMark /></label>
                          <input id={`edit-email-${user.id}`} type="email" {...editForm.register('email', { required: true })} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-password-${user.id}`}>Nueva contraseña (opcional)</label>
                          <input
                            id={`edit-password-${user.id}`}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Dejar vacío para no cambiarla"
                            {...editForm.register('password', { validate: validateOptionalPassword })}
                          />
                          {editForm.formState.errors.password && (
                            <span className="error">{editForm.formState.errors.password.message}</span>
                          )}
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
                        <RequiredLegend />
                      </form>
                    </td>
                  ) : (
                    <>
                      <td data-label="Nombre">{user.name}{isSelf && ' (vos)'}</td>
                      <td data-label="Email">{user.email}</td>
                      <td data-label="Rol">{roleLabel(user.role)}</td>
                      <td data-label="Estado">{statusLabel}</td>
                      <td data-label="Acciones">
                        <button onClick={() => startEdit(user)}>Editar</button>
                        {user.active && (
                          <button onClick={() => onSendLink(user)}>
                            {user.pendingActivation ? 'Reenviar invitación' : 'Enviar link de contraseña'}
                          </button>
                        )}
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

const Users = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState(null);

  return (
    <UsersContent
      key={reloadKey}
      notice={notice}
      setNotice={setNotice}
      reload={() => setReloadKey((k) => k + 1)}
    />
  );
};

export default Users;