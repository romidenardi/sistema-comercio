import jwt from 'jsonwebtoken';
import pkg from 'sequelize';
import { User, Business } from '../models/index.js';

const { Op } = pkg;

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  if (!decoded.id || !decoded.businessId) {
    return res.status(401).json({ message: 'Token inválido' });
  }

  try {
    const user = await User.findOne({
      where: {
        id: decoded.id,
        businessId: decoded.businessId,
        active: true,
        passwordHash: { [Op.ne]: null },
      },
      attributes: ['id', 'businessId', 'role'],
      include: [{ model: Business, attributes: ['status', 'type'] }],
    });

    if (!user || user.Business.status !== 'active') {
      return res.status(401).json({ message: 'Sesión inválida' });
    }

    req.user = {
      id: user.id,
      businessId: user.businessId,
      role: user.role,
      businessType: user.Business.type,
    };
    next();
  } catch (error) {
    next(error);
  }
};