# Sistema de stock y clientes — Backend

API REST para administrar stock, clientes, productos, compras, remitos y facturación de pequeños comercios. Pensado como single-tenant hoy, con el modelo de datos preparado para escalar a multi-tenant más adelante.

## Stack

- Node.js + Express (patrón MVC)
- Sequelize + MySQL
- Autenticación con JWT y sistema de roles (admin / editor / operador)
- Validación con express-validator
- Importación de productos, clientes y proveedores desde Excel (multer + xlsx)

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
- `JWT_SECRET`: cualquier string largo y aleatorio, usado para firmar los tokens de sesión (duran 8hs).
- `BUSINESS_ID_DEFAULT`: se completa después del primer arranque (ver abajo).

## Cómo levantar el proyecto

```bash
npm run dev
```

En el primer arranque, si no existe ningún comercio en la base, el sistema crea uno automáticamente y muestra su `id` en consola. Copiá ese valor a `BUSINESS_ID_DEFAULT` en tu `.env` y reiniciá el servidor.

Al conectar correctamente vas a ver en consola:
Conexión a MySQL exitosa
Servidor corriendo en puerto 3000


⚠️ Cuando cambiás un modelo que ya tiene columnas en una base con datos reales, Sequelize no las migra solo — hay que correr un `ALTER TABLE` manual en MySQL. Si no estás segura de si un cambio lo necesita, preguntame antes de deployar.

## Autenticación y roles

Todos los endpoints, salvo `/api/auth/*`, requieren un token JWT.

1. Registrar el primer usuario del comercio: `POST /api/auth/register` → se crea automáticamente como **admin**. Una vez que existe un admin, este endpoint queda cerrado (403); los usuarios siguientes se crean desde `/api/users`.
2. Loguearse: `POST /api/auth/login` → devuelve `{ token, user: { id, name, email, role } }`
3. Enviar el token en cada request protegido: header `Authorization: Bearer <token>`

Hay tres roles:

| Rol | Puede |
|---|---|
| `admin` | Todo, incluida la gestión de usuarios |
| `editor` | Todo excepto gestión de usuarios |
| `operador` | Solo cargar Compras y Remitos (puede leer productos/clientes/proveedores/formas de pago para completar esos formularios) |

## Endpoints

| Recurso | Método | Ruta |
|---|---|---|
| Auth | POST | `/api/auth/register` `/api/auth/login` |
| Usuarios (solo admin) | GET / POST / PUT / DELETE | `/api/users` `/api/users/:id` |
| Categorías | GET / POST / PUT / DELETE | `/api/categories` `/api/categories/:id` |
| Productos | GET / POST / PUT / DELETE | `/api/products` `/api/products/:id` |
| Productos | GET | `/api/products/barcode/:barcode` |
| Formas de pago (con planes de cuotas anidados) | GET / POST / PUT / DELETE | `/api/payments` `/api/payments/:id` |
| Clientes | GET / POST / PUT / DELETE | `/api/customers` `/api/customers/:id` |
| Proveedores | GET / POST / PUT / DELETE | `/api/suppliers` `/api/suppliers/:id` |
| Compras | GET / POST | `/api/purchases` |
| Remitos | GET / POST | `/api/orders` `/api/orders/:id` |
| Movimientos de stock | GET | `/api/stock-movements/product/:productId` |
| Movimientos de stock | POST | `/api/stock-movements` |
| Importación (Excel) | POST | `/api/imports/products` `/api/imports/customers` `/api/imports/suppliers` |

## Estructura de carpetas

src/
├── config/ # conexión a la base de datos
├── models/ # definiciones de Sequelize y asociaciones
├── controllers/ # lógica de cada endpoint
├── routes/ # mapeo de URLs a controllers
├── middlewares/ # auth, roles, validación, manejo de errores
├── services/ # lógica de negocio compleja (importación de archivos)
└── utils/ # helpers reutilizables


## Scripts

- `npm run dev` — levanta el servidor con recarga automática (nodemon)
- `npm start` — levanta el servidor en modo producción

## Notas de diseño

- Cada tabla de negocio incluye `businessId`, preparando el modelo para multi-tenant sin necesitar un refactor grande más adelante. Toda query queda filtrada por el `businessId` del usuario logueado.
- `Category` se auto-referencia (`parentId`) para resolver categorías y subcategorías con una sola tabla.
- El `stock` de un producto es un valor cacheado que se actualiza con cada movimiento registrado en `StockMovement` — el historial completo queda auditado. Generar un remito corre dentro de una transacción de Sequelize: si algo falla, no queda stock descontado sin el remito creado.
- Un remito calcula, en este orden: subtotal de ítems → descuento (% y/o monto fijo) → si el cliente es **Responsable Inscripto**, discrimina IVA sobre el total ya descontado → si se eligió un plan de cuotas, calcula el total financiado con el interés de ese plan.
- Las formas de pago pueden tener uno o varios planes de cuotas (cantidad de cuotas + % de interés), cargados como una tabla relacionada (`InstallmentPlan`).
- La importación de Excel normaliza los encabezados (sin importar mayúsculas, acentos o espacios) antes de mapear cada fila.

## Pendiente / próximas etapas

- Integración con ARCA (facturación electrónica)
- Estadísticas de ventas