import { useState, Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { useResource } from '../../hooks/useResource.js';
import * as categoriesApi from '../../api/categories.api.js';
import Spinner from '../../components/common/Spinner.jsx';

const api = {
  getAll: categoriesApi.getCategories,
  create: categoriesApi.createCategory,
  update: categoriesApi.updateCategory,
  remove: categoriesApi.deleteCategory,
};

const Categories = () => {
  const { items: categories, loading, create, update, remove } = useResource(api);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const editForm = useForm();

  const topLevelCategories = categories.filter((c) => !c.parentId);

  const onCreate = async (formData) => {
    const result = await create({
      name: formData.name,
      parentId: formData.parentId || null,
    });
    if (result.success) reset();
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    editForm.reset({ name: category.name, parentId: category.parentId || '' });
  };

  const onUpdate = async (formData) => {
    const result = await update(editingId, {
      name: formData.name,
      parentId: formData.parentId || null,
    });
    if (result.success) setEditingId(null);
  };

  const onDelete = (id) => {
    if (confirm('¿Eliminar esta categoría?')) remove(id);
  };

  if (loading) return <Spinner label="Cargando categorías..." />;

  return (
    <div className="categories-page">
      <h1>Categorías</h1>

      <form onSubmit={handleSubmit(onCreate)} className="category-form">
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            placeholder="Ej: Bebidas"
            {...register('name', { required: 'El nombre es obligatorio' })}
          />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="parentId">Categoría padre (opcional)</label>
          <select id="parentId" {...register('parentId')}>
            <option value="">Sin categoría padre</option>
            {topLevelCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button type="submit">Agregar categoría</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {topLevelCategories.map((category) => (
              <Fragment key={category.id}>
                <tr>
                  {editingId === category.id ? (
                    <td className="edit-cell">
                      <form onSubmit={editForm.handleSubmit(onUpdate)} className="inline-edit-form">
                        <div className="field">
                          <label htmlFor={`edit-name-${category.id}`}>Nombre</label>
                          <input id={`edit-name-${category.id}`} {...editForm.register('name', { required: true })} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-parent-${category.id}`}>Categoría padre</label>
                          <select id={`edit-parent-${category.id}`} {...editForm.register('parentId')}>
                            <option value="">Sin categoría padre</option>
                            {topLevelCategories.filter((c) => c.id !== category.id).map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="inline-edit-actions">
                          <button type="submit">Guardar</button>
                          <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <td data-label="Nombre">{category.name}</td>
                  )}
                  <td data-label="Acciones">
                    {editingId !== category.id && (
                      <>
                        <button onClick={() => startEdit(category)}>Editar</button>
                        <button onClick={() => onDelete(category.id)}>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
                {category.subcategories?.map((sub) => (
                  <tr key={sub.id} className="subcategory-row">
                    {editingId === sub.id ? (
                      <td className="edit-cell">
                        <form onSubmit={editForm.handleSubmit(onUpdate)} className="inline-edit-form">
                          <div className="field">
                            <label htmlFor={`edit-name-${sub.id}`}>Nombre</label>
                            <input id={`edit-name-${sub.id}`} {...editForm.register('name', { required: true })} />
                          </div>
                          <div className="field">
                            <label htmlFor={`edit-parent-${sub.id}`}>Categoría padre</label>
                            <select id={`edit-parent-${sub.id}`} {...editForm.register('parentId')}>
                              <option value="">Sin categoría padre</option>
                              {topLevelCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="inline-edit-actions">
                            <button type="submit">Guardar</button>
                            <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      <td data-label="Nombre">
                        <span className="subcategory-name">↳ {sub.name}</span>
                      </td>
                    )}
                    <td data-label="Acciones">
                      {editingId !== sub.id && (
                        <>
                          <button onClick={() => startEdit(sub)}>Editar</button>
                          <button onClick={() => onDelete(sub.id)}>Eliminar</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Categories;