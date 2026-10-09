import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { getOrders, createOrder } from '../../api/orders.api.js';
import { getCustomers, createCustomer } from '../../api/customers.api.js';
import { getPayments } from '../../api/payments.api.js';
import { getProducts, createProduct } from '../../api/products.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const NEW_CUSTOMER = '__new__';
const NEW_PRODUCT = '__new_product__';
const FISCAL_CONDITIONS = ['Consumidor Final', 'Responsable Inscripto', 'Monotributista', 'Exento'];
const FISCAL_CONDITIONS_WITH_VAT_BREAKDOWN = ['Responsable Inscripto'];

const emptyItem = () => ({
  productId: '',
  quantity: 1,
  unitPrice: 0,
  addStock: false,
  newProduct: { internalCode: '', name: '', cost: '', vatRate: 21, unitType: 'unit' },
});

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { role } = useAuth();
  const canManageData = role === 'admin' || role === 'editor';

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      customerId: '',
      paymentId: '',
      installmentPlanId: '',
      discountPercent: 0,
      discountAmount: 0,
      notes: '',
      newCustomer: { firstName: '', lastName: '', businessName: '', fiscalCondition: '' },
      items: [emptyItem()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const selectedCustomerId = watch('customerId');
  const isNewCustomer = selectedCustomerId === NEW_CUSTOMER;
  const newCustomerFiscalCondition = watch('newCustomer.fiscalCondition');
  const selectedPaymentId = watch('paymentId');
  const selectedInstallmentPlanId = watch('installmentPlanId');
  const watchedDiscountPercent = watch('discountPercent');
  const watchedDiscountAmount = watch('discountAmount');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, paymentsRes, productsRes] = await Promise.all([
        getOrders(),
        getCustomers(),
        getPayments(),
        getProducts(),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setPayments(paymentsRes.data);
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

  // Al cambiar la forma de pago, reseteo el plan de cuotas elegido
  useEffect(() => {
    setValue('installmentPlanId', '');
  }, [selectedPaymentId, setValue]);

  // Cantidad total pedida por producto (un mismo producto puede estar en varias filas)
  const requestedByProduct = (watchedItems || []).reduce((acc, item) => {
    if (item.productId && item.productId !== NEW_PRODUCT) {
      acc[item.productId] = (acc[item.productId] || 0) + (Number(item.quantity) || 0);
    }
    return acc;
  }, {});

  const getShortfall = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    return Math.max((requestedByProduct[productId] || 0) - Number(product.stock), 0);
  };

  // Importe bruto (antes de descuento), neto e IVA, calculados por ítem según el IVA de cada producto
  const { grossSubtotal, grossVat, grossTotal } = (watchedItems || []).reduce((acc, item) => {
    const vatRate = item.productId === NEW_PRODUCT
      ? (item.newProduct?.vatRate === '' ? 0 : Number(item.newProduct?.vatRate) || 0)
      : Number(products.find((p) => p.id === item.productId)?.vatRate) || 0;
    const itemTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    const itemNet = vatRate > 0 ? itemTotal / (1 + vatRate / 100) : itemTotal;
    const itemVat = itemTotal - itemNet;
    return {
      grossSubtotal: acc.grossSubtotal + itemNet,
      grossVat: acc.grossVat + itemVat,
      grossTotal: acc.grossTotal + itemTotal,
    };
  }, { grossSubtotal: 0, grossVat: 0, grossTotal: 0 });

  const discountPercent = Number(watchedDiscountPercent) || 0;
  const discountAmount = Number(watchedDiscountAmount) || 0;
  const percentDiscountValue = grossTotal * (discountPercent / 100);
  const totalDiscount = percentDiscountValue + discountAmount;
  const hasDiscount = totalDiscount > 0;
  const discountExceedsTotal = totalDiscount > grossTotal;
  const total = Math.max(grossTotal - totalDiscount, 0);
  const scale = grossTotal > 0 ? total / grossTotal : 1;
  const subtotal = grossSubtotal * scale;
  const vatAmount = grossVat * scale;

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const fiscalConditionForCalc = isNewCustomer ? newCustomerFiscalCondition : selectedCustomer?.fiscalCondition;
  const discriminatesVat = FISCAL_CONDITIONS_WITH_VAT_BREAKDOWN.includes(fiscalConditionForCalc);

  const selectedPayment = payments.find((p) => p.id === selectedPaymentId);
  const availablePlans = selectedPayment?.installmentPlans || [];
  const selectedPlan = availablePlans.find((p) => p.id === selectedInstallmentPlanId);
  const totalFinanced = selectedPlan ? total * (1 + Number(selectedPlan.interestRate) / 100) : total;
  const installmentAmount = selectedPlan ? totalFinanced / selectedPlan.installments : null;

  const onProductChange = (index, productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`items.${index}.unitPrice`, Number(product.price));
    }
    setValue(`items.${index}.addStock`, false);
  };

  const onSubmit = async (formData) => {
    if (discountExceedsTotal) {
      showToast('El descuento no puede ser mayor al total del remito', 'error');
      return;
    }

    try {
      // 1) Valido todo lo nuevo antes de crear nada
      if (isNewCustomer) {
        const { businessName, firstName, fiscalCondition } = formData.newCustomer;
        if (!fiscalCondition || (!businessName && !firstName)) {
          showToast('Completá los datos del cliente nuevo', 'error');
          return;
        }
      }

      for (const item of formData.items) {
        if (item.productId === NEW_PRODUCT) {
          const np = item.newProduct || {};
          if (!np.internalCode || !np.name || np.cost === '' || np.cost === undefined) {
            showToast('Completá código interno, nombre y costo del producto nuevo', 'error');
            return;
          }
          if (!(Number(item.unitPrice) > 0)) {
            showToast('Cargá el precio unitario del producto nuevo', 'error');
            return;
          }
        }
      }

      // 2) Cliente nuevo
      let customerId = formData.customerId;
      if (isNewCustomer) {
        const { businessName, firstName, lastName, fiscalCondition } = formData.newCustomer;
        const { data: newCustomer } = await createCustomer({
          businessName: businessName || null,
          firstName: businessName ? null : firstName,
          lastName: businessName ? null : lastName,
          fiscalCondition,
        });
        customerId = newCustomer.id;
        // Si el remito falla más adelante, el cliente queda elegido y no se vuelve a crear
        setCustomers((prev) => [...prev, newCustomer]);
        setValue('customerId', newCustomer.id);
      }

      // 3) Productos nuevos (se crean con stock 0 y se les carga la cantidad del remito)
      const payloadItems = [];
      for (let i = 0; i < formData.items.length; i += 1) {
        const item = formData.items[i];
        let productId = item.productId;
        let addStock = Boolean(item.addStock);

        if (productId === NEW_PRODUCT) {
          const np = item.newProduct;
          const { data: createdProduct } = await createProduct({
            internalCode: np.internalCode,
            name: np.name,
            price: Number(item.unitPrice),
            cost: Number(np.cost),
            vatRate: np.vatRate === '' || np.vatRate === undefined ? 21 : Number(np.vatRate),
            unitType: np.unitType || 'unit',
          });
          productId = createdProduct.id;
          addStock = true;
          // Si el remito falla más adelante, el producto queda elegido y no se vuelve a crear
          setProducts((prev) => [...prev, createdProduct]);
          setValue(`items.${i}.productId`, createdProduct.id);
          setValue(`items.${i}.addStock`, true);
        }

        payloadItems.push({
          productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          addStock,
        });
      }

      // 4) Remito
      const payload = {
        customerId,
        paymentId: formData.paymentId,
        installmentPlanId: formData.installmentPlanId || null,
        discountPercent: Number(formData.discountPercent) || 0,
        discountAmount: Number(formData.discountAmount) || 0,
        notes: formData.notes || null,
        items: payloadItems,
      };

      await createOrder(payload);
      showToast('Remito generado, stock actualizado');
      reset({
        customerId: '',
        paymentId: '',
        installmentPlanId: '',
        discountPercent: 0,
        discountAmount: 0,
        notes: '',
        newCustomer: { firstName: '', lastName: '', businessName: '', fiscalCondition: '' },
        items: [emptyItem()],
      });
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al generar el remito', 'error');
    }
  };

  const customerLabel = (c) => c.businessName || `${c.firstName} ${c.lastName || ''}`.trim();
  const displayCustomer = (order) => (order.Customer ? customerLabel(order.Customer) : '—');

  if (loading) return <Spinner label="Cargando remitos..." />;

  return (
    <div className="orders-page">
      <h1>Remitos / Pedidos</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="order-form">
        <div className="field">
          <label htmlFor="customerId">Cliente</label>
          <select id="customerId" {...register('customerId', { required: true })}>
            <option value="">Elegí un cliente...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{customerLabel(c)}</option>
            ))}
            {canManageData && <option value={NEW_CUSTOMER}>+ Nuevo cliente...</option>}
          </select>
        </div>

        {isNewCustomer && (
          <div className="inline-customer-form">
            <div className="field">
              <label htmlFor="newCustomerBusinessName">Razón social (si es empresa)</label>
              <input id="newCustomerBusinessName" placeholder="Ej: Distribuidora del Sur SA" {...register('newCustomer.businessName')} />
            </div>
            <div className="field">
              <label htmlFor="newCustomerFirstName">Nombre</label>
              <input id="newCustomerFirstName" placeholder="Ej: Juan" {...register('newCustomer.firstName')} />
            </div>
            <div className="field">
              <label htmlFor="newCustomerLastName">Apellido</label>
              <input id="newCustomerLastName" placeholder="Ej: Pérez" {...register('newCustomer.lastName')} />
            </div>
            <div className="field">
              <label htmlFor="newCustomerFiscalCondition">Condición fiscal</label>
              <select id="newCustomerFiscalCondition" {...register('newCustomer.fiscalCondition')}>
                <option value="">Condición fiscal...</option>
                {FISCAL_CONDITIONS.map((fc) => (
                  <option key={fc} value={fc}>{fc}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="paymentId">Forma de pago</label>
          <select id="paymentId" {...register('paymentId', { required: true })}>
            <option value="">Forma de pago...</option>
            {payments.filter((p) => p.active).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {availablePlans.length > 0 && (
          <div className="field">
            <label htmlFor="installmentPlanId">Plan de cuotas</label>
            <select id="installmentPlanId" {...register('installmentPlanId')}>
              <option value="">Pago único (sin financiación)</option>
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.installments} cuotas {Number(plan.interestRate) > 0 ? `(+${plan.interestRate}% interés)` : '(sin interés)'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="inline-customer-form">
          <div className="field">
            <label htmlFor="discountPercent">Descuento (%)</label>
            <input
              id="discountPercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ej: 10"
              {...register('discountPercent')}
            />
          </div>
          <div className="field">
            <label htmlFor="discountAmount">Descuento fijo / bono ($)</label>
            <input
              id="discountAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 500"
              {...register('discountAmount')}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="notes">Notas (opcional)</label>
          <input id="notes" placeholder="Ej: Entregar antes del viernes" {...register('notes')} />
        </div>

        <div className="purchase-items">
          {fields.map((field, index) => {
            const rowProductId = watchedItems?.[index]?.productId;
            const isNewProduct = rowProductId === NEW_PRODUCT;
            const shortfall = rowProductId && !isNewProduct ? getShortfall(rowProductId) : 0;
            const rowProduct = products.find((p) => p.id === rowProductId);
            const rowQuantity = Number(watchedItems?.[index]?.quantity) || 0;
            const productField = register(`items.${index}.productId`, { required: true });

            return (
              <div key={field.id} className="purchase-item-row">
                <div className="field">
                  <label htmlFor={`order-item-product-${index}`}>Producto</label>
                  <select
                    id={`order-item-product-${index}`}
                    {...productField}
                    onChange={(e) => {
                      productField.onChange(e);
                      onProductChange(index, e.target.value);
                    }}
                  >
                    <option value="">Producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
                    ))}
                    {canManageData && <option value={NEW_PRODUCT}>+ Nuevo producto...</option>}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`order-item-quantity-${index}`}>Cantidad</label>
                  <input
                    id={`order-item-quantity-${index}`}
                    type="number"
                    placeholder="Ej: 2"
                    {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`order-item-price-${index}`}>Precio unitario</label>
                  <input
                    id={`order-item-price-${index}`}
                    type="number"
                    step="0.01"
                    placeholder="Ej: 1500"
                    {...register(`items.${index}.unitPrice`, { required: true, min: 0 })}
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
                      <label htmlFor={`new-product-cost-${index}`}>Costo</label>
                      <input
                        id={`new-product-cost-${index}`}
                        type="number"
                        step="0.01"
                        placeholder="Ej: 900"
                        {...register(`items.${index}.newProduct.cost`)}
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
                        El precio del producto será el "Precio unitario" de esta fila. Se crea con stock 0 y,
                        al generar el remito, se cargan al stock las {rowQuantity} unidades de esta fila.
                      </span>
                    </div>
                  </div>
                )}

                {shortfall > 0 && (
                  <div className="field field-full stock-warning">
                    <span>
                      Stock insuficiente en {rowProduct?.name}: disponible {Number(rowProduct?.stock)}, faltan {shortfall}.
                    </span>
                    {canManageData ? (
                      <label className="stock-warning-label">
                        <input type="checkbox" {...register(`items.${index}.addStock`)} />
                        Cargar al stock las {shortfall} unidades que faltan al generar el remito
                      </label>
                    ) : (
                      <span>Pedile a un editor o administrador que cargue stock.</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button type="button" onClick={() => append(emptyItem())}>
          + Agregar producto
        </button>

        <div className="purchase-total">
          {(discriminatesVat || hasDiscount) && (
            <div>Importe: ${grossTotal.toFixed(2)}</div>
          )}
          {hasDiscount && (
            <div>Descuento: -${totalDiscount.toFixed(2)}</div>
          )}
          {discriminatesVat ? (
            <>
              <div>Subtotal: ${subtotal.toFixed(2)}</div>
              <div>IVA: ${vatAmount.toFixed(2)}</div>
              <div>Total: ${total.toFixed(2)}</div>
            </>
          ) : (
            <div>Total: ${total.toFixed(2)}</div>
          )}
          {discountExceedsTotal && (
            <div className="error">El descuento no puede ser mayor al total</div>
          )}

          {selectedPlan && (
            <>
              <div>Cantidad de cuotas: {selectedPlan.installments}</div>
              <div>Monto de cada cuota: ${installmentAmount.toFixed(2)}</div>
              <div>Precio total financiado: ${totalFinanced.toFixed(2)}</div>
            </>
          )}
        </div>

        <button type="submit" disabled={discountExceedsTotal}>Generar remito</button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Forma de pago</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td data-label="Fecha">{new Date(order.date).toLocaleDateString('es-AR')}</td>
                <td data-label="Cliente">{displayCustomer(order)}</td>
                <td data-label="Forma de pago">{order.Payment?.name || '—'}</td>
                <td data-label="Total">${Number(order.totalFinanced || order.total).toFixed(2)}</td>
                <td data-label="Acciones">
                  <Link to={`/orders/${order.id}/print`}>
                    <button type="button">Ver / Imprimir</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;