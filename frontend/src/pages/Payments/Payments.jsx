import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
} from '../../api/payments.api.js';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const editForm = useForm();

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data } = await getPayments();
      setPayments(data);
    } catch (err) {
      setError('No se pudieron cargar las formas de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const onCreate = async (formData) => {
    try {
      await createPayment({ name: formData.name });
      reset();
      loadPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la forma de pago');
    }
  };

  const startEdit = (payment) => {
    setEditingId(payment.id);
    editForm.reset({ name: payment.name });
  };

  const onUpdateName = async (formData) => {
    try {
      await updatePayment(editingId, { name: formData.name });
      setEditingId(null);
      loadPayments();
    } catch (err) {
      setError('Error al actualizar la forma de pago');
    }
  };

  const toggleActive = async (payment) => {
    try {
      await updatePayment(payment.id, { active: !payment.active });
      loadPayments();
    } catch (err) {
      setError('Error al cambiar el estado');
    }
  };

  const onDelete = async (id) => {
    if (!confirm('¿Eliminar esta forma de pago definitivamente?')) return;
    try {
      await deletePayment(id);
      loadPayments();
    } catch (err) {
      setError('Error al eliminar la forma de pago');
    }
  };

  if (loading) return <p>Cargando formas de pago...</p>;

  return (
    <div className="payments-page">
      <h1>Formas de pago</h1>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit(onCreate)} className="payment-form">
        <input
          placeholder="Nombre (ej. Efectivo, Tarjeta)"
          {...register('name', { required: 'El nombre es obligatorio' })}
        />
        {errors.name && <span className="error">{errors.name.message}</span>}
        <button type="submit">Agregar</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>
                {editingId === payment.id ? (
                  <form onSubmit={editForm.handleSubmit(onUpdateName)} style={{ display: 'inline' }}>
                    <input {...editForm.register('name', { required: true })} />
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                  </form>
                ) : (
                  payment.name
                )}
              </td>
              <td>
                <button onClick={() => toggleActive(payment)}>
                  {payment.active ? 'Activa' : 'Inactiva'}
                </button>
              </td>
              <td>
                {editingId !== payment.id && (
                  <>
                    <button onClick={() => startEdit(payment)}>Editar</button>
                    <button onClick={() => onDelete(payment.id)}>Eliminar</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Payments;