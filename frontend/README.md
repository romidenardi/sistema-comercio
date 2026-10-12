# Talarix: Frontend

Interfaz web del sistema de gestión para pequeños comercios (stock, clientes, proveedores, compras, remitos, formas de pago, reportes).

**Stack:** React 19, Vite, React Router 7, React Hook Form, Axios. Desplegado en Vercel.

Dominio de producción: `app.talarix.com.ar`.

## Puesta en marcha local
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/ (no se versiona)
npm run preview  # sirve el build localmente
npm run lint     # oxlint
```

## Variables de entorno
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend, incluyendo `/api` (ej. `https://api.talarix.com.ar/api`) |

Las variables de Vite se incorporan **al construir**: si cambian en Vercel, hay que redesplegar.

En Vercel hay una variable por entorno: una para **Production** y otra para **Preview** limitada a la rama `staging`.

## Rutas
| Ruta | Acceso |
|---|---|
| `/login` | pública |
| `/activar?token=...` | pública (activación de cuenta con aceptación de términos) |
| `/olvide-contrasena` | pública (pide el mail para recuperar la contraseña) |
| `/restablecer?token=...` | pública (elegir una contraseña nueva desde el link del mail) |
| `/terminos`, `/privacidad` | públicas |
| `/plataforma/login`, `/plataforma` | superadmin (token aparte, guardado en `sessionStorage`) |
| `/`, `/orders`, `/purchases` | usuarios autenticados |
| `/orders/:id/print` | usuarios autenticados (remito para imprimir) |
| `/reports`, `/categories`, `/payments`, `/customers`, `/products`, `/suppliers`, `/imports` | `admin` y `editor` |
| `/users` | `admin` |

Las rutas están en `src/routes/AppRoutes.jsx`.

## Estructura
```
src/
  api/          cliente HTTP (axios.js) y llamadas por recurso
  context/      AuthContext (sesión, rol, modo demo)
  hooks/        hooks compartidos (p. ej. useResource)
  components/   layout (menú y barra lateral) y componentes compartidos
  pages/        una carpeta por pantalla
  legal/        textos de términos y privacidad (legalContent.js)
  routes/       definición de rutas y rutas privadas
  utils/        ayudas de formato
  index.css     estilos globales y variables de color
```

## Sesión
- Al ingresar se guardan `token` y `user` en `localStorage`.
- `src/api/axios.js` agrega el token a cada pedido y, ante un `401` (salvo en el login), borra la sesión y vuelve a `/login`.
- El token del superadmin se guarda aparte, en `sessionStorage`.

## Funciones a tener en cuenta
- **Códigos de barras:** se pueden cargar y buscar con la **cámara del celular** (librería `html5-qrcode`) o con un **lector USB**, que funciona como teclado: escribe el código y envía Enter. Dentro de los campos de código de barras el Enter está bloqueado para no enviar el formulario por error. La cámara solo funciona con **HTTPS** (en `localhost` también).
- **Usuarios** (solo `admin`): se pueden crear con contraseña asignada, o enviando una **invitación por mail**. Cada usuario tiene un botón para reenviar la invitación o enviar un link de contraseña. Si el mail no sale, se muestra el link para copiarlo.
- **Plataforma:** al crear un comercio o reinvitar, se envía el mail con el link y se muestra además para copiarlo y compartirlo por WhatsApp.
- **Menú en el celular:** se muestra como menú hamburguesa (barra superior con botón, y panel lateral con fondo oscurecido).

## Estilos
Todo el CSS está en `src/index.css`. Los colores y tamaños se definen como variables en `:root` (`--color-primary`, `--color-text`, `--color-border`, `--color-danger`, `--color-success`, `--color-warning`, etc.): **usar siempre las variables**, no colores sueltos.

## Cuenta demo
Si el comercio es de tipo demo, el menú oculta Importar y Usuarios y se muestra un aviso de que no deben cargarse datos reales.

## Textos legales
Se editan en `src/legal/legalContent.js`. Al cambiarlos:
1. Subir `LEGAL_VERSION`.
2. Subir también la misma versión en `backend/src/utils/legal.js`. Si no coinciden, la activación de cuentas falla a propósito.
3. Poner `LEGAL_IS_DRAFT = false` cuando estén validados.

## Despliegue
- Rama `staging` → vista previa de Vercel (URL fija de la rama).
- Rama `main` → producción.
- `vercel.json` redirige todas las rutas a `index.html` (SPA).
- Si se agrega una dependencia, subir `package.json` y `package-lock.json` juntos.

Flujo de trabajo, cambios en la base y variables del servidor: ver el README del backend. Recordá hacer `git add` y `commit` desde la **raíz del repo**.