import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getMovementsByProduct, createStockMovement } from '../../api/stockMovements.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from './Spinner.jsx';

const StockMovementPanel = ({ product, onStockChange }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { register, handleSubmit, watch, reset } = useForm({ defaultValues: { type: 'in' } });

  const type = watch('type');

  const loadMovements = async () => {
    setLoading(true);
    try {
      const { data } = await getMovementsByProduct(product.id);
      setMovements(data);
    } catch (err) {
      showToast('No se pudo cargar el historial', 'error');
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
      await createStockMovement(payload);
      reset({ type: 'in' });
      loadMovements();
      showToast('Movimiento registrado');
      onStockChange();
    } catch (err) {
      const message = err.response?.data?.message || 'Error al registrar el movimiento';
      showToast(message, 'error');
    }
  };

  return (
    <div className="stock-panel">
      <h3>Stock actual: {product.stock}</h3>

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
        <Spinner label="Cargando historial..." />
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