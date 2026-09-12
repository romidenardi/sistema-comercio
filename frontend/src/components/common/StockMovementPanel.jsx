import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getMovementsByProduct, createStockMovement } from '../../api/stockMovements.api.js';

const StockMovementPanel = ({ product, onStockChange }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { register, handleSubmit, watch, reset } = useForm({ defaultValues: { type: 'in' } });

  const type = watch('type');

  const loadMovements = async () => {
    setLoading(true);
    try {
      const { data } = await getMovementsByProduct(product.id);
      setMovements(data);
    } catch (err) {
      setError('No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, [product.id]);

  const onSubmit = async (formData) => {
    try {
      const payload = { productId: product.id, type: formData.type, reason: formData.reason };
      if (formData.type === 'adjustment') {
        payload.newStock = Number(formData.value);
      } else {
        payload.quantity = Number(formData.value);
      }
      const { data } = await createStockMovement(payload);
      reset({ type: 'in' });
      loadMovements();
      onStockChange(data.newStock);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar el movimiento');
    }
  };

  return (
    <div className="stock-panel">
      <h3>Stock actual: {product.stock}</h3>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="stock-form">
        <select {...register('type')}>
          <option value="in">Ingreso</option>
          <option value="out">Egreso</option>
          <option value="adjustment">Ajuste (conteo físico)</option>
        </select>

        <input
          type="number"
          placeholder={type === 'adjustment' ? 'Stock real contado' : 'Cantidad'}
          {...register('value', { required: true, min: 0 })}
        />

        <input placeholder="Motivo" {...register('reason')} />

        <button type="submit">Registrar</button>
      </form>

      {loading ? (
        <p>Cargando historial...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Cambio</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.date).toLocaleString('es-AR')}</td>
                <td>{m.type}</td>
                <td>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                <td>{m.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StockMovementPanel;