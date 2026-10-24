// Aviso que se muestra en el lugar de la acción: verde para lo que salió bien, rojo para los errores.
// Los errores tienen un botón para cerrarlos.
const FormMessage = ({ message, onClose }) => {
  if (!message) return null;
  const isError = message.type === 'error';
  return (
    <div className={`form-message form-message-${message.type}`} role={isError ? 'alert' : 'status'}>
      <span>{message.text}</span>
      {isError && onClose && (
        <button type="button" className="form-message-close" aria-label="Cerrar aviso" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

export default FormMessage;
