# Sistema de stock y clientes — Backend

API REST para administrar stock, clientes, productos y facturación de pequeños comercios. Pensado como single-tenant hoy, con el modelo de datos preparado para escalar a multi-tenant más adelante.

## Stack

- Node.js + Express (patrón MVC)
- Sequelize + MySQL
- Autenticación con JWT
- Validación con express-validator

## Requisitos previos

- Node.js 18 o superior
- MySQL 8 (local, Docker, o un proveedor en la nube)

## Instalación

```bash
cd backend
npm install
```

## Variables de entorno

Copiá `.env.example` a `.env` y completá con tus datos:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=sistema_comercio
DB_USER=root
DB_PASSWORD=
JWT_SECRET=
PORT=3000
BUSINESS_ID_DEFAULT=
```

- `DB_*`: credenciales de conexión a MySQL.
- `JWT_SECRET`: cualquier string largo y aleatorio, usado para firmar los tokens de sesión.
- `BUSINESS_ID_DEFAULT`: se completa después del primer arranque (ver abajo).

## Cómo levantar el proyecto

```bash
npm run dev
```

En el primer arranque, si no existe ningún comercio en la base, el sistema crea uno automáticamente y muestra su `id` en consola. Copiá ese valor a `BUSINESS_ID_DEFAULT` en tu `.env` y reiniciá el servidor.

Al conectar correctamente vas a ver en consola:
```
Conexión a MySQL exitosa
Servidor corriendo en puerto 3000
```

## Autenticación

Todos los endpoints, salvo `/api/auth/*`, requieren un token JWT.

1. Registrar un usuario: `POST /api/auth/register`
2. Loguearse: `POST /api/auth/login` → devuelve `{ token }`
3. Enviar el token en cada request protegido: header `Authorization: Bearer <token>`

## Endpoints

| Recurso | Método | Ruta |
|---|---|---|
| Auth | POST | `/api/auth/register` |
| Auth | POST | `/api/auth/login` |
| Categorías | GET / POST / PUT / DELETE | `/api/categories` `/api/categories/:id` |
| Productos | GET / POST / PUT / DELETE | `/api/products` `/api/products/:id` |
| Productos | GET | `/api/products/barcode/:barcode` |
| Formas de pago | GET / POST / PUT / DELETE | `/api/payments` `/api/payments/:id` |
| Clientes | GET / POST / PUT / DELETE | `/api/customers` `/api/customers/:id` |
| Movimientos de stock | GET | `/api/stock-movements/product/:productId` |
| Movimientos de stock | POST | `/api/stock-movements` |

## Estructura de carpetas

```
src/
├── config/         # conexión a la base de datos
├── models/         # definiciones de Sequelize y asociaciones
├── controllers/     # lógica de cada endpoint
├── routes/         # mapeo de URLs a controllers
├── middlewares/     # auth, validación, manejo de errores
├── services/       # lógica de negocio compleja (a futuro)
└── utils/          # helpers reutilizables
```

## Scripts

- `npm run dev` — levanta el servidor con recarga automática (nodemon)
- `npm start` — levanta el servidor en modo producción

## Notas de diseño

- Cada tabla de negocio incluye `businessId`, preparando el modelo para multi-tenant sin necesitar un refactor grande más adelante.
- `Category` se auto-referencia (`parentId`) para resolver categorías y subcategorías con una sola tabla.
- El `stock` de un producto es un valor cacheado que se actualiza con cada movimiento registrado en `StockMovement` — el historial completo queda auditado.

## Pendiente / próximas etapas

- Integración con ARCA (facturación electrónica)
- Estadísticas de ventas