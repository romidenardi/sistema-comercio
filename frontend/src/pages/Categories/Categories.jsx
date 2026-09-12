import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/categories.api.js';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const editForm = useForm();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await getCategories();
      setCategories(data);
    } catch (err) {
      setError('No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onCreate = async (formData) => {
    try {
      await createCategory({
        name: formData.name,
        parentId: formData.parentId || null,
      });
      reset();
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la categoría');
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    editForm.reset({ name: category.name });
  };

  const onUpdate = async (formData) => {
    try {
      await updateCategory(editingId, { name: formData.name });
      setEditingId(null);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar la categoría');
    }
  };

  const onDelete = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      setError('Error al eliminar la categoría');
    }
  };

  // solo categorías de primer nivel para el dropdown de "padre"
  const topLevelCategories = categories.filter((c) => !c.parentId);

  if (loading) return <p>Cargando categorías...</p>;

  return (
    <div className="categories-page">
      <h1>Categorías</h1>

      {error && <p className="error">{error}</p>}

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