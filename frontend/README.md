# Sistema de stock y clientes — Frontend

Interfaz web para administrar stock, clientes, productos, compras, remitos y formas de pago de pequeños comercios. Consume la API del backend de este mismo sistema.

## Stack

- React + Vite
- React Router v6 (rutas protegidas por rol)
- react-hook-form (formularios y listas dinámicas)
- Axios (con interceptor de sesión vencida)
- CSS propio, responsive (sin librería de componentes)

## Requisitos previos

- Node.js 18 o superior
- El backend de este sistema corriendo (local o deployado)

## Instalación

```bash
cd frontend
npm install
```

## Variables de entorno

Copiá `.env.example` a `.env` (o creá el archivo) y completá:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

En producción (Vercel), esta variable apunta a la URL del backend deployado en Railway.

## Cómo levantar el proyecto

```bash
npm run dev
```

Por defecto corre en `http://localhost:5173`.

## Scripts

- `npm run dev` — levanta el servidor de desarrollo con recarga automática
- `npm run build` — genera el build de producción en `dist/`
- `npm run preview` — sirve el build de producción localmente para probarlo

## Autenticación y roles

- El login guarda `token` y `user` (incluye el rol) en `localStorage`.
- Si el token vence o es inválido, un interceptor de Axios desloguea automáticamente y redirige a `/login`.
- El menú lateral y las rutas se filtran según el rol (`admin`, `editor`, `operador`) — ver `routes/PrivateRoute.jsx` y `components/layout/Layout.jsx`. Esto es solo comodidad visual: la seguridad real está en el backend.

## Estructura de carpetas

src/
├── api/ # funciones que llaman a cada endpoint (axios)
├── components/
│ ├── common/ # Spinner, StockMovementPanel, etc.
│ └── layout/ # Layout.jsx (sidebar + outlet)
├── context/ # AuthContext, ToastContext
├── hooks/ # useResource (CRUD genérico)
├── pages/ # una carpeta por sección (Products, Orders, Payments, etc.)
├── routes/ # AppRoutes.jsx, PrivateRoute.jsx
└── index.css # estilos globales, incluido el responsive


## Notas de diseño

- `useResource` encapsula el ciclo get/create/update/remove para no repetir ese código en cada pantalla de CRUD.
- Las tablas se convierten en "tarjetas" apiladas en mobile (`@media max-width: 640px`) usando el atributo `data-label` en cada celda.
- El remito (`Orders.jsx`) recalcula en vivo, a medida que se completa el formulario, el mismo cálculo que hace el backend al confirmar: subtotal, descuento, IVA discriminado (si corresponde) y cuotas — así el usuario ve el total antes de generar el remito, no después.

## Deploy

Deployado en Vercel, conectado al repo — cada push a la rama principal dispara un build automático.