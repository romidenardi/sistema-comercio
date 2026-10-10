# Talarix: Frontend

Interfaz web del sistema de gestión para pequeños comercios.

**Stack:** React, Vite, React Router. Desplegado en Vercel.

## Puesta en marcha local
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ (no se versiona)
```

## Variables de entorno
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend, incluyendo `/api` (ej. `https://api.ejemplo.com/api`) |

Las variables de Vite se incorporan **al construir**: si cambian en Vercel, hay que redesplegar.

En Vercel hay una variable por entorno: una para **Production** y otra para **Preview** limitada a la rama `staging`.

## Rutas
| Ruta | Acceso |
|---|---|
| `/login` | pública |
| `/activar?token=...` | pública (activación de cuenta con aceptación de términos) |
| `/terminos`, `/privacidad` | públicas |
| `/plataforma/login`, `/plataforma` | superadmin (token aparte, guardado en `sessionStorage`) |
| `/orders`, `/purchases` | usuarios autenticados |
| `/categories`, `/payments`, `/customers`, `/products`, `/suppliers`, `/imports` | `admin` y `editor` |
| `/users` | `admin` |

Las rutas están en `src/routes/AppRoutes.jsx`.

## Estructura
```
src/
  api/          clientes HTTP (axios) y llamadas por recurso
  context/      AuthContext (sesión, rol, modo demo)
  components/   layout y componentes compartidos
  pages/        una carpeta por pantalla
  legal/        textos de términos y privacidad (legalContent.js)
  routes/       definición de rutas y rutas privadas
```

## Cuenta demo
Si el comercio es de tipo demo, el menú oculta Importar y Usuarios y se muestra un aviso de que no deben cargarse datos reales.

## Textos legales
Se editan en `src/legal/legalContent.js`. Al cambiarlos:
1. Subir `LEGAL_VERSION`.
2. Subir también la misma versión en `backend/utils/legal.js`. Si no coinciden, la activación de cuentas falla a propósito.
3. Poner `LEGAL_IS_DRAFT = false` cuando estén validados.

## Despliegue
- Rama `staging` → vista previa de Vercel (URL fija de la rama).
- Rama `main` → producción.
- `vercel.json` redirige todas las rutas a `index.html` (SPA).

Flujo de trabajo: ver el README del backend.