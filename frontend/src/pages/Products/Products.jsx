import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../api/products.api.js';
import { getCategories } from '../../api/categories.api.js';
import StockMovementPanel from '../../components/common/StockMovementPanel.jsx';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [stockPanelId, setStockPanelId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { unitType: 'unit', vatRate: 21 },
  });
  const editForm = useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([getProducts(), getCategories()]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // aplana categorías + subcategorías para el dropdown
  const flatCategories = categories.flatMap((c) => [
    c,
    ...(c.subcategories || []),
  ]);

  const onCreate = async (formData) => {
    try {
      await createProduct({
        ...formData,
        price: Number(formData.price),
        cost: Number(formData.cost),
        promoPrice: formData.promoPrice ? Number(formData.promoPrice) : null,
        vatRate: Number(formData.vatRate),
        categoryId: formData.categoryId || null,
      });
      reset({ unitType: 'unit', vatRate: 21 });
      loadData();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message;
      setError(msg || 'Error al crear el producto');
    }
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setStockPanelId(null);
    editForm.reset(product);
  };

  const onUpdate = async (formData) => {
    try {
      await updateProduct(editingId, {
        ...formData,
        price: Number(formData.price),
        cost: Number(formData.cost),
        promoPrice: formData.promoPrice ? Number(formData.promoPrice) : null,
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      setError('Error al actualizar el producto');
    }
  };

  const onDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      loadData();
    } catch (err) {
      setError('Error al eliminar el producto');
    }
  };

  const handleStockChange = (productId, newStock) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  const categoryName = (categoryId) =>
    flatCategories.find((c) => c.id === categoryId)?.name || '—';

  if (loading) return <p>Cargando productos...</p>;

  return (
    <div className="products-page">
      <h1>Productos</h1>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit(onCreate)} className="product-form">
        <input
          placeholder="Código interno"
          {...register('internalCode', { required: 'Obligatorio' })}
        />
        <input placeholder="Código de barras" {...register('barcode')} />
        <input
          placeholder="Nombre"
          {...register('name', { required: 'Obligatorio' })}
        />
        <input placeholder="Marca" {...register('brand')} />
        <input placeholder="Modelo" {...register('model')} />

        <select {...register('categoryId')}>
          <option value="">Sin categoría</option>
          {flatCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select {...register('unitType')}>
          <option value="unit">Por unidad</option>
          <option value="weight">Por peso</option>
        </select>

        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          {...register('price', { required: 'Obligatorio', min: 0 })}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Precio promocional"
          {...register('promoPrice')}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Costo"
          {...register('cost', { required: 'Obligatorio', min: 0 })}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Alícuota IVA %"
          {...register('vatRate')}
        />

        <textarea placeholder="Descripción" {...register('description')} />

        {(errors.internalCode || errors.name || errors.price || errors.cost) && (
          <span className="error">Completá los campos obligatorios</span>
        )}

        <button type="submit">Agregar producto</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <>
              <tr key={product.id}>
                {editingId === product.id ? (
                  <td colSpan={5}>
                    <form onSubmit={editForm.handleSubmit(onUpdate)} className="product-edit-form">
                      <input {...editForm.register('name')} placeholder="Nombre" />
                      <input {...editForm.register('price')} type="number" step="0.01" placeholder="Precio" />
                      <input {...editForm.register('promoPrice')} type="number" step="0.01" placeholder="Precio promo" />
                      <input {...editForm.register('cost')} type="number" step="0.01" placeholder="Costo" />
                      <select {...editForm.register('active')}>
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                      <button type="submit">Guardar</button>
                      <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td>{product.internalCode}</td>
                    <td>{product.name}</td>
                    <td>{categoryName(product.categoryId)}</td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <button onClick={() => startEdit(product)}>Editar</button>
                      <button onClick={() => onDelete(product.id)}>Eliminar</button>
                      <button onClick={() => setStockPanelId(stockPanelId === product.id ? null : product.id)}>
                        {stockPanelId === product.id ? 'Cerrar stock' : 'Stock'}
                      </button>
                    </td>
                  </>
                )}
              </tr>
              {stockPanelId === product.id && (
                <tr>
                  <td colSpan={6}>
                    <StockMovementPanel
                      product={product}
                      onStockChange={(newStock) => handleStockChange(product.id, newStock)}
                    />
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Products;