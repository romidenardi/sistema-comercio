# Talarix: Backend

API de gestión para pequeños comercios (stock, clientes, proveedores, compras, remitos, formas de pago, cuotas, descuentos e IVA). Multi-comercio: una sola base de datos, con los datos de cada comercio separados por `businessId`.

**Stack:** Node.js, Express 5, Sequelize, MySQL, JWT, Nodemailer. Desplegado en Railway.

## Entornos

| Entorno | Rama | Backend | Frontend |
|---|---|---|---|
| Producción | `main` | Railway (production) | Vercel (production) |
| Staging | `staging` | Railway (staging, base propia) | Vercel (preview de la rama `staging`) |

Dominios de producción: `app.talarix.com.ar` (frontend, Vercel) y `api.talarix.com.ar` (backend, Railway).

Los cambios se prueban primero en `staging` y después se pasan a `main` (ver "Flujo de trabajo").

## Requisitos
- Node.js 20 o superior (Railway usa la versión 24).
- MySQL local, o acceso a una base de desarrollo.

## Puesta en marcha local
```bash
npm install
cp .env.example .env   # si no existe, crear .env con las variables de abajo
npm run dev            # nodemon server.js
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Arranca con recarga automática (nodemon) |
| `npm start` | Arranca para producción (`node server.js`) |

Al iniciar, el servidor valida las variables obligatorias, verifica que `JWT_SECRET` y `PLATFORM_JWT_SECRET` sean distintas, se conecta a MySQL y ejecuta `sequelize.sync()` (ver "Cambios en la base de datos").

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Sí | Conexión a MySQL |
| `JWT_SECRET` | Sí | Firma de los tokens de usuarios (8 h) |
| `PLATFORM_JWT_SECRET` | Sí | Firma de los tokens del superadmin (2 h). Debe ser **distinta** de `JWT_SECRET` |
| `APP_URL` | Sí | URL pública del frontend, sin barra final. Se usa en los links de los mails (activación, restablecer contraseña) |
| `CORS_ORIGIN` | Sí en la práctica | Origen(es) permitido(s) del frontend, separados por coma y sin barra final. Si está vacío, el navegador no puede llamar a la API |
| `PORT` | No | Puerto del servidor (por defecto 3000; Railway lo define solo) |
| `NODE_ENV` | No | `production` en Railway (oculta detalles de errores) |
| `DEMO_RESET_ENABLED` | No | `false` desactiva el reinicio nocturno de la demo (en staging va en `false`) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | No | Envío de mails por SMTP (ver "Mails") |
| `MAIL_SECURE` | No | `true` o `false`. Por defecto es `true` solo con el puerto 465 |

En Railway, los `DB_*` se cargan como referencias a la base del propio entorno, por ejemplo `${{MySQL.MYSQLHOST}}`. Nunca uses los secretos de producción en staging.

## Estructura
```
server.js          arranque: valida variables, conecta, sync y listen
src/
  app.js           Express: middlewares globales y montaje de rutas
  config/          conexión a la base (database.js)
  controllers/     lógica de cada recurso
  routes/          definición de rutas
  models/          modelos Sequelize
  middlewares/     auth, roles, demo, errores
  services/        servicios (p. ej. datos de la cuenta demo)
  jobs/            tareas programadas (reinicio nocturno de la demo)
  utils/           ayudas: asyncHandler, httpError, números, tokens de
                   invitación, versión de términos, mails y links de acceso
scripts/           scripts de operación (crear superadmin)
```

## API

Todas las rutas cuelgan de `/api`. Salvo `auth` y `platform`, exigen token de usuario.

| Ruta | Acceso | Qué hace |
|---|---|---|
| `/auth/login`, `/auth/activate` | pública | Ingreso y activación de cuenta con aceptación de términos |
| `/auth/forgot-password`, `/auth/reset-password` | pública | Recuperar contraseña por mail |
| `/platform/*` | superadmin | Alta de comercios, estado, reinvitar, reiniciar demo |
| `/categories`, `/products`, `/stock-movements` | autenticados | Catálogo y movimientos de stock |
| `/payments`, `/customers`, `/suppliers` | autenticados | Formas de pago (cuotas y descuentos), clientes, proveedores |
| `/purchases`, `/orders` | autenticados | Compras y remitos |
| `/orders/:id/cancel` | `admin`, `editor` | Anula un remito y devuelve el stock |
| `/reports/*` | `admin`, `editor` | Panel de inicio y reportes (ventas, productos, clientes, formas de pago, IVA) |
| `/imports` | `admin`, `editor` | Importación desde Excel (bloqueada en demo) |
| `/users` | `admin` | Usuarios del comercio (bloqueada en demo) |

Detalles que conviene saber:
- Los precios incluyen IVA. `Order.total` es el final, después de descuentos; las cuotas son informativas.
- Los remitos anulados (`status = 'cancelled'`) quedan en el historial y se excluyen de los reportes.
- El código de barras de un producto es opcional y **único por comercio**. Los vacíos se guardan como `NULL`.
- Los errores de unicidad responden `409` con un mensaje en castellano.

## Seguridad y multi-comercio
- Todo recurso se filtra por `req.user.businessId`. El middleware de autenticación revalida en cada request que el usuario esté activo y con contraseña, y que el comercio esté activo.
- Roles: `admin` (todo, incluye usuarios), `editor` (todo, sin usuarios) y `operador` (solo compras y remitos).
- El **superadmin** usa un login y un token aparte (`/api/platform/*`). Ve metadatos de cuentas, nunca contenido de los comercios ni contraseñas.
- Los usuarios se crean de dos maneras: el administrador del comercio les asigna una contraseña, o les manda una **invitación** por mail para que elijan la suya.
- Los links de invitación (vencen a los 7 días) y de restablecer contraseña (vencen a la hora) son de un solo uso. En la base solo se guarda el hash del token.
- La activación exige aceptar los términos y registra versión, fecha e IP de la aceptación.
- "Olvidé mi contraseña" responde siempre lo mismo, exista o no el email; no reenvía más de un mail por minuto y no envía nada a usuarios inactivos, comercios suspendidos ni cuentas demo.
- Protecciones: `helmet`, límite de intentos en login, activación, recuperar y restablecer contraseña, lista de orígenes CORS, validaciones numéricas y de pertenencia entre comercios.
- Cuenta **demo** (`Business.type = 'demo'`): datos de ejemplo, se reinicia todas las noches a las 03:00 (hora de Buenos Aires), con gestión de usuarios e importación bloqueadas.

## Mails

Los mails salen por SMTP con Nodemailer. Hay tres: invitación, aviso de usuario creado (nunca incluye la contraseña) y restablecer contraseña.

```
MAIL_HOST=mail.talarix.com.ar
MAIL_PORT=587
MAIL_USER=no-reply@talarix.com.ar
MAIL_PASS=<contraseña de la casilla>
MAIL_FROM=Talarix <no-reply@talarix.com.ar>
```

- `MAIL_FROM` debe usar la misma casilla que `MAIL_USER`.
- Si las variables `MAIL_*` faltan o el envío falla, el sistema **no se rompe**: avisa que el mail no salió y muestra el link para copiarlo y pasarlo por otro medio.
- Para cambiar de proveedor (Resend, Brevo, etc.) alcanza con cambiar las variables.
- Si el mail cae en spam, revisar SPF y DKIM del dominio (en cPanel: *Email Deliverability*).
- Plantillas: `src/utils/mailTemplates.js`.

## Superadmin
Crear el primer superadmin (apuntando a la base del entorno correspondiente):
```bash
DB_HOST=... DB_PORT=... DB_NAME=... DB_USER=... DB_PASSWORD='...' \
PLATFORM_ADMIN_EMAIL=mail@dominio.com PLATFORM_ADMIN_PASSWORD='...' PLATFORM_ADMIN_NAME='Nombre' \
node scripts/createPlatformAdmin.js
```
Para correrlo contra Railway hay que habilitar temporalmente el TCP Proxy del MySQL y **desactivarlo al terminar**.

## Cambios en la base de datos

`sequelize.sync()` corre en cada arranque. Hace dos cosas:
- **Crea las tablas nuevas** que falten.
- **Agrega los índices declarados en los modelos**, aun en tablas existentes. Si los datos no cumplen el índice (por ejemplo, duplicados en un índice único), **el servidor no arranca y Railway lo reinicia en bucle**.

No modifica columnas existentes: esos cambios se hacen con `ALTER TABLE` manual.

Regla de oro: **todo cambio de base se corre en producción antes de hacer el merge a `main`**.

1. Probar en la base de staging, una sentencia por vez (Railway → MySQL → Data → Query).
2. Si el cambio incluye un índice único, limpiar primero los datos que lo violarían.
3. Correrlo en la base de producción.
4. Recién entonces, hacer el merge a `main`.

### Historial de cambios manuales
Ya aplicados en staging y producción. Una base nueva creada desde cero no los necesita: `sync` crea las tablas con sus columnas actuales.

**Anulación de remitos** (`orders`):
```sql
ALTER TABLE orders ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
ALTER TABLE orders ADD COLUMN cancelled_at DATETIME NULL
ALTER TABLE orders ADD COLUMN cancel_reason VARCHAR(255) NULL
ALTER TABLE orders ADD COLUMN cancelled_by_id CHAR(36) NULL
```

**Código de barras único por comercio** (`products`):
```sql
UPDATE products SET barcode = NULL WHERE TRIM(barcode) = ''
SELECT business_id, barcode, COUNT(*) AS cantidad FROM products WHERE barcode IS NOT NULL GROUP BY business_id, barcode HAVING COUNT(*) > 1
ALTER TABLE products ADD UNIQUE INDEX uq_products_business_barcode (business_id, barcode)
```
La segunda consulta tiene que devolver 0 filas antes de crear el índice. El índice también está declarado en `product.model.js`.

## Flujo de trabajo

El repositorio es único y contiene `backend/` y `frontend/`. **Hacer `git add` y `commit` desde la raíz del repo**: si se hace desde una sola de las carpetas, los cambios de la otra no se incluyen.

1. Trabajar en la rama `staging` y hacer push: Railway y Vercel despliegan solos en staging.
2. Probar en la URL de staging.
3. Si hubo cambios de base, correrlos en producción **antes** del merge (ver arriba).
4. Si todo anda bien, pasar a producción:
```bash
git checkout main
git pull
git merge staging
git push
git checkout staging
```
5. Si se agrega una dependencia nueva, hacer `npm install <paquete>` en la carpeta correspondiente y subir `package.json` y `package-lock.json` juntos. Si falta, el deploy falla con `Cannot find package`.

## Backups
Railway Pro: backups diarios (se guardan 6 días), semanales (27 días) y mensuales (89 días) del MySQL de producción. Restaurar: servicio MySQL → Backups → elegir fecha → Restore → revisar → Deploy (crea un volumen nuevo).

## Textos legales
La versión vigente de los términos y del aviso de privacidad está en `src/utils/legal.js` y debe coincidir con `LEGAL_VERSION` del frontend.