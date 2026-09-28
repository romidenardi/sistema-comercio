import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResource } from '../../hooks/useResource.js';
import * as paymentsApi from '../../api/payments.api.js';
import Spinner from '../../components/common/Spinner.jsx';

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
    const result = await create({
      name: formData.name,
      active: true,
    });
    if (result.success) reset();
  };

  const startEdit = (payment) => {
    setEditingId(payment.id);
    editForm.reset({ name: payment.name, active: String(payment.active) });
  };

  const onUpdate = async (formData) => {
    const result = await update(editingId, {
      name: formData.name,
      active: formData.active === 'true',
    });
    if (result.success) setEditingId(null);
  };

  const onDelete = (id) => {
    if (confirm('¿Eliminar esta forma de pago?')) remove(id);
  };

  if (loading) return <Spinner label="Cargando formas de pago..." />;

  return (
    <div className="payments-page">
      <h1>Formas de pago</h1>

      <form onSubmit={handleSubmit(onCreate)} className="payment-form">
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            placeholder="Ej: Transferencia bancaria"
            {...register('name', { required: 'El nombre es obligatorio' })}
          />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <button type="submit">Agregar forma de pago</button>
      </form>

      <div className="table-wrapper">
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
                {editingId === payment.id ? (
                  <td colSpan={3} className="edit-cell">
                    <form onSubmit={editForm.handleSubmit(onUpdate)} className="inline-edit-form">
                      <div className="field">
                        <label htmlFor={`edit-name-${payment.id}`}>Nombre</label>
                        <input
                          id={`edit-name-${payment.id}`}
                          placeholder="Ej: Transferencia bancaria"
                          {...editForm.register('name', { required: true })}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-active-${payment.id}`}>Estado</label>
                        <select id={`edit-active-${payment.id}`} {...editForm.register('active')}>
                          <option value="true">Activa</option>
                          <option value="false">Inactiva</option>
                        </select>
                      </div>
                      <div className="inline-edit-actions">
                        <button type="submit">Guardar</button>
                        <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td data-label="Nombre">{payment.name}</td>
                    <td data-label="Estado">{payment.active ? 'Activa' : 'Inactiva'}</td>
                    <td data-label="Acciones">
                      <button onClick={() => startEdit(payment)}>Editar</button>
                      <button onClick={() => onDelete(payment.id)}>Eliminar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;