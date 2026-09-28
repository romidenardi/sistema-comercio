import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

const ROLES = ['admin', 'editor', 'operador'];

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { businessId: req.user.businessId },
      attributes: { exclude: ['passwordHash'] },
      order: [['name', 'ASC']],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
    }

    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'operador',
      businessId: req.user.businessId,
    });

    const { passwordHash: _, ...userSafe } = user.toJSON();
    res.status(201).json(userSafe);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear el usuario', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, businessId: req.user.businessId },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const { name, email, role, active, password } = req.body;

    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    if (user.id === req.user.id && role && role !== 'admin') {
      return res.status(400).json({ message: 'No podés quitarte tu propio rol de administrador' });
    }

    if (user.id === req.user.id && active === false) {
      return res.status(400).json({ message: 'No podés desactivar tu propio usuario' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (active !== undefined) user.active = active;
    if (password) user.passwordHash = await bcrypt.hash(password, 10);

    await user.save();

    const { passwordHash: _, ...userSafe } = user.toJSON();
    res.json(userSafe);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el usuario', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, businessId: req.user.businessId },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'No podés eliminar tu propio usuario' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.count({
        where: { businessId: req.user.businessId, role: 'admin', active: true },
      });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'No podés eliminar al único administrador del comercio' });
      }
    }

    await user.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: 'Error al eliminar el usuario', error: error.message });
  }
};