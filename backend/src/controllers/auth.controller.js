import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }

    const usersInBusiness = await User.count({
      where: { businessId: process.env.BUSINESS_ID_DEFAULT },
    });

    if (usersInBusiness > 0) {
      return res.status(403).json({
        message: 'Ya existe un administrador para este comercio. Pedile que te cree el usuario desde la pantalla de Usuarios.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // El primer usuario de un comercio siempre se crea como admin
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      businessId: process.env.BUSINESS_ID_DEFAULT,
    });

    const { passwordHash: _, ...userSafe } = user.toJSON();
    res.status(201).json(userSafe);
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.active) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, businessId: user.businessId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};