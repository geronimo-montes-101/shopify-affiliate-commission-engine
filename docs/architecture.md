# Shopify Affiliate & Commission Engine - Arquitectura objetivo

## 1) Contexto de la prueba

La aplicacion debe cumplir con:

- Admin de merchant (dashboard + CRUD de afiliados + % de comision por afiliado)
- Captura de trafico por `?ref=...` en storefront (persistencia client-side)
- Conversion tracking via Web Pixel (`checkout_completed`)
- Billing por uso con regla fija del 5% sobre ventas referidas
- Sustento tecnico de seguridad, idempotencia, rate limits y escalabilidad

## 2) Enfoque arquitectonico

No es solo una app CRUD. Es un sistema de eventos financieros con pipeline:

Storefront -> captura `ref` -> checkout_completed -> backend de conversiones ->
persistencia e idempotencia -> calculo de cargo -> Shopify Billing API.

## 3) Componentes principales

### 3.1 Admin embebido (React Router + Polaris + App Bridge)

- Gestiona afiliados y configuracion de comisiones por tienda.
- Muestra metricas agregadas:
  - total ventas referidas
  - total comisiones de la app (5%)
  - total comisiones a afiliados

### 3.2 Tracking de trafico (client-side)

- Al detectar `?ref=AFFILIATE_CODE` se persiste en cliente (cookie o localStorage).
- Se recomienda incluir:
  - `affiliateCode`
  - `firstSeenAt`
  - `landingPath`
  - `sessionId` (uuid)

### 3.3 Web Pixel extension

- Se suscribe a `checkout_completed` (sin ScriptTags legacy).
- Lee el ref persistido y genera payload de conversion.
- Publica evento al backend de la app con metadatos minimos de orden.

### 3.4 Backend de conversiones

Responsabilidades:

- Autenticar y validar integridad del evento.
- Verificar que el afiliado exista y pertenezca a la tienda.
- Aplicar idempotencia por `shop + orderId` (y opcional `eventId`).
- Persistir evento de conversion.
- Calcular `appFee = orderTotal * 0.05`.
- Crear `UsageRecord` en suscripcion activa.
- Persistir resultado de facturacion para auditoria.

### 3.5 Capa de datos (Prisma + SQLite en MVP)

Entidades sugeridas:

- `Affiliate`
- `ReferralVisit`
- `ConversionEvent`
- `UsageChargeLog`

Indices clave:

- `Affiliate(shop, code)` unique
- `ConversionEvent(shop, orderId)` unique
- `UsageChargeLog(shop, usageRecordId)` unique

## 4) Flujo critico (end-to-end)

1. Cliente entra con `?ref=TIENDASMART`.
2. Frontend persiste referencia en cliente.
3. En compra completada, pixel dispara `checkout_completed`.
4. Pixel envia conversion al backend.
5. Backend valida, deduplica y guarda conversion.
6. Backend calcula 5% y crea UsageRecord.
7. Backend guarda evidencia de charge y estado final.
8. Dashboard refleja metricas agregadas.

## 5) Seguridad y robustez

- Validacion estricta de payload y sanitizacion de entradas.
- Idempotencia obligatoria para evitar doble cobro.
- Timeouts, reintentos controlados y backoff para Admin GraphQL.
- Registro de errores con contexto (`shop`, `orderId`, `eventId`).
- No confiar en datos de cliente sin validacion server-side.

## 6) Escalabilidad (diseno hacia produccion)

Aunque el MVP use SQLite:

- Mantener servicios desacoplados por responsabilidad.
- Preparar migracion a PostgreSQL sin romper contratos de dominio.
- Definir estrategia de cola para billing en picos (worker async).
- Guardar estados transicionales de facturacion (`pending/success/failed`).
- Diseñar para re-procesamiento seguro de eventos fallidos.

## 7) Decision recomendada para la prueba

Priorizar exactitud funcional y trazabilidad:

1. Modelo de datos + idempotencia
2. CRUD afiliados
3. Tracking ref
4. Pixel checkout_completed
5. UsageRecord
6. Dashboard y README de sustentacion
