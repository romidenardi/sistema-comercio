import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { getPurchases, createPurchase } from '../../api/purchases.api.js';
import { getSuppliers } from '../../api/suppliers.api.js';
import { getProducts } from '../../api/products.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      supplierId: '',
      invoiceNumber: '',
      items: [{ productId: '', quantity: 1, unitCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        getPurchases(),
        getSuppliers(),
        getProducts(),
      ]);
      setPurchases(purchasesRes.data);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      showToast('No se pudo cargar la información', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const total = (watchedItems || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0
  );

  const onSubmit = async (formData) => {
    try {
      const payload = {
        supplierId: formData.supplierId,
        invoiceNumber: formData.invoiceNumber || null,
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      };
      await createPurchase(payload);
      showToast('Compra registrada, stock actualizado');
      reset({ supplierId: '', invoiceNumber: '', items: [{ productId: '', quantity: 1, unitCost: 0 }] });
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al registrar la compra', 'error');
    }
  };

  const supplierName = (id) => suppliers.find((s) => s.id === id)?.name || '—';

  if (loading) return <Spinner label="Cargando compras..." />;

  return (
    <div className="purchases-page">
      <h1>Compras a proveedores</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="purchase-form">
        <div className="field">
          <label htmlFor="supplierId">Proveedor</label>
          <select id="supplierId" {...register('supplierId', { required: true })}>
            <option value="">Elegí un proveedor...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="invoiceNumber">N° de factura (opcional)</label>
          <input id="invoiceNumber" placeholder="Ej: 0001-00001234" {...register('invoiceNumber')} />
        </div>

        <div className="purchase-items">
          {fields.map((field, index) => (
            <div key={field.id} className="purchase-item-row">
              <div className="field">
                <label htmlFor={`item-product-${index}`}>Producto</label>
                <select id={`item-product-${index}`} {...register(`items.${index}.productId`, { required: true })}>
                  <option value="">Producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.internalCode})</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`item-quantity-${index}`}>Cantidad</label>
                <input
                  id={`item-quantity-${index}`}
                  type="number"
                  placeholder="Ej: 10"
                  {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                />
              </div>
              <div className="field">
                <label htmlFor={`item-unitCost-${index}`}>Costo unitario</label>
                <input
                  id={`item-unitCost-${index}`}
                  type="number"
                  step="0.01"
                  placeholder="Ej: 850"
                  {...register(`items.${index}.unitCost`, { required: true, min: 0 })}
                />
              </div>
              <div className="field item-remove-field">
                <label aria-hidden="true">&nbsp;</label>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  style={{ visibility: fields.length === 1 ? 'hidden' : 'visible' }}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => append({ productId: '', quantity: 1, unitCost: 0 })}>
          + Agregar producto
        </button>

        <div className="purchase-total">Total: ${total.toFixed(2)}</div>

        <button type="submit">Registrar compra</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Factura</th>
              <th>Artículos</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td data-label="Fecha">{new Date(purchase.date).toLocaleDateString('es-AR')}</td>
                <td data-label="Proveedor">{purchase.Supplier?.name || supplierName(purchase.supplierId)}</td>
                <td data-label="Factura">{purchase.invoiceNumber || '—'}</td>
                <td data-label="Artículos">{purchase.items?.map((i) => `${i.Product?.name} x${i.quantity}`).join(', ')}</td>
                <td data-label="Total">${Number(purchase.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Purchases;