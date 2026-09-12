import { useState } from 'react';
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
    editForm.reset({ name: category.name });
  };

  const onUpdate = async (formData) => {
    const result = await update(editingId, { name: formData.name });
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
        <input
          placeholder="Nombre de la categoría"
          {...register('name', { required: 'El nombre es obligatorio' })}
        />
        {errors.name && <span className="error">{errors.name.message}</span>}

        <select {...register('parentId')}>
          <option value="">Sin categoría padre</option>
          {topLevelCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button type="submit">Agregar categoría</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Subcategorías</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>
                {editingId === category.id ? (
                  <form onSubmit={editForm.handleSubmit(onUpdate)} style={{ display: 'inline' }}>
                    <input {...editForm.register('name', { required: true })} />
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                  </form>
                ) : (
                  category.name
                )}
              </td>
              <td>
                {category.subcategories?.length
                  ? category.subcategories.map((s) => s.name).join(', ')
                  : '—'}
              </td>
              <td>
                {editingId !== category.id && (
                  <>
                    <button onClick={() => startEdit(category)}>Editar</button>
                    <button onClick={() => onDelete(category.id)}>Eliminar</button>
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

export default Categories;