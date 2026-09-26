import { useState } from 'react';
import { importProducts, importCustomers, importSuppliers } from '../../api/imports.api.js';
import { useToast } from '../../context/ToastContext.jsx';

const IMPORT_TYPES = [
  { key: 'products', label: 'Productos', fn: importProducts, columns: 'Código Interno, Nombre, Marca, Categoría, Precio, Costo, Unidad (unidad/peso)' },
  { key: 'customers', label: 'Clientes', fn: importCustomers, columns: 'Razón Social o Nombre/Apellido, Condición Fiscal, CUIT, Localidad, Provincia, Teléfono, Email' },
  { key: 'suppliers', label: 'Proveedores', fn: importSuppliers, columns: 'Nombre, CUIT, Contacto, Teléfono, Email, Localidad, Provincia' },
];

const Imports = () => {
  const [selectedType, setSelectedType] = useState('products');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const { showToast } = useToast();

  const current = IMPORT_TYPES.find((t) => t.key === selectedType);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Elegí un archivo primero', 'error');
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const { data } = await current.fn(file);
      setResult(data);
      showToast(`${data.created} filas importadas${data.errors.length ? `, ${data.errors.length} con errores` : ''}`);
      setFile(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al importar el archivo', 'error');
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
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button type="submit" disabled={uploading}>
          {uploading ? 'Importando...' : 'Importar'}
        </button>
      </form>

      <p className="import-hint">
        Columnas esperadas para <strong>{current.label}</strong>: {current.columns}
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