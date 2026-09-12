import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResource } from '../../hooks/useResource.js';
import * as customersApi from '../../api/customers.api.js';
import Spinner from '../../components/common/Spinner.jsx';

const api = {
  getAll: customersApi.getCustomers,
  create: customersApi.createCustomer,
  update: customersApi.updateCustomer,
  remove: customersApi.deleteCustomer,
};

const FISCAL_CONDITIONS = [
  'Consumidor Final',
  'Responsable Inscripto',
  'Monotributista',
  'Exento',
];

const Customers = () => {
  const { items: customers, loading, create, update, remove } = useResource(api);
  const [editingId, setEditingId] = useState(null);
  const [personType, setPersonType] = useState('individual');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const editForm = useForm();

  const onCreate = async (formData) => {
    const payload = {
      fiscalCondition: formData.fiscalCondition,
      cuit: formData.cuit || null,
      address: formData.address || null,
      zipCode: formData.zipCode || null,
      city: formData.city || null,
      province: formData.province || null,
      phone: formData.phone || null,
      email: formData.email || null,
      ...(personType === 'business'
        ? { businessName: formData.businessName }
        : { firstName: formData.firstName, lastName: formData.lastName }),
    };
    const result = await create(payload);
    if (result.success) reset();
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    editForm.reset(customer);
  };

  const onUpdate = async (formData) => {
    const result = await update(editingId, formData);
    if (result.success) setEditingId(null);
  };

  const onDelete = (id) => {
    if (confirm('¿Eliminar este cliente?')) remove(id);
  };

  const displayName = (c) => c.businessName || `${c.firstName} ${c.lastName || ''}`.trim();

  if (loading) return <Spinner label="Cargando clientes..." />;

  return (
    <div className="customers-page">
      <h1>Clientes</h1>

      <form onSubmit={handleSubmit(onCreate)} className="customer-form">
        <div className="person-type-toggle">
          <label>
            <input
              type="radio"
              checked={personType === 'individual'}
              onChange={() => setPersonType('individual')}
            />
            Persona física
          </label>
          <label>
            <input
              type="radio"
              checked={personType === 'business'}
              onChange={() => setPersonType('business')}
            />
            Empresa
          </label>
        </div>

        {personType === 'business' ? (
          <input
            placeholder="Razón social"
            {...register('businessName', { required: 'La razón social es obligatoria' })}
          />
        ) : (
          <>
            <input
              placeholder="Nombre"
              {...register('firstName', { required: 'El nombre es obligatorio' })}
            />
            <input placeholder="Apellido" {...register('lastName')} />
          </>
        )}
        {(errors.businessName || errors.firstName) && (
          <span className="error">{(errors.businessName || errors.firstName).message}</span>
        )}

        <select {...register('fiscalCondition', { required: 'La condición fiscal es obligatoria' })}>
          <option value="">Condición fiscal...</option>
          {FISCAL_CONDITIONS.map((fc) => (
            <option key={fc} value={fc}>{fc}</option>
          ))}
        </select>
        {errors.fiscalCondition && <span className="error">{errors.fiscalCondition.message}</span>}

        <input placeholder="CUIT" {...register('cuit')} />
        <input placeholder="Dirección" {...register('address')} />
        <input placeholder="CP" {...register('zipCode')} />
        <input placeholder="Localidad" {...register('city')} />
        <input placeholder="Provincia" {...register('province')} />
        <input placeholder="Teléfono" {...register('phone')} />
        <input placeholder="Email" type="email" {...register('email')} />

        <button type="submit">Agregar cliente</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nombre / Razón social</th>
            <th>Condición fiscal</th>
            <th>CUIT</th>
            <th>Localidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              {editingId === customer.id ? (
                <td colSpan={4}>
                  <form onSubmit={editForm.handleSubmit(onUpdate)} className="customer-edit-form">
                    <input {...editForm.register('businessName')} placeholder="Razón social" />
                    <input {...editForm.register('firstName')} placeholder="Nombre" />
                    <input {...editForm.register('lastName')} placeholder="Apellido" />
                    <select {...editForm.register('fiscalCondition')}>
                      {FISCAL_CONDITIONS.map((fc) => (
                        <option key={fc} value={fc}>{fc}</option>
                      ))}
                    </select>
                    <input {...editForm.register('cuit')} placeholder="CUIT" />
                    <input {...editForm.register('city')} placeholder="Localidad" />
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                  </form>
                </td>
              ) : (
                <>
                  <td>{displayName(customer)}</td>
                  <td>{customer.fiscalCondition}</td>
                  <td>{customer.cuit || '—'}</td>
                  <td>{customer.city || '—'}</td>
                  <td>
                    <button onClick={() => startEdit(customer)}>Editar</button>
                    <button onClick={() => onDelete(customer.id)}>Eliminar</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Customers;