# Talarix: Backend

API de gestión para pequeños comercios (stock, clientes, proveedores, compras, remitos, formas de pago, cuotas, descuentos e IVA). Multi-comercio: una sola base de datos, con los datos de cada comercio separados por `businessId`.

**Stack:** Node.js, Express, Sequelize, MySQL. Desplegado en Railway.

## Entornos

| Entorno | Rama | Backend | Frontend |
|---|---|---|---|
| Producción | `main` | Railway (production) | Vercel (production) |
| Staging | `staging` | Railway (staging, base propia) | Vercel (preview de la rama `staging`) |

Los cambios se prueban primero en `staging` y después se pasan a `main` (ver "Flujo de trabajo").

## Requisitos
- Node.js (versión recomendada: 20 o superior) (verificar)
- MySQL local o acceso a una base de desarrollo

## Puesta en marcha local
```bash
npm install
cp .env.example .env   # si no existe, crear .env con las variables de abajo
npm run dev
```

## Variables de entorno

El servidor valida las variables al arrancar y no inicia si faltan las obligatorias.

| Variable | Descripción |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a MySQL |
| `JWT_SECRET` | Firma de los tokens de usuarios (8 h) |
| `PLATFORM_JWT_SECRET` | Firma de los tokens del superadmin (2 h). Debe ser **distinta** de `JWT_SECRET` |
| `APP_URL` | URL pública del frontend (se usa en los links de invitación) |
| `CORS_ORIGIN` | Origen(es) permitido(s) del frontend, sin barra final |
| `NODE_ENV` | `production` en Railway (oculta detalles de errores) |
| `DEMO_RESET_ENABLED` | `false` desactiva el reinicio nocturno de la demo (en staging va en `false`) |

En Railway, los `DB_*` se cargan como referencias a la base del propio entorno, por ejemplo `${{MySQL.MYSQLHOST}}`. Nunca uses los secretos de producción en staging.

## Estructura
```
controllers/   lógica de cada recurso
routes/        definición de rutas
models/        modelos Sequelize
middlewares/   auth, roles, plataforma, demo, errores
services/      servicios (p. ej. datos de la cuenta demo)
jobs/          tareas programadas (reinicio nocturno de la demo)
utils/         ayudas (pick, números, tokens de invitación, versión de términos)
scripts/       scripts de operación (crear superadmin)
```
(Ajustar si las carpetas están dentro de `src/`.)

## Seguridad y multi-comercio
- Todo recurso se filtra por `req.user.businessId`. El middleware de autenticación revalida en cada request que el usuario esté activo y con contraseña, y que el comercio esté activo.
- Roles: `admin`, `editor`, `operador`.
- El **superadmin** usa un login y un token aparte (`/api/platform/*`). Ve metadatos de cuentas, nunca contenido de los comercios ni contraseñas.
- Los usuarios no se registran solos: se crean por **invitación** (link de un solo uso, vence a los 7 días; en base solo se guarda el hash del token). Reinvitar también sirve para recuperar contraseña.
- La activación exige aceptar los términos y registra versión, fecha e IP de la aceptación.
- Protecciones: `helmet`, límites de intentos en login y activación, lista de orígenes CORS, validaciones numéricas y de pertenencia entre comercios.
- Cuenta **demo** (`Business.type = 'demo'`): datos de ejemplo, se reinicia todas las noches a las 03:00 (hora de Buenos Aires), con gestión de usuarios e importación bloqueadas.

## Superadmin
Crear el primer superadmin (apuntando a la base del entorno correspondiente):
```bash
DB_HOST=... DB_PORT=... DB_NAME=... DB_USER=... DB_PASSWORD='...' \
PLATFORM_ADMIN_EMAIL=mail@dominio.com PLATFORM_ADMIN_PASSWORD='...' PLATFORM_ADMIN_NAME='Nombre' \
node scripts/createPlatformAdmin.js
```
Para correrlo contra Railway hay que habilitar temporalmente el TCP Proxy del MySQL y **desactivarlo al terminar**.

## Cambios en la base de datos
`sequelize.sync()` solo **crea tablas nuevas**; no modifica columnas existentes. Los cambios de columnas se hacen con `ALTER TABLE` manual, **primero en staging y después en producción**, una sentencia por vez.

## Flujo de trabajo
1. Trabajar en la rama `staging` y hacer push: Railway y Vercel despliegan solos en staging.
2. Probar en la URL de staging.
3. Si anda bien, pasar a producción:
```bash
git checkout main
git pull
git merge staging
git push
git checkout staging
```
4. Si hubo `ALTER TABLE`, correrlo en producción **antes** de hacer el merge.

## Backups
Railway Pro: backups diarios (se guardan 6 días), semanales (27 días) y mensuales (89 días) del MySQL de producción. Restaurar: servicio MySQL → Backups → elegir fecha → Restore → revisar → Deploy (crea un volumen nuevo).

## Textos legales
La versión vigente de los términos y del aviso de privacidad está en `utils/legal.js` y debe coincidir con `LEGAL_VERSION` del frontend.