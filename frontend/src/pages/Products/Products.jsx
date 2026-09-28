import { useState, useEffect, Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { useResource } from '../../hooks/useResource.js';
import * as productsApi from '../../api/products.api.js';
import { getCategories } from '../../api/categories.api.js';
import StockMovementPanel from '../../components/common/StockMovementPanel.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const api = {
  getAll: productsApi.getProducts,
  create: productsApi.createProduct,
  update: productsApi.updateProduct,
  remove: productsApi.deleteProduct,
};

const Products = () => {
  const { items: products, loading, create, update, remove, reload } = useResource(api);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [stockPanelId, setStockPanelId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { unitType: 'unit', vatRate: 21 },
  });
  const editForm = useForm();

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data));
  }, []);

  const flatCategories = categories.flatMap((c) => [c, ...(c.subcategories || [])]);

  const onCreate = async (formData) => {
    const result = await create({
      ...formData,
      price: Number(formData.price),
      cost: Number(formData.cost),
      promoPrice: formData.promoPrice ? Number(formData.promoPrice) : null,
      vatRate: Number(formData.vatRate),
      categoryId: formData.categoryId || null,
    });
    if (result.success) reset({ unitType: 'unit', vatRate: 21 });
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setStockPanelId(null);
    editForm.reset({
      internalCode: product.internalCode || '',
      barcode: product.barcode || '',
      name: product.name || '',
      brand: product.brand || '',
      model: product.model || '',
      categoryId: product.categoryId || '',
      unitType: product.unitType || 'unit',
      price: product.price,
      promoPrice: product.promoPrice || '',
      cost: product.cost,
      vatRate: product.vatRate,
      description: product.description || '',
      active: String(product.active),
    });
  };

  const onUpdate = async (formData) => {
    const result = await update(editingId, {
      ...formData,
      price: Number(formData.price),
      cost: Number(formData.cost),
      promoPrice: formData.promoPrice ? Number(formData.promoPrice) : null,
      vatRate: Number(formData.vatRate),
      categoryId: formData.categoryId || null,
      active: formData.active === 'true',
    });
    if (result.success) setEditingId(null);
  };

  const onDelete = (id) => {
    if (confirm('¿Eliminar este producto?')) remove(id);
  };

  const categoryName = (categoryId) =>
    flatCategories.find((c) => c.id === categoryId)?.name || '—';

  if (loading) return <Spinner label="Cargando productos..." />;

  return (
    <div className="products-page">
      <h1>Productos</h1>

      <form onSubmit={handleSubmit(onCreate)} className="product-form">
        <div className="field">
          <label htmlFor="internalCode">Código interno</label>
          <input id="internalCode" placeholder="Ej: P001" {...register('internalCode', { required: 'Obligatorio' })} />
          {errors.internalCode && <span className="error">{errors.internalCode.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="barcode">Código de barras</label>
          <input id="barcode" placeholder="Ej: 7791234567890" {...register('barcode')} />
        </div>

        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input id="name" placeholder="Ej: Cerveza IPA 500ml" {...register('name', { required: 'Obligatorio' })} />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

        <div className="field">
          <label htmlFor="brand">Marca</label>
          <input id="brand" placeholder="Ej: Patagonia" {...register('brand')} />
        </div>

        <div className="field">
          <label htmlFor="model">Modelo</label>
          <input id="model" placeholder="Ej: IPA 2024" {...register('model')} />
        </div>

        <div className="field">
          <label htmlFor="categoryId">Categoría</label>
          <select id="categoryId" {...register('categoryId')}>
            <option value="">Sin categoría</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="unitType">Unidad de comercialización</label>
          <select id="unitType" {...register('unitType')}>
            <option value="unit">Por unidad</option>
            <option value="weight">Por peso</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="price">Precio</label>
          <input id="price" type="number" step="0.01" placeholder="Ej: 1500" {...register('price', { required: 'Obligatorio', min: 0 })} />
        </div>

        <div className="field">
          <label htmlFor="promoPrice">Precio promocional</label>
          <input id="promoPrice" type="number" step="0.01" placeholder="Ej: 1350" {...register('promoPrice')} />
        </div>

        <div className="field">
          <label htmlFor="cost">Costo</label>
          <input id="cost" type="number" step="0.01" placeholder="Ej: 900" {...register('cost', { required: 'Obligatorio', min: 0 })} />
        </div>

        <div className="field">
          <label htmlFor="vatRate">Alícuota de IVA (%)</label>
          <input id="vatRate" type="number" step="0.01" placeholder="Ej: 21" {...register('vatRate')} />
        </div>

        <div className="field field-full">
          <label htmlFor="description">Descripción</label>
          <textarea id="description" placeholder="Ej: Cerveza artesanal estilo IPA, botella 500ml" {...register('description')} />
        </div>

        {(errors.internalCode || errors.name || errors.price || errors.cost) && (
          <span className="error">Completá los campos obligatorios</span>
        )}

        <button type="submit">Agregar producto</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Precio promo</th>
              <th>Costo</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <Fragment key={product.id}>
                <tr>
                  {editingId === product.id ? (
                    <td colSpan={8} className="edit-cell">
                      <form onSubmit={editForm.handleSubmit(onUpdate)} className="inline-edit-form">
                        <div className="field">
                          <label htmlFor={`edit-internalCode-${product.id}`}>Código interno</label>
                          <input id={`edit-internalCode-${product.id}`} {...editForm.register('internalCode')} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-barcode-${product.id}`}>Código de barras</label>
                          <input id={`edit-barcode-${product.id}`} {...editForm.register('barcode')} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-name-${product.id}`}>Nombre</label>
                          <input id={`edit-name-${product.id}`} {...editForm.register('name')} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-brand-${product.id}`}>Marca</label>
                          <input id={`edit-brand-${product.id}`} {...editForm.register('brand')} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-model-${product.id}`}>Modelo</label>
                          <input id={`edit-model-${product.id}`} {...editForm.register('model')} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-categoryId-${product.id}`}>Categoría</label>
                          <select id={`edit-categoryId-${product.id}`} {...editForm.register('categoryId')}>
                            <option value="">Sin categoría</option>
                            {flatCategories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-unitType-${product.id}`}>Unidad</label>
                          <select id={`edit-unitType-${product.id}`} {...editForm.register('unitType')}>
                            <option value="unit">Por unidad</option>
                            <option value="weight">Por peso</option>
                          </select>
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-price-${product.id}`}>Precio</label>
                          <input id={`edit-price-${product.id}`} type="number" step="0.01" {...editForm.register('price')} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-promoPrice-${product.id}`}>Precio promo</label>
                          <input id={`edit-promoPrice-${product.id}`} type="number" step="0.01" {...editForm.register('promoPrice')} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-cost-${product.id}`}>Costo</label>
                          <input id={`edit-cost-${product.id}`} type="number" step="0.01" {...editForm.register('cost')} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-vatRate-${product.id}`}>Alícuota IVA (%)</label>
                          <input id={`edit-vatRate-${product.id}`} type="number" step="0.01" {...editForm.register('vatRate')} />
                        </div>
                        <div className="field">
                          <label htmlFor={`edit-active-${product.id}`}>Estado</label>
                          <select id={`edit-active-${product.id}`} {...editForm.register('active')}>
                            <option value="true">Activo</option>
                            <option value="false">Inactivo</option>
                          </select>
                        </div>
                        <div className="field field-full">
                          <label htmlFor={`edit-description-${product.id}`}>Descripción</label>
                          <textarea id={`edit-description-${product.id}`} {...editForm.register('description')} />
                        </div>
                        <div className="inline-edit-actions">
                          <button type="submit">Guardar</button>
                          <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td data-label="Código">{product.internalCode}</td>
                      <td data-label="Nombre">{product.name}</td>
                      <td data-label="Categoría">{categoryName(product.categoryId)}</td>
                      <td data-label="Precio">${Number(product.price).toFixed(2)}</td>
                      <td data-label="Precio promo">{product.promoPrice ? `$${Number(product.promoPrice).toFixed(2)}` : '—'}</td>
                      <td data-label="Costo">${Number(product.cost).toFixed(2)}</td>
                      <td data-label="Stock">{product.stock}</td>
                      <td data-label="Acciones">
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
                    <td colSpan={8} className="edit-cell">
                      <StockMovementPanel product={product} onStockChange={reload} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;