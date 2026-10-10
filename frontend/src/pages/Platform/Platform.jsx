import { useEffect, useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  getPlatformToken,
  clearPlatformToken,
  getBusinesses,
  createBusiness,
  setBusinessStatus,
  reinviteBusinessAdmin,
} from '../../api/platform.api';

const EMPTY_FORM = { name: '', adminName: '', adminEmail: '', type: 'client', trialDays: '' };

const formatDate = (value, withTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  return withTime
    ? date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
    : date.toLocaleDateString('es-AR');
};

const errorMessage = (err) => err.response?.data?.message || 'Ocurrió un error. Probá de nuevo.';

export default function Platform() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getBusinesses();
      setBusinesses(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getPlatformToken()) load();
  }, [load]);

  if (!getPlatformToken()) return <Navigate to="/plataforma/login" replace />;

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleLogout = () => {
    clearPlatformToken();
    navigate('/plataforma/login');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim(),
        type: form.type,
      };
      if (form.trialDays) payload.trialDays = Number(form.trialDays);

      const { data } = await createBusiness(payload);
      setInvite({
        title: `Link de activación para ${data.business.name}`,
        url: data.inviteUrl,
        expires: data.inviteExpiresAt,
      });
      setCopied(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (business) => {
    const next = business.status === 'active' ? 'suspended' : 'active';
    const message =
      next === 'suspended'
        ? `¿Suspender "${business.name}"? Sus usuarios no van a poder ingresar.`
        : `¿Reactivar "${business.name}"?`;
    if (!window.confirm(message)) return;

    setError('');
    try {
      await setBusinessStatus(business.id, next);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleReinvite = async (business) => {
    const admin = business.admins[0];
    if (!admin) return;
    const message =
      `Se anulará la contraseña actual de ${admin.email} y se generará un link nuevo ` +
      `para que elija una. Sus sesiones abiertas se cerrarán. ¿Continuar?`;
    if (!window.confirm(message)) return;

    setError('');
    try {
      const { data } = await reinviteBusinessAdmin(business.id, admin.id);
      setInvite({
        title: `Link nuevo para ${data.user.email} (${business.name})`,
        url: data.inviteUrl,
        expires: data.inviteExpiresAt,
      });
      setCopied(false);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopied(true);
    } catch {
      setError('No se pudo copiar automáticamente. Seleccioná el link y copialo a mano.');
    }
  };

  const whatsappUrl = invite
    ? `https://wa.me/?text=${encodeURIComponent(
        `Hola! Te invito a probar el sistema. Activá tu cuenta y elegí tu contraseña desde este link ` +
          `(vence el ${formatDate(invite.expires)}): ${invite.url}`
      )}`
    : '#';

  return (
    <div className="platform-page">
      <header className="platform-header">
        <h1>Plataforma · Comercios</h1>
        <button type="button" onClick={handleLogout}>Cerrar sesión</button>
      </header>

      {error && <p className="auth-error">{error}</p>}

      {invite && (
        <section className="invite-box">
          <strong>{invite.title}</strong>
          <span>
            Se muestra una sola vez: copialo ahora. Vence el {formatDate(invite.expires)}.
          </span>
          <input type="text" readOnly value={invite.url} onFocus={(e) => e.target.select()} />
          <div className="platform-actions">
            <button type="button" onClick={copyInvite}>{copied ? '¡Copiado!' : 'Copiar link'}</button>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">Compartir por WhatsApp</a>
            <button type="button" onClick={() => setInvite(null)}>Cerrar</button>
          </div>
        </section>
      )}

      <section>
        <h2>Nuevo comercio</h2>
        <form className="platform-form" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="pf-name">Nombre del comercio</label>
            <input id="pf-name" required value={form.name} onChange={setField('name')} />
          </div>
          <div className="field">
            <label htmlFor="pf-admin-name">Nombre del administrador</label>
            <input id="pf-admin-name" required value={form.adminName} onChange={setField('adminName')} />
          </div>
          <div className="field">
            <label htmlFor="pf-admin-email">Email del administrador</label>
            <input id="pf-admin-email" type="email" required value={form.adminEmail}
              onChange={setField('adminEmail')} />
          </div>
          <div className="field">
            <label htmlFor="pf-type">Tipo</label>
            <select id="pf-type" value={form.type} onChange={setField('type')}>
              <option value="client">Cliente / tester</option>
              <option value="demo">Demo</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="pf-trial">Días de prueba (opcional)</label>
            <input id="pf-trial" type="number" min="1" max="365" value={form.trialDays}
              onChange={setField('trialDays')} />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear y generar link'}
          </button>
        </form>
      </section>

      <section>
        <h2>Comercios ({businesses.length})</h2>
        {loading ? (
          <p>Cargando…</p>
        ) : (
          <div className="platform-table-wrap">
            <table className="platform-table">
              <thead>
                <tr>
                  <th>Comercio</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Administrador</th>
                  <th>Último ingreso</th>
                  <th>Alta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => {
                  const admin = business.admins[0];
                  const inviteExpired = admin?.inviteExpiresAt && new Date(admin.inviteExpiresAt) < new Date();
                  return (
                    <tr key={business.id}>
                      <td>
                        {business.name}
                        <br />
                        <small>{business.userCount} usuario(s)</small>
                      </td>
                      <td>{business.type === 'demo' ? 'Demo' : 'Cliente'}</td>
                      <td>
                        <span className={`platform-badge ${business.status === 'active' ? 'platform-badge-ok' : 'platform-badge-off'}`}>
                          {business.status === 'active' ? 'Activo' : 'Suspendido'}
                        </span>
                        {business.trialEndsAt && (
                          <>
                            <br />
                            <small>Prueba hasta {formatDate(business.trialEndsAt)}</small>
                          </>
                        )}
                      </td>
                      <td>
                        {admin ? (
                          <>
                            {admin.name}
                            <br />
                            <small>{admin.email}</small>
                            {admin.pendingActivation && (
                              <>
                                <br />
                                <span className="platform-badge platform-badge-warn">
                                  {inviteExpired ? 'Invitación vencida' : 'Pendiente de activar'}
                                </span>
                              </>
                            )}
                          </>
                        ) : '—'}
                      </td>
                      <td>{formatDate(admin?.lastLoginAt, true)}</td>
                      <td>{formatDate(business.createdAt)}</td>
                      <td>
                        <div className="platform-actions">
                          <button type="button" onClick={() => handleToggleStatus(business)}>
                            {business.status === 'active' ? 'Suspender' : 'Reactivar'}
                          </button>
                          {admin && (
                            <button type="button" onClick={() => handleReinvite(business)}>
                              Link nuevo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}