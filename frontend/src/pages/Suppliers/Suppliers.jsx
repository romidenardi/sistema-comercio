import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useResource } from '../../hooks/useResource.js';
import * as suppliersApi from '../../api/suppliers.api.js';
import Spinner from '../../components/common/Spinner.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import { matchesSearch } from '../../utils/search.js';
import { RequiredMark, RequiredLegend } from '../../components/common/Required.jsx';

const api = {
  getAll: suppliersApi.getSuppliers,
  create: suppliersApi.createSupplier,
  update: suppliersApi.updateSupplier,
  remove: suppliersApi.deleteSupplier,
};

const Suppliers = () => {
  const { items: suppliers, loading, create, update, remove } = useResource(api);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const editForm = useForm();

  const onCreate = async (formData) => {
    const result = await create(formData);
    if (result.success) reset();
  };

  const startEdit = (supplier) => {
    setEditingId(supplier.id);
    editForm.reset({
      name: supplier.name || '',
      cuit: supplier.cuit || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || '',
      province: supplier.province || '',
      active: String(supplier.active ?? true),
    });
  };

  const onUpdate = async (formData) => {
    const result = await update(editingId, formData);
    if (result.success) setEditingId(null);
  };

  const onDelete = (id) => {
    if (confirm('¿Eliminar este proveedor?')) remove(id);
  };

  // La fila que se está editando sigue visible aunque el filtro no la incluya
  const visibleSuppliers = suppliers.filter((s) => s.id === editingId || matchesSearch(search, [
    s.name, s.cuit, s.contactPerson, s.phone, s.email, s.city, s.province,
  ]));

  if (loading) return <Spinner label="Cargando proveedores..." />;

  return (
    <div className="suppliers-page">
      <h1>Proveedores</h1>

      <form onSubmit={handleSubmit(onCreate)} className="supplier-form">
        <div className="field">
          <label htmlFor="name">Nombre / Razón social<RequiredMark /></label>
          <input id="name" placeholder="Ej: Distribuidora Central" {...register('name', { required: 'El nombre es obligatorio' })} />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="cuit">CUIT</label>
          <input id="cuit" placeholder="Ej: 30712345678" {...register('cuit')} />
        </div>

        <div className="field">
          <label htmlFor="contactPerson">Persona de contacto</label>
          <input id="contactPerson" placeholder="Ej: Marcos Gómez" {...register('contactPerson')} />
        </div>

        <div className="field">
          <label htmlFor="phone">Teléfono</label>
          <input id="phone" placeholder="Ej: 3492555123" {...register('phone')} />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="Ej: ventas@proveedor.com" {...register('email')} />
        </div>

        <div className="field">
          <label htmlFor="address">Dirección</label>
          <input id="address" placeholder="Ej: Ruta 34 km 12" {...register('address')} />
        </div>

        <div className="field">
          <label htmlFor="city">Localidad</label>
          <input id="city" placeholder="Ej: Rafaela" {...register('city')} />
        </div>

        <div className="field">
          <label htmlFor="province">Provincia</label>
          <input id="province" placeholder="Ej: Santa Fe" {...register('province')} />
        </div>

        <button type="submit">Agregar proveedor</button>
        <RequiredLegend />
      </form>

      <SearchInput
        id="supplier-search"
        label="Buscar proveedores"
        placeholder="Buscar por nombre, CUIT, contacto, teléfono o localidad..."
        value={search}
        onChange={setSearch}
      />

      <div className="table-wrapper">
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
            {visibleSuppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="list-search-empty">
                  {search ? 'No hay proveedores que coincidan con la búsqueda' : 'Todavía no hay proveedores'}
                </td>
              </tr>
            )}
            {visibleSuppliers.map((supplier) => (
              <tr key={supplier.id}>
                {editingId === supplier.id ? (
                  <td colSpan={5} className="edit-cell">
                    <form onSubmit={editForm.handleSubmit(onUpdate)} className="inline-edit-form">
                      <div className="field">
                        <label htmlFor={`edit-name-${supplier.id}`}>Nombre<RequiredMark /></label>
                        <input id={`edit-name-${supplier.id}`} {...editForm.register('name')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-cuit-${supplier.id}`}>CUIT</label>
                        <input id={`edit-cuit-${supplier.id}`} {...editForm.register('cuit')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-contactPerson-${supplier.id}`}>Contacto</label>
                        <input id={`edit-contactPerson-${supplier.id}`} {...editForm.register('contactPerson')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-phone-${supplier.id}`}>Teléfono</label>
                        <input id={`edit-phone-${supplier.id}`} {...editForm.register('phone')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-email-${supplier.id}`}>Email</label>
                        <input id={`edit-email-${supplier.id}`} type="email" {...editForm.register('email')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-address-${supplier.id}`}>Dirección</label>
                        <input id={`edit-address-${supplier.id}`} {...editForm.register('address')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-city-${supplier.id}`}>Localidad</label>
                        <input id={`edit-city-${supplier.id}`} {...editForm.register('city')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-province-${supplier.id}`}>Provincia</label>
                        <input id={`edit-province-${supplier.id}`} {...editForm.register('province')} />
                      </div>
                      <div className="field">
                        <label htmlFor={`edit-active-${supplier.id}`}>Estado</label>
                        <select id={`edit-active-${supplier.id}`} {...editForm.register('active')}>
                          <option value="true">Activo</option>
                          <option value="false">Inactivo (no aparece en Compras)</option>
                        </select>
                      </div>
                      <div className="inline-edit-actions">
                        <button type="submit">Guardar</button>
                        <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                      </div>
                      <RequiredLegend />
                    </form>
                  </td>
                ) : (
                  <>
                    <td data-label="Nombre">
                      {supplier.name}
                      {supplier.active === false && <small> · Inactivo</small>}
                    </td>
                    <td data-label="Contacto">{supplier.contactPerson || '—'}</td>
                    <td data-label="Teléfono">{supplier.phone || '—'}</td>
                    <td data-label="Localidad">{supplier.city || '—'}</td>
                    <td data-label="Acciones">
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
    </div>
  );
};

export default Suppliers;