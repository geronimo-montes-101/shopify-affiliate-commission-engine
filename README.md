# Shopify Affiliate & Commission Engine

Base limpia para la prueba tecnica de Converxity.

## Stack

- React Router + TypeScript
- Shopify App Bridge / Embedded App
- Prisma + SQLite

## Desarrollo local

1. Instala dependencias:

```bash
npm install
```

2. Crea y aplica esquema de Prisma:

```bash
npm run setup
```

3. Ejecuta en modo desarrollo:

```bash
npm run dev
```

## Alcance objetivo del MVP

- Dashboard de metricas de afiliados
- CRUD de afiliados con porcentaje de comision
- Captura de `ref` en cliente
- Web Pixel con `checkout_completed`
- Creacion de UsageRecord (5% por venta referida)

## Nota

Este repositorio fue simplificado para eliminar codigo y documentos de plantilla no necesarios para la prueba.
