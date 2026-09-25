import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResource } from '../../hooks/useResource.js';
import * as suppliersApi from '../../api/suppliers.api.js';
import Spinner from '../../components/common/Spinner.jsx';

const api = {
  getAll: suppliersApi.getSuppliers,
  create: suppliersApi.createSupplier,
  update: suppliersApi.updateSupplier,
  remove: suppliersApi.deleteSupplier,
};

const Suppliers = () => {
  const { items: suppliers, loading, create, update, remove } = useResource(api);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const editForm = useForm();

  const onCreate = async (formData) => {
    const result = await create(formData);
    if (result.success) reset();
  };

  const startEdit = (supplier) => {
    setEditingId(supplier.id);
    editForm.reset(supplier);
  };

  const onUpdate = async (formData) => {
    const result = await update(editingId, formData);
    if (result.success) setEditingId(null);
  };

  const onDelete = (id) => {
    if (confirm('¿Eliminar este proveedor?')) remove(id);
  };

  if (loading) return <Spinner label="Cargando proveedores..." />;

  return (
    <div className="suppliers-page">
      <h1>Proveedores</h1>

      <form onSubmit={handleSubmit(onCreate)} className="supplier-form">
        <input
          placeholder="Nombre / Razón social"
          {...register('name', { required: 'El nombre es obligatorio' })}
        />
        {errors.name && <span className="error">{errors.name.message}</span>}

        <input placeholder="CUIT" {...register('cuit')} />
        <input placeholder="Persona de contacto" {...register('contactPerson')} />
        <input placeholder="Teléfono" {...register('phone')} />
        <input placeholder="Email" type="email" {...register('email')} />
        <input placeholder="Dirección" {...register('address')} />
        <input placeholder="Localidad" {...register('city')} />
        <input placeholder="Provincia" {...register('province')} />

        <button type="submit">Agregar proveedor</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Localidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              {editingId === supplier.id ? (
                <td colSpan={4}>
                  <form onSubmit={editForm.handleSubmit(onUpdate)} className="supplier-edit-form">
                    <input {...editForm.register('name')} placeholder="Nombre" />
                    <input {...editForm.register('contactPerson')} placeholder="Contacto" />
                    <input {...editForm.register('phone')} placeholder="Teléfono" />
                    <input {...editForm.register('city')} placeholder="Localidad" />
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                  </form>
                </td>
              ) : (
                <>
                  <td>{supplier.name}</td>
                  <td>{supplier.contactPerson || '—'}</td>
                  <td>{supplier.phone || '—'}</td>
                  <td>{supplier.city || '—'}</td>
                  <td>
                    <button onClick={() => startEdit(supplier)}>Editar</button>
                    <button onClick={() => onDelete(supplier.id)}>Eliminar</button>
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

export default Suppliers;