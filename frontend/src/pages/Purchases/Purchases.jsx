import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { getPurchases, createPurchase } from '../../api/purchases.api.js';
import { getSuppliers, createSupplier } from '../../api/suppliers.api.js';
import { getProducts, createProduct } from '../../api/products.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const NEW_SUPPLIER = '__new_supplier__';
const NEW_PRODUCT = '__new_product__';

const emptyItem = () => ({
  productId: '',
  quantity: 1,
  unitCost: 0,
  newProduct: { internalCode: '', name: '', price: '', vatRate: 21, unitType: 'unit' },
});

const emptyForm = () => ({
  supplierId: '',
  invoiceNumber: '',
  newSupplier: { name: '', cuit: '', phone: '', email: '' },
  items: [emptyItem()],
});

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { role } = useAuth();
  const canManageData = role === 'admin' || role === 'editor';

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: emptyForm(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const selectedSupplierId = watch('supplierId');
  const isNewSupplier = selectedSupplierId === NEW_SUPPLIER;

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
      // 1) Valido todo lo nuevo antes de crear nada
      if (isNewSupplier && !formData.newSupplier.name) {
        showToast('Completá el nombre del proveedor nuevo', 'error');
        return;
      }

      for (const item of formData.items) {
        if (item.productId === NEW_PRODUCT) {
          const np = item.newProduct || {};
          if (!np.internalCode || !np.name) {
            showToast('Completá código interno y nombre del producto nuevo', 'error');
            return;
          }
          if (!(Number(np.price) > 0)) {
            showToast('Cargá el precio de venta del producto nuevo', 'error');
            return;
          }
        }
      }

      // 2) Proveedor nuevo
      let supplierId = formData.supplierId;
      if (isNewSupplier) {
        const { name, cuit, phone, email } = formData.newSupplier;
        const { data: newSupplier } = await createSupplier({
          name,
          cuit: cuit || null,
          phone: phone || null,
          email: email || null,
        });
        supplierId = newSupplier.id;
        // Si la compra falla más adelante, el proveedor queda elegido y no se vuelve a crear
        setSuppliers((prev) => [...prev, newSupplier]);
        setValue('supplierId', newSupplier.id);
      }

      // 3) Productos nuevos (se crean con stock 0; la compra les suma las unidades)
      const payloadItems = [];
      for (let i = 0; i < formData.items.length; i += 1) {
        const item = formData.items[i];
        let productId = item.productId;

        if (productId === NEW_PRODUCT) {
          const np = item.newProduct;
          const { data: createdProduct } = await createProduct({
            internalCode: np.internalCode,
            name: np.name,
            price: Number(np.price),
            cost: Number(item.unitCost) || 0,
            vatRate: np.vatRate === '' || np.vatRate === undefined ? 21 : Number(np.vatRate),
            unitType: np.unitType || 'unit',
          });
          productId = createdProduct.id;
          // Si la compra falla más adelante, el producto queda elegido y no se vuelve a crear
          setProducts((prev) => [...prev, createdProduct]);
          setValue(`items.${i}.productId`, createdProduct.id);
        }

        payloadItems.push({
          productId,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        });
      }

      // 4) Compra
      const payload = {
        supplierId,
        invoiceNumber: formData.invoiceNumber || null,
        items: payloadItems,
      };
      await createPurchase(payload);
      showToast('Compra registrada, stock actualizado');
      reset(emptyForm());
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
            {canManageData && <option value={NEW_SUPPLIER}>+ Nuevo proveedor...</option>}
          </select>
        </div>

        {isNewSupplier && (
          <div className="inline-customer-form">
            <div className="field">
              <label htmlFor="newSupplierName">Nombre</label>
              <input id="newSupplierName" placeholder="Ej: Distribuidora Norte SRL" {...register('newSupplier.name')} />
            </div>
            <div className="field">
              <label htmlFor="newSupplierCuit">CUIT</label>
              <input id="newSupplierCuit" placeholder="Ej: 30-12345678-9" {...register('newSupplier.cuit')} />
            </div>
            <div className="field">
              <label htmlFor="newSupplierPhone">Teléfono</label>
              <input id="newSupplierPhone" placeholder="Ej: 3492 456789" {...register('newSupplier.phone')} />
            </div>
            <div className="field">
              <label htmlFor="newSupplierEmail">Email</label>
              <input id="newSupplierEmail" type="email" placeholder="Ej: ventas@distribuidora.com" {...register('newSupplier.email')} />
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="invoiceNumber">N° de factura (opcional)</label>
          <input id="invoiceNumber" placeholder="Ej: 0001-00001234" {...register('invoiceNumber')} />
        </div>

        <div className="purchase-items">
          {fields.map((field, index) => {
            const rowProductId = watchedItems?.[index]?.productId;
            const isNewProduct = rowProductId === NEW_PRODUCT;
            const rowQuantity = Number(watchedItems?.[index]?.quantity) || 0;

            return (
              <div key={field.id} className="purchase-item-row">
                <div className="field">
                  <label htmlFor={`item-product-${index}`}>Producto</label>
                  <select id={`item-product-${index}`} {...register(`items.${index}.productId`, { required: true })}>
                    <option value="">Producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.internalCode})</option>
                    ))}
                    {canManageData && <option value={NEW_PRODUCT}>+ Nuevo producto...</option>}
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

                {isNewProduct && (
                  <div className="inline-customer-form field-full">
                    <div className="field">
                      <label htmlFor={`new-product-code-${index}`}>Código interno</label>
                      <input
                        id={`new-product-code-${index}`}
                        placeholder="Ej: P001"
                        {...register(`items.${index}.newProduct.internalCode`)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`new-product-name-${index}`}>Nombre</label>
                      <input
                        id={`new-product-name-${index}`}
                        placeholder="Ej: Cerveza IPA 500ml"
                        {...register(`items.${index}.newProduct.name`)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`new-product-price-${index}`}>Precio de venta</label>
                      <input
                        id={`new-product-price-${index}`}
                        type="number"
                        step="0.01"
                        placeholder="Ej: 1500"
                        {...register(`items.${index}.newProduct.price`)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`new-product-vat-${index}`}>Alícuota de IVA (%)</label>
                      <input
                        id={`new-product-vat-${index}`}
                        type="number"
                        step="0.01"
                        placeholder="Ej: 21"
                        {...register(`items.${index}.newProduct.vatRate`)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor={`new-product-unit-${index}`}>Unidad de comercialización</label>
                      <select id={`new-product-unit-${index}`} {...register(`items.${index}.newProduct.unitType`)}>
                        <option value="unit">Por unidad</option>
                        <option value="weight">Por peso</option>
                      </select>
                    </div>
                    <div className="field field-full stock-warning">
                      <span>
                        El costo del producto será el "Costo unitario" de esta fila. Se crea con stock 0 y la
                        compra le suma las {rowQuantity} unidades.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" onClick={() => append(emptyItem())}>
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