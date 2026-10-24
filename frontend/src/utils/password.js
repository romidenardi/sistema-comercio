// Mismas reglas que el servidor (backend/src/utils/password.js): mínimo 8 caracteres y máximo
// 72 bytes (límite de bcrypt; con tildes o emojis, cada carácter puede ocupar más de un byte).
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72;

// Devuelve el mensaje de error, o null si la contraseña cumple
export const passwordProblem = (password) => {
  const value = String(password ?? '');
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }
  if (new TextEncoder().encode(value).length > MAX_PASSWORD_BYTES) {
    return 'La contraseña es demasiado larga (máximo 72 caracteres, menos si usa tildes o emojis)';
  }
  return null;
};

// Para react-hook-form: validate: validatePassword (o validateOptionalPassword si puede quedar vacía)
export const validatePassword = (value) => passwordProblem(value) || true;
export const validateOptionalPassword = (value) => (!value ? true : passwordProblem(value) || true);
