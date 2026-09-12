import { useForm } from 'react-hook-form';
import { useResource } from '../../hooks/useResource.js';
import * as paymentsApi from '../../api/payments.api.js';
import Spinner from '../../components/common/Spinner.jsx';
import { useState } from 'react';

const api = {
  getAll: paymentsApi.getPayments,
  create: paymentsApi.createPayment,
  update: paymentsApi.updatePayment,
  remove: paymentsApi.deletePayment,
};

const Payments = () => {
  const { items: payments, loading, create, update, remove } = useResource(api);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const editForm = useForm();

  const onCreate = async (formData) => {
    const result = await create({ name: formData.name });
    if (result.success) reset();
  };

  const startEdit = (payment) => {
    setEditingId(payment.id);
    editForm.reset({ name: payment.name });
  };

  const onUpdateName = async (formData) => {
    const result = await update(editingId, { name: formData.name });
    if (result.success) setEditingId(null);
  };

  const toggleActive = (payment) => update(payment.id, { active: !payment.active });

  const onDelete = (id) => {
    if (confirm('¿Eliminar esta forma de pago definitivamente?')) remove(id);
  };

  if (loading) return <Spinner label="Cargando formas de pago..." />;

  return (
    <div className="payments-page">
      <h1>Formas de pago</h1>

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