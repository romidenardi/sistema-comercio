import { useEffect, useState, useCallback } from 'react';
import { useToast } from '../context/ToastContext.jsx';

// El mensaje que manda el servidor (por ejemplo, por qué no se puede borrar algo) o uno genérico
const serverMessage = (err, fallback) =>
  err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || fallback;

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
      const message = serverMessage(err, 'Error al crear');
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
      const message = serverMessage(err, 'Error al actualizar');
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  const remove = async (id) => {
    try {
      await api.remove(id);
      await load();
      showToast('Eliminado correctamente');
      return { success: true };
    } catch (err) {
      const message = serverMessage(err, 'Error al eliminar');
      showToast(message, 'error');
      return { success: false, message };
    }
  };

  return { items, loading, create, update, remove, reload: load };
};