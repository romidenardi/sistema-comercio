import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Business } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { hashToken } from '../utils/inviteToken.js';
import { LEGAL_VERSION } from '../utils/legal.js';
import { issueAccessLink, wasIssuedRecently } from '../utils/accessLinks.js';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // límite de bcrypt
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const checkPassword = (password) => {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw httpError(`La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres`);
  }
};

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) throw httpError('Email y contraseña son obligatorios');

  const user = await User.findOne({
    where: { email },
    include: [{ model: Business, attributes: ['id', 'status', 'type'] }],
  });

  const valid =
    user && user.active && user.passwordHash && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) throw httpError('Credenciales inválidas', 401);

  if (user.Business.status !== 'active') {
    throw httpError('El acceso de este comercio está suspendido. Contactanos para reactivarlo.', 403);
  }

  await user.update({ lastLoginAt: new Date() });

  const token = jwt.sign(
    { id: user.id, businessId: user.businessId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      businessType: user.Business.type,
    },
  });
});

export const activateAccount = asyncHandler(async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');

  if (!token) throw httpError('Link de activación inválido');
  checkPassword(password);

  if (req.body.acceptTerms !== true) {
    throw httpError('Tenés que aceptar los Términos y Condiciones y el Aviso de Privacidad para continuar');
  }
  if (req.body.legalVersion !== LEGAL_VERSION) {
    throw httpError('Los términos se actualizaron. Recargá la página e intentá de nuevo.');
  }

  const user = await User.findOne({ where: { inviteTokenHash: hashToken(token) } });
  if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
    throw httpError('El link de activación es inválido o venció. Solicitá uno nuevo.');
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.inviteTokenHash = null;
  user.inviteExpiresAt = null;
  user.termsVersion = LEGAL_VERSION;
  user.termsAcceptedAt = new Date();
  user.termsAcceptedIp = String(req.ip || '').slice(0, 64);
  await user.save();

  res.json({ message: 'Contraseña creada. Ya podés iniciar sesión.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const generic = {
    message: 'Si el email corresponde a una cuenta activa, te enviamos un link para continuar.',
  };

  if (!EMAIL_REGEX.test(email)) return res.json(generic);

  const user = await User.findOne({
    where: { email },
    include: [{ model: Business, attributes: ['id', 'name', 'status', 'type'] }],
  });

  res.json(generic);

  if (!user || !user.active || !user.Business) return;
  if (user.Business.status !== 'active' || user.Business.type === 'demo') return;
  if (wasIssuedRecently(user, 60)) return;

  issueAccessLink(user, user.Business.name).catch((error) => {
    console.error('[auth] No se pudo generar el link de acceso:', error.message);
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');

  if (!token) throw httpError('Link inválido');
  checkPassword(password);

  const user = await User.findOne({ where: { inviteTokenHash: hashToken(token) } });
  if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
    throw httpError('El link es inválido o venció. Pedí uno nuevo.');
  }
  if (!user.active) throw httpError('El usuario está inactivo. Contactá al administrador.', 403);

  if (!user.passwordHash) {
    throw httpError('Esta cuenta todavía no está activada. Usá el link de invitación que te enviamos.');
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.inviteTokenHash = null;
  user.inviteExpiresAt = null;
  await user.save();

  res.json({ message: 'Contraseña actualizada. Ya podés iniciar sesión.' });
});