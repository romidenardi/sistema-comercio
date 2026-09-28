import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { getOrders, createOrder } from '../../api/orders.api.js';
import { getCustomers, createCustomer } from '../../api/customers.api.js';
import { getPayments } from '../../api/payments.api.js';
import { getProducts } from '../../api/products.api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const NEW_CUSTOMER = '__new__';
const FISCAL_CONDITIONS = ['Consumidor Final', 'Responsable Inscripto', 'Monotributista', 'Exento'];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const { register, control, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      customerId: '',
      paymentId: '',
      notes: '',
      newCustomer: { firstName: '', lastName: '', businessName: '', fiscalCondition: '' },
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const selectedCustomerId = watch('customerId');
  const isNewCustomer = selectedCustomerId === NEW_CUSTOMER;

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

  const total = (watchedItems || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const onProductChange = (index, productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`items.${index}.unitPrice`, Number(product.price));
    }
  };

  const onSubmit = async (formData) => {
    try {
      let customerId = formData.customerId;

      if (isNewCustomer) {
        const { businessName, firstName, lastName, fiscalCondition } = formData.newCustomer;
        if (!fiscalCondition || (!businessName && !firstName)) {
          showToast('Completá los datos del cliente nuevo', 'error');
          return;
        }
        const { data: newCustomer } = await createCustomer({
          businessName: businessName || null,
          firstName: businessName ? null : firstName,
          lastName: businessName ? null : lastName,
          fiscalCondition,
        });
        customerId = newCustomer.id;
      }

      const payload = {
        customerId,
        paymentId: formData.paymentId,
        notes: formData.notes || null,
        items: formData.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      await createOrder(payload);
      showToast('Remito generado, stock actualizado');
      reset({
        customerId: '',
        paymentId: '',
        notes: '',
        newCustomer: { firstName: '', lastName: '', businessName: '', fiscalCondition: '' },
        items: [{ productId: '', quantity: 1, unitPrice: 0 }],
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
            <option value={NEW_CUSTOMER}>+ Nuevo cliente...</option>
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

        <div className="field">
          <label htmlFor="notes">Notas (opcional)</label>
          <input id="notes" placeholder="Ej: Entregar antes del viernes" {...register('notes')} />
        </div>

        <div className="purchase-items">
          {fields.map((field, index) => (
            <div key={field.id} className="purchase-item-row">
              <div className="field">
                <label htmlFor={`order-item-product-${index}`}>Producto</label>
                <select
                  id={`order-item-product-${index}`}
                  {...register(`items.${index}.productId`, { required: true })}
                  onChange={(e) => onProductChange(index, e.target.value)}
                >
                  <option value="">Producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
                  ))}
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
            </div>
          ))}
        </div>

        <button type="button" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}>
          + Agregar producto
        </button>

        <div className="purchase-total">Total: ${total.toFixed(2)}</div>

        <button type="submit">Generar remito</button>
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
                <td data-label="Total">${Number(order.total).toFixed(2)}</td>
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