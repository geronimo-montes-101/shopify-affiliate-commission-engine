# Entrega inicial - Sustentacion tecnica

Este documento consolida la base inicial solicitada para la prueba tecnica de **Shopify Affiliate & Commission Engine**.

## 1) Instrucciones: instalacion y ejecucion local

### Requisitos

- Node.js 20+
- npm 10+
- Shopify CLI autenticado (`shopify login`)
- Tienda de desarrollo Shopify

### Variables de entorno

Configurar en `.env`:

```env
SHOPIFY_API_KEY_DEV=<client_id>
SHOPIFY_API_SECRET_DEV=<client_secret>
```

> Nota: en fases posteriores se recomienda separar por ambiente (`.env.development`, `.env.staging`, `.env.production`) y no reutilizar secretos entre entornos.

### Instalacion

1. Instalar dependencias:
   - `npm install`
2. Generar cliente Prisma:
   - `npx prisma generate`
3. Aplicar migraciones locales:
   - `npx prisma migrate dev`

### Vincular app y ejecutar

1. Vincular configuracion con Shopify:
   - `shopify app config link`
2. Levantar en local:
   - `shopify app dev`
3. Verificar:
   - App embebida abre en Admin.
   - OAuth/sesion funciona.
   - Webhook de desinstalacion permanece registrado.

---

## 2) Decisiones de arquitectura

### Estructura elegida y por que

Se eligio arquitectura por capas, sobre la base oficial de Shopify + React Router:

- **Capa UI/Admin**: rutas embebidas para dashboard y CRUD.
- **Capa de aplicacion**: casos de uso (crear afiliado, registrar conversion, cobrar usage).
- **Capa de dominio**: reglas de negocio (comisiones, estados, idempotencia).
- **Capa de infraestructura**: Prisma/DB + Shopify GraphQL Billing API.

Razones:

- Aisla reglas de negocio de detalles de framework.
- Permite pruebas unitarias de casos criticos (billing/idempotencia).
- Facilita evolucion de SQLite a PostgreSQL sin reescribir dominio.

### Alternativas consideradas y descartadas

1. **Monolito sin capas (logica en routes/actions)**  
   - Ventaja: implementacion rapida inicial.  
   - Descartada: acoplamiento alto, dificil testear y escalar en concurrencia.

2. **Event sourcing completo desde el inicio**  
   - Ventaja: trazabilidad extrema y replay natural.  
   - Descartada en MVP: complejidad alta para la ventana de entrega.

3. **MongoDB para eventos desde MVP**  
   - Ventaja: ingestion flexible de eventos.  
   - Descartada por stack requerido (SQLite + Prisma en la prueba).

### Asincronia e idempotencia en eventos de facturacion

Se propone flujo con dos etapas:

1. **Ingestion confiable** del evento de pixel:
   - Validar `shop`, `orderId`, `affiliateCode`, `currency`, `total`.
   - Persistir `EventoConversion` con llave unica `@@unique([tiendaId, ordenId])`.
   - Si llega duplicado, responder exito idempotente (no error 500).

2. **Cobro desacoplado** (sin bloquear ingestion):
   - Registrar trabajo de cobro (`pending`) y procesarlo en worker/cola.
   - Crear `UsageRecord` en Shopify.
   - Guardar resultado en `BitacoraCobroUso` (success/failed/retrying).

Idempotencia de cobro:

- Unico por `eventoConversionId` en bitacora.
- `usageRecordId` unico cuando existe.
- Reintentos con backoff exponencial y jitter.
- Si Shopify responde throttling, no se recalcula evento; solo se reintenta el cobro.

### Adaptacion para alta concurrencia (1000+ tiendas, miles de eventos/min)

- Sustituir SQLite por PostgreSQL.
- Introducir cola (SQS/RabbitMQ/Redis Streams) entre ingestion y billing.
- Particionar procesamiento por `shop` (ordering local por tienda).
- Aplicar control de concurrencia por tienda (worker pool con limites).
- Buffer de eventos y batch de escrituras cuando aplique.
- Reprocesamiento seguro de fallidos via DLQ (dead-letter queue).
- Limites y circuit breaker en llamadas a Admin GraphQL.

---

## 3) Sustentacion de base de datos

### Justificacion tecnica del esquema

Modelo relacional orientado a trazabilidad financiera:

- `Tienda`: tenant.
- `Afiliado`: configuracion y estado del afiliado por tienda.
- `VisitaReferida`: primer contacto y origen de trafico.
- `EventoConversion`: compra atribuida + montos calculados.
- `BitacoraCobroUso`: evidencia de intento/resultado de facturacion.

Este diseño separa claramente:

- **Atribucion** (visita/conversion)
- **Facturacion** (bitacora de cobros)

Lo anterior reduce ambiguedad operativa y mejora auditoria.

### Integridad y rapidez bajo carga

Integridad:

- FKs entre entidades clave.
- llaves unicas para idempotencia (`tiendaId + ordenId`, etc.).
- estados numericos controlados por capa de dominio.

Rendimiento:

- indices compuestos por tienda y fecha para dashboard y conciliacion.
- indices de idempotencia para deduplicacion O(log n).
- queries siempre filtradas por `tiendaId` para multitenancy eficiente.

### Estrategia de indexacion/particionamiento para millones de eventos

En PostgreSQL (produccion):

- **Particion por rango temporal** mensual en `evento_conversion` y `bitacora_cobro_uso`.
- Subparticion opcional por hash de `tienda_id` si el volumen crece mas.
- Indices por particion:
  - `(tienda_id, ocurrido_en desc)`
  - `(tienda_id, afiliado_id, ocurrido_en desc)`
  - unique `(tienda_id, orden_id)`

Politicas adicionales:

- Retencion y archivado historico por ventana (cold storage).
- Materialized views para reportes agregados de alto trafico.

### Consistencia entre reporte Pixel y cargo de facturacion

Usar patron **outbox/transactional enqueue**:

1. En una transaccion DB:
   - Insert/Upsert de `EventoConversion`.
   - Insert de item pendiente de cobro (outbox/job).
2. Worker consume outbox y ejecuta `UsageRecord`.
3. Resultado se guarda en `BitacoraCobroUso`.
4. Job se marca procesado.

Con esto se evita:

- evento guardado sin intento de cobro,
- cobro ejecutado sin rastro persistido.

---

## 4) Sustentacion DevOps (seccion 3.E)

### Gestion de entornos (dev/staging/prod)

- **Dev**: desarrollo local con `shopify app dev`, DB local y app de Partner de desarrollo.
- **Staging**: app separada en Partner Dashboard, secretos propios, tienda de QA.
- **Prod**: app productiva separada, secretos aislados, controles estrictos de despliegue.

Regla clave: **un app/client id por ambiente**, nunca compartir credenciales entre entornos.

### Pipeline CI/CD propuesto (GitHub Actions)

Checks minimos previos a deploy:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test` (cuando se agregue suite)
5. `npx prisma validate`
6. `npx prisma migrate diff` o verificacion de migraciones
7. Build de app (`npm run build`)
8. Escaneo de secretos/dependencias (CodeQL, Dependabot, Trivy o equivalente)

Luego:

- Deploy automatizado a staging.
- Smoke tests.
- Aprobacion manual para produccion.

### Estrategia de despliegue (VPS/Cloud/Serverless)

Componentes recomendados:

- App server (Node) en Render/Fly.io/AWS ECS/Lambda (segun modelo elegido).
- PostgreSQL gestionado (RDS/Neon/Supabase/Cloud SQL).
- Cola gestionada (SQS o equivalente) para cobros asincronos.
- Observabilidad central (logs, metricas, alertas).

Buenas practicas:

- despliegue inmutable por version (tag/sha),
- migraciones de DB en paso controlado,
- rollback definido (app + migracion reversible cuando aplique).

### Rotacion de secretos

- Secretos en gestor dedicado (AWS Secrets Manager, Doppler, Vault o similar).
- Rotacion programada (ej. cada 60-90 dias) y rotacion inmediata ante incidente.
- Doble secreto temporal durante rotacion (old/new) para cero downtime.
- Nunca secretos en repo ni en logs.
- Auditoria de accesos y principio de minimo privilegio.

### Monitoreo de salud (health checks)

Exponer:

- `GET /health/live` (proceso arriba).
- `GET /health/ready` (DB conectada + dependencias minimas).

Monitoreo recomendado:

- **Metricas**: latencia p95/p99, tasa de error, jobs en cola, reintentos, throttling GraphQL.
- **Logs estructurados**: `shop`, `orderId`, `eventId`, `jobId`.
- **Alertas**:
  - caida de readiness,
  - crecimiento anormal de DLQ,
  - errores de billing por encima de umbral.

---

## 5) Siguiente paso recomendado

Con esta base documentada, el siguiente hito es implementar:

1. migracion inicial del modelo Prisma ya definido,
2. servicio de `ConversionEvent` con idempotencia,
3. worker de `UsageRecord` con reintentos y bitacora.
