import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Business, User, PlatformAdmin, sequelize } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { httpError } from '../utils/httpError.js';
import { generateInviteToken, INVITE_TTL_MS } from '../utils/inviteToken.js';
import { resetDemoBusiness } from '../services/demo.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const buildInviteUrl = (token) =>
  `${process.env.APP_URL.replace(/\/$/, '')}/activar?token=${token}`;

export const platformLogin = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const admin = email ? await PlatformAdmin.findOne({ where: { email } }) : null;
  const valid = admin && admin.active && (await bcrypt.compare(password, admin.passwordHash));
  if (!valid) throw httpError('Credenciales inválidas', 401);

  const token = jwt.sign(
    { adminId: admin.id, scope: 'platform' },
    process.env.PLATFORM_JWT_SECRET,
    { expiresIn: '2h' }
  );
  res.json({ token, admin: { id: admin.id, name: admin.name } });
});

// Solo metadatos de cuentas: nunca productos, clientes, remitos ni contraseñas
export const listBusinesses = asyncHandler(async (req, res) => {
  const businesses = await Business.findAll({
    attributes: ['id', 'name', 'status', 'type', 'trialEndsAt', 'contactEmail', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });

  const users = await User.findAll({
    attributes: ['id', 'businessId', 'name', 'email', 'role', 'active', 'lastLoginAt', 'passwordHash', 'inviteExpiresAt'],
  });

  const result = businesses.map((business) => {
    const members = users.filter((u) => u.businessId === business.id);
    return {
      ...business.toJSON(),
      userCount: members.length,
      admins: members
        .filter((u) => u.role === 'admin')
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          active: u.active,
          lastLoginAt: u.lastLoginAt,
          pendingActivation: !u.passwordHash,
          inviteExpiresAt: u.passwordHash ? null : u.inviteExpiresAt,
        })),
    };
  });

  res.json(result);
});

export const createBusiness = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const adminName = String(req.body.adminName || '').trim();
  const adminEmail = String(req.body.adminEmail || '').trim().toLowerCase();
  const type = req.body.type === 'demo' ? 'demo' : 'client';

  if (!name || !adminName || !adminEmail) {
    throw httpError('Nombre del comercio, nombre del administrador y email son obligatorios');
  }
  if (!EMAIL_REGEX.test(adminEmail)) throw httpError('El email no es válido');

  let trialEndsAt = null;
  if (req.body.trialDays !== undefined && req.body.trialDays !== null && req.body.trialDays !== '') {
    const days = Number(req.body.trialDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      throw httpError('Los días de prueba deben ser un entero entre 1 y 365');
    }
    trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  const existing = await User.findOne({ where: { email: adminEmail } });
  if (existing) throw httpError('Ya existe un usuario con ese email', 409);

  const { token, hash } = generateInviteToken();
  const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const t = await sequelize.transaction();
  let business;
  try {
    business = await Business.create(
      { name, type, trialEndsAt, contactEmail: adminEmail },
      { transaction: t }
    );
    await User.create({
      name: adminName,
      email: adminEmail,
      role: 'admin',
      passwordHash: null,
      inviteTokenHash: hash,
      inviteExpiresAt,
      businessId: business.id,
    }, { transaction: t });
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }

  // Una demo nace con sus datos de ejemplo. Si eso fallara, el link igual se
  // devuelve (se muestra una sola vez) y se avisa para usar "Reiniciar demo".
  let demoSeeded = null;
  if (type === 'demo') {
    try {
      await resetDemoBusiness(business.id);
      demoSeeded = true;
    } catch (error) {
      console.error('[demo] No se pudieron cargar los datos de ejemplo:', error);
      demoSeeded = false;
    }
  }

  // El link se muestra una única vez; en la base solo queda su hash
  res.status(201).json({
    business: { id: business.id, name: business.name, type: business.type, status: business.status },
    inviteUrl: buildInviteUrl(token),
    inviteExpiresAt,
    demoSeeded,
  });
});

export const setBusinessStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) throw httpError('Estado inválido');

  const business = await Business.findByPk(req.params.id);
  if (!business) throw httpError('Comercio no encontrado', 404);

  await business.update({ status });
  res.json({ id: business.id, name: business.name, status: business.status });
});

// Cubre "olvidé mi contraseña": invalida la clave actual y genera un link nuevo
export const reinviteUser = asyncHandler(async (req, res) => {
  const business = await Business.findByPk(req.params.id);
  if (!business) throw httpError('Comercio no encontrado', 404);

  const where = req.body.userId
    ? { id: req.body.userId, businessId: business.id }
    : { businessId: business.id, role: 'admin' };
  const user = await User.findOne({ where, order: [['createdAt', 'ASC']] });
  if (!user) throw httpError('Usuario no encontrado', 404);

  const { token, hash } = generateInviteToken();
  const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await user.update({ passwordHash: null, inviteTokenHash: hash, inviteExpiresAt, active: true });

  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    inviteUrl: buildInviteUrl(token),
    inviteExpiresAt,
  });
});

export const resetDemo = asyncHandler(async (req, res) => {
  await resetDemoBusiness(req.params.id);
  res.json({ message: 'Demo reiniciada' });
});