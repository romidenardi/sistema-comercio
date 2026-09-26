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
  const displayCustomer = (order) =>
    order.Customer ? customerLabel(order.Customer) : '—';

  if (loading) return <Spinner label="Cargando remitos..." />;

  return (
    <div className="orders-page">
      <h1>Remitos / Pedidos</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="order-form">
        <select {...register('customerId', { required: true })}>
          <option value="">Elegí un cliente...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{customerLabel(c)}</option>
          ))}
          <option value={NEW_CUSTOMER}>+ Nuevo cliente...</option>
        </select>

        {isNewCustomer && (
          <div className="inline-customer-form">
            <input placeholder="Razón social (si es empresa)" {...register('newCustomer.businessName')} />
            <input placeholder="Nombre" {...register('newCustomer.firstName')} />
            <input placeholder="Apellido" {...register('newCustomer.lastName')} />
            <select {...register('newCustomer.fiscalCondition')}>
              <option value="">Condición fiscal...</option>
              {FISCAL_CONDITIONS.map((fc) => (
                <option key={fc} value={fc}>{fc}</option>
              ))}
            </select>
          </div>
        )}

        <select {...register('paymentId', { required: true })}>
          <option value="">Forma de pago...</option>
          {payments.filter((p) => p.active).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <input placeholder="Notas (opcional)" {...register('notes')} />

        <div className="purchase-items">
          <div className="purchase-item-header">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Precio unitario</span>
            <span></span>
          </div>
          {fields.map((field, index) => (
            <div key={field.id} className="purchase-item-row">
              <select
                {...register(`items.${index}.productId`, { required: true })}
                onChange={(e) => onProductChange(index, e.target.value)}
              >
                <option value="">Producto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="0"
                {...register(`items.${index}.quantity`, { required: true, min: 1 })}
              />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register(`items.${index}.unitPrice`, { required: true, min: 0 })}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                style={{ visibility: fields.length === 1 ? 'hidden' : 'visible' }}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}>
          + Agregar producto
        </button>

        <div className="purchase-total">Total: ${total.toFixed(2)}</div>

        <button type="submit">Generar remito</button>
      </form>

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
              <td>{new Date(order.date).toLocaleDateString('es-AR')}</td>
              <td>{displayCustomer(order)}</td>
              <td>{order.Payment?.name || '—'}</td>
              <td>${Number(order.total).toFixed(2)}</td>
              <td>
                <Link to={`/orders/${order.id}/print`}>
                  <button type="button">Ver / Imprimir</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;