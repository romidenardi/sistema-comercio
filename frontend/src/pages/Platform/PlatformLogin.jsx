import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { platformLogin, getPlatformToken, setPlatformToken } from '../../api/platform.api';

export default function PlatformLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (getPlatformToken()) return <Navigate to="/plataforma" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await platformLogin({ email, password });
      setPlatformToken(data.token);
      navigate('/plataforma');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Administración de la plataforma</h1>
        <div className="field">
          <label htmlFor="platform-email">Email</label>
          <input id="platform-email" type="email" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="platform-password">Contraseña</label>
          <input id="platform-password" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </div>
  );
}