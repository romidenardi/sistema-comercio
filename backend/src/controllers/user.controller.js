import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';

const ROLES = ['admin', 'editor', 'operador'];
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

const toSafeUser = (user) => {
  const { passwordHash, inviteTokenHash, inviteExpiresAt, ...safe } = user.toJSON();
  return safe;
};

const checkPassword = (password) => {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    throw httpError(`La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres`);
  }
};

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: { businessId: req.user.businessId },
    attributes: { exclude: ['passwordHash', 'inviteTokenHash', 'inviteExpiresAt'] },
    order: [['name', 'ASC']],
  });
  res.json(users);
});

export const createUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const { role } = req.body;

  if (!name || !email || !password) throw httpError('Nombre, email y contraseña son obligatorios');
  if (role && !ROLES.includes(role)) throw httpError('Rol inválido');
  checkPassword(password);

  const existing = await User.findOne({ where: { email } });
  if (existing) throw httpError('Ya existe un usuario con ese email');

  const user = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: role || 'operador',
    businessId: req.user.businessId,
  });

  res.status(201).json(toSafeUser(user));
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