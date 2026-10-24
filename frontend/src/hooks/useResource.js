import { useEffect, useState, useCallback } from 'react';
import { serverMessage } from '../utils/serverErrors.js';

// Carga y modifica una lista (clientes, proveedores, etc.). No muestra avisos: devuelve el resultado
// y cada pantalla lo muestra donde corresponde (junto al botón, en la fila o debajo del campo).
export const useResource = (api) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getAll();
      setItems(data);
      setLoadError('');
    } catch (err) {
      setLoadError('No se pudo cargar la información. Recargá la página.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  // result: { success: true } o { success: false, message, error }
  const run = async (action, fallback) => {
    try {
      await action();
      await load();
      return { success: true };
    } catch (err) {
      return { success: false, message: serverMessage(err, fallback), error: err };
    }
  };

  const create = (payload) => run(() => api.create(payload), 'No se pudo crear');
  const update = (id, payload) => run(() => api.update(id, payload), 'No se pudo guardar');
  const remove = (id) => run(() => api.remove(id), 'No se pudo eliminar');

  return { items, loading, loadError, create, update, remove, reload: load };
};
