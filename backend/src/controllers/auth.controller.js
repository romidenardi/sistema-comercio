import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Business } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { hashToken } from '../utils/inviteToken.js';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // límite de bcrypt

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) throw httpError('Email y contraseña son obligatorios');

  const user = await User.findOne({
    where: { email },
    include: [{ model: Business, attributes: ['id', 'status'] }],
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
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// El cliente elige su contraseña con el link que le mandó el superadmin
export const activateAccount = asyncHandler(async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');

  if (!token) throw httpError('Link de activación inválido');
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw httpError(`La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres`);
  }

  const user = await User.findOne({ where: { inviteTokenHash: hashToken(token) } });
  if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < new Date()) {
    throw httpError('El link de activación es inválido o venció. Pedí uno nuevo.');
  }

  user.passwordHash = await bcrypt.hash(password, 10);
  user.inviteTokenHash = null;
  user.inviteExpiresAt = null;
  await user.save();

  res.json({ message: 'Contraseña creada. Ya podés iniciar sesión.' });
});