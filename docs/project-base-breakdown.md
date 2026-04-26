# Proyecto Base - Explicacion por partes

Este documento describe el proyecto base actual, archivo por archivo, con enfoque en lo necesario para construir la prueba tecnica de Shopify Affiliate & Commission Engine.

## 1) Vista general del proyecto

El proyecto esta montado sobre:

- React Router (app embebida de Shopify)
- TypeScript
- App Bridge / Shopify app runtime
- Prisma + SQLite

La base ya incluye autenticacion con Shopify, manejo de sesiones y estructura de rutas para empezar a construir los modulos de afiliados, tracking y billing.

## 2) Carpeta `app/` (aplicacion principal)

### `app/root.tsx`

- Define el documento HTML raiz.
- Renderiza `<Outlet />` para enrutar vistas.
- Carga recursos globales (`Meta`, `Links`, `Scripts`).

### `app/entry.server.tsx`

- Punto de entrada del renderizado del lado servidor.
- Necesario para funcionamiento del framework en entorno server.

### `app/routes.ts`

- Configuracion de rutas via `flatRoutes()`.
- Permite mapear archivos de `app/routes/*` a rutas de la app.

### `app/shopify.server.ts`

- Archivo central de integracion con Shopify.
- Configura `shopifyApp(...)` con:
  - `apiKey`, `apiSecretKey`, `appUrl`, `scopes`
  - version de API
  - almacenamiento de sesiones Prisma
- Exporta utilidades clave:
  - `authenticate`
  - `registerWebhooks`
  - `login`
  - `sessionStorage`

Es el nucleo de seguridad/autenticacion para loaders/actions protegidos.

### `app/db.server.ts`

- Inicializa y exporta cliente Prisma.
- Es la puerta de acceso a base de datos desde rutas/servicios.

### `app/globals.d.ts` y `env.d.ts`

- Tipados globales y de entorno para TypeScript.
- Ayudan a evitar errores de tipos en build y desarrollo.

## 3) Carpeta `app/routes/` (flujo HTTP/UI)

### `app/routes/_index/route.tsx`

- Landing inicial de la app.
- Redirige al flujo embebido cuando corresponde y muestra formulario de login en escenarios aplicables.

### `app/routes/auth.$.tsx`

- Manejador de autenticacion OAuth embebida de Shopify.
- Parte del flujo de instalacion y renovacion de sesion.

### `app/routes/auth.login/route.tsx`

- Endpoint/route para iniciar login por dominio de tienda.

### `app/routes/auth.login/error.server.tsx`

- Manejo de errores del flujo de autenticacion.

### `app/routes/app.tsx`

- Layout autenticado de la seccion embebida (`/app`).
- Aplica `authenticate.admin(request)` en loader.
- Renderiza navegacion principal y `<Outlet />`.

### `app/routes/app._index.tsx`

- Home interna de `/app`.
- Actualmente actua como pantalla base limpia para empezar el MVP.

### `app/routes/webhooks.app.uninstalled.tsx`

- Procesa webhook cuando se desinstala la app.
- Se usa para limpieza de sesion/datos de instalacion por tienda.

## 4) Carpeta `prisma/` (persistencia)

### `prisma/schema.prisma`

- Define datasource SQLite y modelos actuales.
- Actualmente contiene base de sesiones de Shopify.
- Aqui se agregaran entidades del dominio:
  - `Affiliate`
  - `ReferralVisit`
  - `ConversionEvent`
  - `UsageChargeLog`

### `prisma/migrations/*`

- Historial de migraciones SQL.
- Permite versionar cambios de base de datos.

## 5) Archivos de configuracion raiz

### `package.json`

- Scripts de desarrollo y operacion:
  - `dev`, `build`, `start`
  - `setup` (prisma generate + migrate deploy)
  - `lint`, `typecheck`
- Dependencias base del stack Shopify + React Router + Prisma.

### `shopify.app.toml`

- Configuracion de app para Shopify CLI y Partner context.
- Define:
  - `client_id`, `application_url`
  - scopes
  - webhooks app-specific
  - comportamiento de build/dev

### `shopify.web.toml.liquid`

- Config de comandos web para `shopify app dev`.
- Orquesta `prisma` + servidor web durante desarrollo local.

### `vite.config.ts`

- Configuracion de bundling/dev server para React Router.

### `tsconfig.json`

- Configuracion TypeScript del proyecto.

### `.eslintrc.cjs` y `.eslintignore`

- Reglas de lint y exclusiones.
- Base de calidad para merges a `main`.

### `.gitignore`

- Evita subir artefactos locales, secretos y salidas generadas.

## 6) Que ya esta resuelto vs que falta

## Ya resuelto por el proyecto base

- Estructura de app embebida Shopify.
- Autenticacion y sesion por tienda.
- Webhook de desinstalacion.
- Stack obligatorio alineado con la prueba.

## Falta implementar para cumplir requisitos

- CRUD de afiliados y configuracion de comision.
- Captura `?ref=` client-side y persistencia de visita.
- Web Pixel (`checkout_completed`) y envio de conversiones.
- Endpoint backend de conversion con idempotencia.
- Creacion de UsageRecord (5%).
- Dashboard de metricas.
- README final con sustentacion de arquitectura/DevOps/escalabilidad.

## 7) Orden sugerido de desarrollo sobre esta base

1. Modelado Prisma del dominio.
2. CRUD de afiliados.
3. Tracking de referencia (`ref`).
4. Ingestion de conversiones desde pixel.
5. Billing usage con idempotencia.
6. Dashboard y documentacion final.
