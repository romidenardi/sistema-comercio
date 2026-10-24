import { useCallback, useEffect, useRef, useState } from 'react';

// Avisos en el lugar donde ocurrió la acción (junto al botón, en la fila de la tabla), en lugar de
// avisos flotantes. Cada aviso tiene una "clave" que dice dónde se muestra: 'create', 'edit', 'list'
// o el id de una fila. Los éxitos se van solos a los pocos segundos; los errores quedan hasta que se
// cierran o se hace otra acción.
const SUCCESS_MS = 4000;

export const useMessage = () => {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);

  const clear = useCallback(() => {
    clearTimeout(timer.current);
    setMessage(null);
  }, []);

  const error = useCallback((text, key = 'form') => {
    clearTimeout(timer.current);
    setMessage(text ? { type: 'error', text, key } : null);
  }, []);

  const success = useCallback((text, key = 'form') => {
    clearTimeout(timer.current);
    setMessage({ type: 'success', text, key });
    timer.current = setTimeout(() => setMessage(null), SUCCESS_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // El aviso de una clave, o null si el aviso actual es de otro lugar
  const at = useCallback((key = 'form') => (message && message.key === key ? message : null), [message]);

  return { message, at, error, success, clear };
};
