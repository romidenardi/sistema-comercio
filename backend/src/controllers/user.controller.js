import bcrypt from 'bcryptjs';
import { User, Business } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { sendMail, appUrl } from '../utils/mailer.js';
import { userCreatedEmail } from '../utils/mailTemplates.js';
import { issueAccessLink } from '../utils/accessLinks.js';

const ROLES = ['admin', 'editor', 'operador'];
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toSafeUser = (user) => {
  const { passwordHash, inviteTokenHash, inviteExpiresAt, ...safe } = user.toJSON();
  return { ...safe, pendingActivation: !passwordHash };
};

const checkPassword = (password) => {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw httpError(`La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres`);
  }
};

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: { businessId: req.user.businessId },
    attributes: { exclude: ['inviteTokenHash', 'inviteExpiresAt'] },
    order: [['name', 'ASC']],
  });
  res.json(users.map(toSafeUser));
});

export const createUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const sendInvite = req.body.sendInvite === true;
  const { role } = req.body;

  if (!name || !email) throw httpError('Nombre y email son obligatorios');
  if (!EMAIL_REGEX.test(email)) throw httpError('El email no es válido');
  if (role && !ROLES.includes(role)) throw httpError('Rol inválido');

  if (!sendInvite) {
    if (!password) throw httpError('La contraseña es obligatoria');
    checkPassword(password);
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) throw httpError('Ya existe un usuario con ese email');

  const user = await User.create({
    name,
    email,
    passwordHash: sendInvite ? null : await bcrypt.hash(password, 10),
    role: role || 'operador',
    businessId: req.user.businessId,
  });

  const business = await Business.findByPk(req.user.businessId, { attributes: ['name'] });
  const businessName = business?.name || 'tu comercio';

  let mail;
  if (sendInvite) {
    const result = await issueAccessLink(user, businessName);
    mail = {
      type: 'invite',
      sent: result.emailSent,
      link: result.emailSent ? undefined : result.link,
    };
  } else {
    const creator = await User.findByPk(req.user.id, { attributes: ['name'] });
    const result = await sendMail({
      to: user.email,
      ...userCreatedEmail({
        name: user.name,
        businessName,
        role: user.role,
        creatorName: creator?.name,
        loginUrl: appUrl('/login'),
      }),
    });
    mail = { type: 'created', sent: result.sent };
  }

  res.status(201).json({ ...toSafeUser(user), mail });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: { id: req.params.id, businessId: req.user.businessId },
  });
  if (!user) throw httpError('Usuario no encontrado', 404);

  const { name, role, active, password } = req.body;
  const email = req.body.email !== undefined ? String(req.body.email).trim().toLowerCase() : undefined;

  if (role && !ROLES.includes(role)) throw httpError('Rol inválido');
  if (user.id === req.user.id && role && role !== 'admin') {
    throw httpError('No podés quitarte tu propio rol de administrador');
  }
  if (user.id === req.user.id && active === false) {
    throw httpError('No podés desactivar tu propio usuario');
  }

  if (email !== undefined && email !== user.email) {
    const taken = await User.findOne({ where: { email } });
    if (taken) throw httpError('Ya existe un usuario con ese email');
    user.email = email;
  }

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;
  if (password) {
    checkPassword(String(password));
    user.passwordHash = await bcrypt.hash(String(password), 10);
    user.inviteTokenHash = null;
    user.inviteExpiresAt = null;
  }

  await user.save();
  res.json(toSafeUser(user));
});

export const sendAccessLink = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: { id: req.params.id, businessId: req.user.businessId },
  });
  if (!user) throw httpError('Usuario no encontrado', 404);
  if (!user.active) throw httpError('El usuario está inactivo. Activalo antes de enviarle un link.');

  const business = await Business.findByPk(req.user.businessId, { attributes: ['name'] });
  const result = await issueAccessLink(user, business?.name || 'tu comercio');

  res.json({
    email: user.email,
    mail: {
      type: result.type,
      sent: result.emailSent,
      link: result.emailSent ? undefined : result.link,
    },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: { id: req.params.id, businessId: req.user.businessId },
  });
  if (!user) throw httpError('Usuario no encontrado', 404);

  if (user.id === req.user.id) throw httpError('No podés eliminar tu propio usuario');

  if (user.role === 'admin') {
    const adminCount = await User.count({
      where: { businessId: req.user.businessId, role: 'admin', active: true },
    });
    if (adminCount <= 1) throw httpError('No podés eliminar al único administrador del comercio');
  }

  await user.destroy();
  res.status(204).send();
});