import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext.jsx';

export const useResource = (api) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getAll();
      setItems(data);
    } catch (err) {
      showToast('No se pudo cargar la información', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (payload) => {
    try {
      await api.create(payload);
      await load();
      showToast('Creado correctamente');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Error al crear';
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  const update = async (id, payload) => {
    try {
      await api.update(id, payload);
      await load();
      showToast('Actualizado correctamente');
      return { success: true };
    } catch (err) {
      showToast('Error al actualizar', 'error');
      return { success: false };
    }
  };

  const remove = async (id) => {
    try {
      await api.remove(id);
      await load();
      showToast('Eliminado correctamente');
      return { success: true };
    } catch (err) {
      showToast('Error al eliminar', 'error');
      return { success: false };
    }
  };

  return { items, loading, create, update, remove, reload: load };
};