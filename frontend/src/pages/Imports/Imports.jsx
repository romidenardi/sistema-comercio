import { useState } from 'react';
import { importProducts, importCustomers, importSuppliers } from '../../api/imports.api.js';
import FormMessage from '../../components/common/FormMessage.jsx';
import { useMessage } from '../../hooks/useMessage.js';
import { serverMessage } from '../../utils/serverErrors.js';

const IMPORT_TYPES = [
  { key: 'products', label: 'Productos', fn: importProducts, columns: 'Código Interno, Nombre, Marca, Categoría, Precio, Costo, Unidad (unidad/peso), PLU Balanza (opcional, solo para productos por peso). En productos por peso, Precio y Costo son por kg' },
  { key: 'customers', label: 'Clientes', fn: importCustomers, columns: 'Razón Social o Nombre/Apellido, Condición Fiscal, CUIT, Localidad, Provincia, Teléfono, Email' },
  { key: 'suppliers', label: 'Proveedores', fn: importSuppliers, columns: 'Nombre, CUIT, Contacto, Teléfono, Email, Localidad, Provincia' },
];

const Imports = () => {
  const [selectedType, setSelectedType] = useState('products');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const msg = useMessage();

  const current = IMPORT_TYPES.find((t) => t.key === selectedType);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      msg.error('Elegí un archivo primero');
      return;
    }
    msg.clear();
    setUploading(true);
    setResult(null);
    try {
      const { data } = await current.fn(file);
      setResult(data);
      msg.success(`${data.created} filas importadas${data.errors.length ? `, ${data.errors.length} con errores (detalle abajo)` : ''}`);
      setFile(null);
    } catch (err) {
      msg.error(serverMessage(err, 'Error al importar el archivo'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="imports-page">
      <h1>Importar desde Excel / CSV</h1>

      <form onSubmit={onSubmit} className="import-form">
        <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setResult(null); }}>
          {IMPORT_TYPES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>

        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => { setFile(e.target.files[0]); msg.clear(); }}
        />

        <button type="submit" disabled={uploading}>
          {uploading ? 'Importando...' : 'Importar'}
        </button>
      </form>
      <FormMessage message={msg.message} onClose={msg.clear} />

      <p className="import-hint">
        Columnas esperadas para <strong>{current.label}</strong>: {current.columns}
      </p>
      <p className="import-hint">
        Archivos .xlsx, .xls o .csv de hasta 5 MB y 5.000 filas. Se lee solo la primera hoja.
      </p>

      {result && (
        <div className="import-result">
          <p className="import-success">{result.created} filas importadas correctamente.</p>
          {result.errors.length > 0 && (
            <>
              <p className="import-error-title">{result.errors.length} filas con errores:</p>
              <table>
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={i}>
                      <td>{err.row}</td>
                      <td>{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Imports;