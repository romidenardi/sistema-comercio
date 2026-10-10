import jwt from 'jsonwebtoken';
import { PlatformAdmin } from '../models/index.js';

export const platformAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], process.env.PLATFORM_JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  if (decoded.scope !== 'platform' || !decoded.adminId) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  try {
    const admin = await PlatformAdmin.findOne({
      where: { id: decoded.adminId, active: true },
      attributes: ['id'],
    });
    if (!admin) return res.status(401).json({ message: 'Sesión inválida' });
    req.platformAdmin = { id: admin.id };
    next();
  } catch (error) {
    next(error);
  }
};