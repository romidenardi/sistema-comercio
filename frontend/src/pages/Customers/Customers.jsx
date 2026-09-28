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

const FISCAL_CONDITIONS = ['Consumidor Final', 'Responsable Inscripto', 'Monotributista', 'Exento'];

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
        ? { businessName: formData.businessName, firstName: null, lastName: null }
        : { firstName: formData.firstName, lastName: formData.lastName, businessName: null }),
    };
    const result = await create(payload);
    if (result.success) reset();
  };

  const startEdit = (customer) => {
    setEditingId(customer.id);
    editForm.reset({
      businessName: customer.businessName || '',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      fiscalCondition: customer.fiscalCondition || '',
      cuit: customer.cuit || '',
      address: customer.address || '',
      zipCode: customer.zipCode || '',
      city: customer.city || '',
      province: customer.province || '',
      phone: customer.phone || '',
      email: customer.email || '',
    });
  };

  const onUpdate = async (formData) => {
    const result = await update(editingId, {
      businessName: formData.businessName || null,
      firstName: formData.firstName || null,
      lastName: formData.lastName || null,
      fiscalCondition: formData.fiscalCondition,
      cuit: formData.cuit || null,
      address: formData.address || null,
      zipCode: formData.zipCode || null,
      city: formData.city || null,
      province: formData.province || null,
      phone: formData.phone || null,
      email: formData.email || null,
    });
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
            <input type="radio" checked={personType === 'individual'} onChange={() => setPersonType('individual')} />
            Persona física
          </label>
          <label>
            <input type="radio" checked={personType === 'business'} onChange={() => setPersonType('business')} />
            Empresa
          </label>
        </div>

        {personType === 'business' ? (
          <div className="field">
            <label htmlFor="businessName">Razón social</label>
            <input
              id="businessName"
              placeholder="Ej: Distribuidora del Sur SA"
              {...register('businessName', { required: 'La razón social es obligatoria' })}
            />
            {errors.businessName && <span className="error">{errors.businessName.message}</span>}
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="firstName">Nombre</label>
              <input
                id="firstName"
                placeholder="Ej: Juan"
                {...register('firstName', { required: 'El nombre es obligatorio' })}
              />
              {errors.firstName && <span className="error">{errors.firstName.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="lastName">Apellido</label>
              <input id="lastName" placeholder="Ej: Pérez" {...register('lastName')} />
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="fiscalCondition">Condición fiscal</label>
          <select id="fiscalCondition" {...register('fiscalCondition', { required: 'La condición fiscal es obligatoria' })}>
            <option value="">Elegí una opción...</option>
            {FISCAL_CONDITIONS.map((fc) => (
              <option key={fc} value={fc}>{fc}</option>
            ))}
          </select>
          {errors.fiscalCondition && <span className="error">{errors.fiscalCondition.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="cuit">CUIT</label>
          <input id="cuit" placeholder="Ej: 20345678901" {...register('cuit')} />
        </div>
        <div className="field">
          <label htmlFor="address">Dirección</label>
          <input id="address" placeholder="Ej: San Martín 850" {...register('address')} />
        </div>
        <div className="field">
          <label htmlFor="zipCode">Código postal</label>
          <input id="zipCode" placeholder="Ej: 2300" {...register('zipCode')} />
        </div>
        <div className="field">
          <label htmlFor="city">Localidad</label>
          <input id="city" placeholder="Ej: Rafaela" {...register('city')} />
        </div>
        <div className="field">
          <label htmlFor="province">Provincia</label>
          <input id="province" placeholder="Ej: Santa Fe" {...register('province')} />
        </div>
        <div className="field">
          <label htmlFor="phone">Teléfono</label>
          <input id="phone" placeholder="Ej: 3492555111" {...register('phone')} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="Ej: juan.perez@mail.com" {...register('email')} />
        </div>

        <button type="submit">Agregar cliente</button>
      </form>

      <div className="table-wrapper">
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
                  <td colSpan={5} className="edit-cell">
                    <form onSubmit={editForm.handleSubmit(onUpdate)} className="inline-edit-form">
                      <div className="field">
                        <label htmlFor={`edit-businessName-${customer.id}`}>Razón social</label>
                        <input id={`edit-businessName-${customer.id}`} placeholder="Ej: Distribuidora del Sur SA" {...editForm.register('businessName')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-firstName-${customer.id}`}>Nombre</label>
                        <input id={`edit-firstName-${customer.id}`} placeholder="Ej: Juan" {...editForm.register('firstName')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-lastName-${customer.id}`}>Apellido</label>
                        <input id={`edit-lastName-${customer.id}`} placeholder="Ej: Pérez" {...editForm.register('lastName')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-fiscalCondition-${customer.id}`}>Condición fiscal</label>
                        <select id={`edit-fiscalCondition-${customer.id}`} {...editForm.register('fiscalCondition')}>
                          {FISCAL_CONDITIONS.map((fc) => (
                            <option key={fc} value={fc}>{fc}</option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-cuit-${customer.id}`}>CUIT</label>
                        <input id={`edit-cuit-${customer.id}`} placeholder="Ej: 20345678901" {...editForm.register('cuit')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-address-${customer.id}`}>Dirección</label>
                        <input id={`edit-address-${customer.id}`} placeholder="Ej: San Martín 850" {...editForm.register('address')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-zipCode-${customer.id}`}>Código postal</label>
                        <input id={`edit-zipCode-${customer.id}`} placeholder="Ej: 2300" {...editForm.register('zipCode')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-city-${customer.id}`}>Localidad</label>
                        <input id={`edit-city-${customer.id}`} placeholder="Ej: Rafaela" {...editForm.register('city')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-province-${customer.id}`}>Provincia</label>
                        <input id={`edit-province-${customer.id}`} placeholder="Ej: Santa Fe" {...editForm.register('province')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-phone-${customer.id}`}>Teléfono</label>
                        <input id={`edit-phone-${customer.id}`} placeholder="Ej: 3492555111" {...editForm.register('phone')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-email-${customer.id}`}>Email</label>
                        <input id={`edit-email-${customer.id}`} type="email" placeholder="Ej: juan.perez@mail.com" {...editForm.register('email')} />
                      </div>
                      <div className="inline-edit-actions">
                        <button type="submit">Guardar</button>
                        <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td data-label="Nombre / Razón social">{displayName(customer)}</td>
                    <td data-label="Condición fiscal">{customer.fiscalCondition}</td>
                    <td data-label="CUIT">{customer.cuit || '—'}</td>
                    <td data-label="Localidad">{customer.city || '—'}</td>
                    <td data-label="Acciones">
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
    </div>
  );
};

export default Customers;