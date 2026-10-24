// El mensaje que manda el servidor, o uno genérico
export const serverMessage = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || fallback;

// Pone debajo de cada campo los errores de validación del servidor (express-validator manda el
// nombre del campo en "path"). "fields" son los campos que muestran su error en pantalla.
// Devuelve true si TODOS los errores quedaron debajo de un campo; si alguno no tiene dónde
// mostrarse, devuelve false para que la pantalla muestre el mensaje junto al botón.
export const applyServerFieldErrors = (err, setError, fields) => {
  const list = err?.response?.data?.errors;
  if (!Array.isArray(list) || list.length === 0) return false;
  let allShown = true;
  for (const item of list) {
    if (item?.path && fields.includes(item.path)) {
      setError(item.path, { type: 'server', message: item.msg });
    } else {
      allShown = false;
    }
  }
  return allShown;
};

// Algunos errores del servidor hablan de un campo concreto (por ejemplo "Ese código de barras ya
// está asignado"). Devuelve el campo cuyo patrón coincide con el mensaje, o null.
export const fieldFromMessage = (text, patterns) =>
  Object.entries(patterns).find(([, pattern]) => pattern.test(text || ''))?.[0] || null;
